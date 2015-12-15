var AppDispatcher = require("../dispatchers/app");
var EventEmitter  = require("events").EventEmitter;
var assign        = require("object-assign");
var dslClient     = require("../lib/dslClient");
var AppActions    = require("../actions/app");

var CHANGE_EVENT      = "change";
var HEXBINS_QUERY     = "SELECT * from site_hexbins_materialized";
var INMIGRATION_QUERY = "SELECT * from site_inmigration_materialized";

var state = {
  dataLoaded:     false,
};

var data = {};

var decadeCache = {};

function setData(newData) {

  data = newData;
  state.dataLoaded = true;
  PopulationStore.emitChange({populationstore: 'dataUpdate'});

}

function getInitialData() {

  dslClient.sqlRequest(HEXBINS_QUERY, function(err, hexbinsResponse) {

    if (err) {

      return false;
    }

    dslClient.sqlRequest(INMIGRATION_QUERY, function(err, inmigrationResponse) {

      if (err) {

        return false;
      }

      setData({
        "hexbins":  hexbinsResponse,
        "inmigration": inmigrationResponse
      });
    }, {"format":"json"});
  });

}

var PopulationStore = assign({}, EventEmitter.prototype, {

  /**
   * Get the entire collection of TODOs.
   * @return {object}
   */

  getHexbinDataFilteredByDecade: function(decade) {
    if (data && data.hexbins) {

      if (!decadeCache[decade]) {
        var censusYear   = parseInt(decade) + 10; // The data is keyed by the census year which is 10 years after the beginning of the decade
        var geoJSONclone = JSON.parse(JSON.stringify(data.hexbins));

        if (geoJSONclone && geoJSONclone.features) {
          geoJSONclone.features = geoJSONclone.features
          .filter(function(d) {
            return d.properties.pop_1860 > 10;
          }).map(function(row) {

            row.value = row.properties["mig_" + censusYear];

            return row;

          });

          decadeCache[decade] = geoJSONclone;
        } else {
          return false;
          decadeCache[decade] = false;
        }

      }

      return decadeCache[decade];

    } else {
      return {
        features: []
      }
    }

  },

  getInmigrationDataFilteredByDecade: function(decade) {
    var censusYear   = parseInt(decade) + 10; // The data is keyed by the census year which is 10 years after the beginning of the decade
    var geoJSONclone = JSON.parse(JSON.stringify(data.inmigration));

    if (geoJSONclone && geoJSONclone.rows) {
      geoJSONclone.rows = geoJSONclone.rows
      .filter(function(d) {
        return parseInt(d.year) === parseInt(censusYear);
      });

      return geoJSONclone;
    } else {
      return false;
    }

  },

  getData: function() {
    return data;
  },

  emitChange: function(_caller) {

    this.emit(CHANGE_EVENT, _caller);

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
    if (callback) {
      this.removeListener(CHANGE_EVENT, callback);
    }
  }

});

// Register callback to handle all updates
AppDispatcher.register(function(action) {

  switch(action.actionType) {

    case "getInitialData":

      getInitialData(action.state);

      break;

    default:
      // no op
  }
});

module.exports = PopulationStore;
