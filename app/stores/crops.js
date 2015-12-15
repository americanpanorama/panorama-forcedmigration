var AppDispatcher = require("../dispatchers/app");
var EventEmitter  = require("events").EventEmitter;
var assign        = require("object-assign");
var dslClient     = require("../lib/dslClient");
var AppActions    = require("../actions/app");

var CHANGE_EVENT       = "change";
var CROPSHAPES_QUERY   = "SELECT * from site_crops_materialized";
var COUNTYDETAIL_QUERY = "SELECT count, nhgis_join, crop_category_id, year from site_cropdetails_materialized";

var state = {
  dataLoaded: false
};

var data = {};

var dataCache = {
  getCropDetailsByCountyId: {}
};

function setData(newData) {

  for (var i in newData) {
    if (newData.hasOwnProperty(i)) {
      data[i] = newData[i];
    }
  }

  state.dataLoaded = true;
  PlacesStore.emitChange({});

}

function getInitialData() {

  dslClient.sqlRequest(CROPSHAPES_QUERY, function(error, response) {

    if (error) {

      return false;

    }

    data = response;

    PlacesStore.emitChange({});

  }, {"format":"GEOJSON"});

}

function fetchCountyDetail(id /*ngis_join*/) {

  if (!dataCache.getCropDetailsByCountyId[ id ]) {
    dslClient.sqlRequest(COUNTYDETAIL_QUERY + " WHERE nhgis_join = '" + id + "'", function(error, response) {

      if (error) {

        return false;

      }

      dataCache.getCropDetailsByCountyId[ id ] = response;
      PlacesStore.emitChange({});

    }, {"format":"JSON"});
  }

}

var PlacesStore = assign({}, EventEmitter.prototype, {

  emitChange: function(_caller) {

    this.emit(CHANGE_EVENT, _caller);

  },

  getData: function() {
    return data;
  },

  getCropDetailsByCountyId: function(id /*ngis_join*/) {

    if (id) {
      return dataCache.getCropDetailsByCountyId[ id ];
    }

  },

  getCropsByDecade: function(decade) {

    if (data.features) {

      var geoJSONclone = JSON.parse(JSON.stringify(data));

      geoJSONclone.features = data.features.filter(function(feature) {

        return parseInt((feature.properties.year+"").substring(0,3) + 0) === parseInt(decade);

      });

      return geoJSONclone;

    } else {
      return {"features":[]};
    }

  },

  /**
   * @param {function} callback
   */
  addChangeListener: function(callback) {
    this.on(CHANGE_EVENT, callback);
  },

  /**
   * @param {function} callback
   */
  removeChangeListener: function(callback) {
    this.removeListener(CHANGE_EVENT, callback);
  }

});

// Register callback to handle all updates
AppDispatcher.register(function(action) {

  switch(action.actionType) {

    case "getInitialData":

      getInitialData();

      break;

    case "selectCounty":

      fetchCountyDetail(action.county);

      break;

    default:
      // no op
  }
});

module.exports = PlacesStore;
