var React   = require("react");
var Leaflet = require("leaflet");

//
// Leaflet Base Instance
//
var LeafletMap = React.createClass({

  getInitialState: function () {

    return {};
  },

  componentDidMount: function() {
    var mapOptions = {
      "scrollWheelZoom" : false
    };

    L.Util.extend(mapOptions, this.props.mapOptions || {});

    var map = L.map(this.getDOMNode().querySelector(".leaflet-container"), mapOptions)
      .setView(this.props.location, this.props.zoom);

    this.map = map;
    this.setState({map: map});

    /*
    React.Children.forEach(this.props.children, function(child, i) {

      if (child.props.leafletLayer.hasOwnProperty('setZIndex')) child.props.leafletLayer.setZIndex(i+10);

      child.props.leafletLayer.addTo(map);

    });
    */

    if (this.props.mapMoveEndHandler &&
        typeof this.props.mapMoveEndHandler === "function") {

      map.on('moveend', this.onMapMoveEnd);
    }
  },

  componentWillUnmount: function() {
    this.map.off('moveend', this.onMapMoveEnd);
    this.map.remove();
    this.map = null;
  },

  componentDidUpdate: function() {

  },

  onMapClick: function(e) {

  },

  onMapMoveEnd: function(e) {
    this.props.mapMoveEndHandler(this.map.getCenter(), this.map.getZoom());
  },

  render: function() {
    var map = this.map;
    const children = map ? React.Children.map(this.props.children, function(child, i) {
      var zIndex = child.props.zIndex ? child.props.zIndex : i - 10;
      return child ? React.cloneElement(child, {mapref: map, zIndex: zIndex}) : null;
    }) : null;
    return (
        <div className={"component population-map " + this.props.className}>
          <div className="leaflet-container"></div>
          {children}
        </div>
    );
  }

});

//
// Leaflet tile layer
//
var TileLayer = React.createClass({

  getInitialState: function () {

    return {};
  },

  componentDidMount: function() {
    this.leafletLayer = L.tileLayer(this.props.src, this.props);
    this.leafletLayer.addTo(this.props.mapref);
    this.leafletLayer.setZIndex(this.props.zIndex || 1);
  },

  componentWillUnmount: function() {
    if (this.props.mapref) this.props.mapref.removeLayer(this.leafletLayer);
    this.leafletLayer = null;
  },

  render: function() {

    return false;

  }

});

//
// Leaflet geoJSON layer
//
var GeoJSONLayer = React.createClass({

  getInitialState: function () {

    return {newFeatures: false, selectedFeature: null};
  },

  newFeatureCount: 0,
  selectedFeature: null,

  addFeatures: function() {
    if (!this.layer) return;
    if (!this.props.featuregroup.features.length) return;
    if (!this.props.mapref) return;

    var map = this.props.mapref;
    var that = this;

    this.props.featuregroup.features.forEach(function(feature) {
      that.layer.addData(feature);
    });

    if (this.props.onClick) {
      this.layer.eachLayer(function(layer) {
        layer.on('click', function(e) {
          that.props.onClick(layer, e);
        });
      });
    }

    var featureBounds;
    if (this.props.centerGeography && this.layer._map && this.state.newFeatures && this.newFeatureCount >= 1) {
      if (this.props.selectedFeature) {
        this.layer.eachLayer(function(layer) {
          if (layer.feature.properties.nhgis_join === that.props.selectedFeature) {
            featureBounds = layer.getBounds();
          }
        });
      } else {
        featureBounds = this.layer.getBounds();
      }

      if (!featureBounds.isValid()) return;
      map.setView(featureBounds.getCenter(), this.layer._map.getZoom());

    } else if (this.props.panIntoView && this.layer._map &&
          this.newFeatureCount >= 1 && this.state.newSelection && this.props.selectedFeature) {
      this.layer.eachLayer(function(layer) {
        if (layer.feature.properties.nhgis_join === that.props.selectedFeature) {
          featureBounds = layer.getBounds();
        }
      });

      var mapBounds = map.getBounds();

      if (!featureBounds) return;
      if (!featureBounds.isValid() || !mapBounds.isValid()) return;

      // Taken from -- https://github.com/Leaflet/Leaflet/blob/master/src/layer/Popup.js#L250-L288
      if (!mapBounds.contains(featureBounds)) {
        var tl = map.latLngToContainerPoint([featureBounds.getNorth(), featureBounds.getWest()]),
            br = map.latLngToContainerPoint([featureBounds.getSouth(), featureBounds.getEast()]),
            w = br.x - tl.x,
            h = br.y - tl.y,
            size = map.getSize(),
            dx = 0,
            dy = 0;

        if (tl.x + w > size.x) { // right
          dx = tl.x + w - size.x;
        }
        if (tl.x - dx < 0) { // left
          dx = tl.x;
        }
        if (tl.y + h > size.y) { // bottom
          dy = tl.y + h - size.y;
        }
        if (tl.y - dy < 0) { // top
          dy = tl.y;
        }

        if (dx || dy) {
          map
          .fire('autopanstart')
          .panBy([dx, dy]);
        }
      }
    }

    this.selectedFeature = this.props.selectedFeature;
    this.newFeatureCount++;
  },

  componentWillReceiveProps: function(nextProps) {
    // will not trigger a re-render
    this.setState({
      newFeatures: nextProps.featuregroup !== this.props.featuregroup,
      newSelection: nextProps.selectedFeature !== this.selectedFeature
    });
  },

  componentDidMount: function() {
    this.layer = L.geoJson(null, this.props);

    this.leafletLayer = this.layer;
    this.leafletLayer.addTo(this.props.mapref);
    this.leafletLayer.setZIndex(this.props.zIndex || 1);

    this.addFeatures();
  },

  componentWillUnmount: function() {
    if (this.props.onClick && this.layer) {
      this.layer.off("click", this.props.onClick);
    }

    if (this.props.mapref) this.props.mapref.removeLayer(this.layer);
    this.leafletLayer = null;
    this.layer = null;
  },

  componentDidUpdate: function() {
    var that = this;
    this.layer.eachLayer(function(lyr) {
      if (that.props.onClick) lyr.off("click", that.props.onClick);
      that.layer.removeLayer(lyr);
    });

    this.addFeatures();

  },

  render: function() {

    return false;

  }

});

module.exports = LeafletMap;
module.exports.TileLayer = TileLayer;
module.exports.GeoJSONLayer = GeoJSONLayer;
