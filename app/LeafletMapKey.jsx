var React         = require("react");
var Leaflet       = require("leaflet");
var leafletCanvas = require("./lib/leaflet-legend.js");

var LeafletMapKey = React.createClass({

  getInitialState: function () {
    return {};
  },

  componentDidMount: function() {
    this.leafletLayer = new L.MapKey(this.props.keyOptions || []);
    this.props.mapref.addControl(this.leafletLayer);
  },

  componentWillUnmount: function() {
    if (this.props.mapref) this.props.mapref.removeControl(this.leafletLayer);
    this.leafletLayer = null;
  },

  render: function() {

    return false;

  }

});

module.exports = LeafletMapKey;