var React   = require("react");
var Leaflet = require("leaflet");

//
// Leaflet cartoDB tile layer
//
var LeafletCartoDBTileLayer = React.createClass({

  getInitialState: function () {

    return {};
  },

  getCartoDBTilesTemplates: function(callback) {

    var that = this;

    cartodb.Tiles.getTiles({
      type: 'cartodb',
      user_name: this.props.userId,
      sublayers: [{
        "sql": this.props.sql,
        "cartocss": this.props.cartocss
      }],
      "maps_api_template": 'https://' + this.props.userId + '.carto.com'
    },
    function(tiles, err) {
      if(tiles == null) {
        callback(err);
      }

      callback(null, tiles);

    });
  },

  componentDidMount: function() {

    var that = this;

    this.leafletLayer = L.tileLayer(this.props.src, this.props);
    this.leafletLayer.addTo(this.props.mapref);
    this.leafletLayer.setZIndex(this.props.zIndex || 1);

    this.getCartoDBTilesTemplates(function(error, response) {

      if (error) {
        console.error(error);
      }

      if (response) {
        that.leafletLayer.setUrl(response.tiles[0]);
      }

    });

    this.leafletLayer.on("tileloadstart", this.onTileLoad, this);

  },

  onTileLoad: function() {
    var that = this;
    if (this.props.className) {
      this.props.className.split(" ").forEach(function(classItem) {

        this.leafletLayer.getContainer().classList.add(classItem);

      });
    }

    this.leafletLayer.off("tileloadstart", this.onTileLoad);
  },

  componentWillUnmount: function() {
    if (!this.leafletLayer) return;
    if (this.props.mapref) this.props.mapref.removeLayer(this.leafletLayer);
    this.leafletLayer = null;
  },

  componentDidUpdate: function() {},

  render: function() {

    return false;

  }

});

module.exports = LeafletCartoDBTileLayer;
