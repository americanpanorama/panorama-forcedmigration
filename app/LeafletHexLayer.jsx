var React         = require("react");
var Leaflet       = require("leaflet");
var CircleLayer   = require("leaflet-circles-2");
var colorbrewer   = require("colorbrewer");
var d3            = require("d3");
var leafletCanvas = require("./lib/leaflet_canvas_layer.js");

//
// LeafletHexLayer canvas layer
//
var LeafletHexLayer = React.createClass({

  getInitialState: function () {
    return {
      newData: false
    };
  },

  componentDidMount: function() {
    var that = this;

    var colorScale = d3.scale.sqrt()
    .domain([1300, 1, 0, -1, -1200])
    .interpolate(d3.interpolateLab);

    var colors = ["#AC3712", "#fff", "#50a5b2"];
    colorScale.range([colors[0], colors[0], colors[1], colors[2], colors[2]]);

    var initalZoom = 5;
    //
    // Circle layer
    //
    var circleLayer = new CircleLayer({
      color : function(val) {
        var c = d3.rgb(colorScale(val));
        var f = Math.max(1, (that.circleLayer._map.getZoom() - 5));
        var o = Math.max(.5, ((f === 1) ? 1 : 1 - (f * 0.07)) );

        return 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + o + ')';
      },

      radius : function(val) {
        var f = (1 / that.circleLayer._map.getZoomScale(5));
        f = f * 0.5;
        that.circleLayer._map.getZoomScale(5);
        return this.radiusScale(val) * f;
      },

      radiusScale : d3.scale.sqrt()
       .domain([0, 1, 1200])
       .range([0, 0.5, 4])
    });

    this.circleLayer = circleLayer;
    this.leafletLayer = L.featureGroup([circleLayer]);

    this.leafletLayer.addTo(this.props.mapref);
    this.leafletLayer.setZIndex(this.props.zIndex || 1);

    this.draw();
  },

  componentWillReceiveProps: function(nextProps) {
    this.setState({newData: nextProps.featuregroup !== this.props.featuregroup});
  },

  componentWillUnmount: function() {
    if (this.props.mapref) this.props.mapref.removeLayer(this.leafletLayer);
    this.circleLayer = null;
    this.leafletLayer = null;
  },

  componentDidUpdate: function() {
    //this.circleLayer._map.getZoom()
    //console.log(this.circleLayer.radius = function(){ return })
    if (this.state.newData) {
      this.draw();
    } else {
      // this.circleLayer.redraw();
    }
  },

  draw: function() {
    this.circleLayer
      .data(this.props.featuregroup.features)
      .redraw();
  },

  render: function() {
    return false;
  }

});

module.exports = LeafletHexLayer;
