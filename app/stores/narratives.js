var AppDispatcher = require("../dispatchers/app");
var EventEmitter  = require("events").EventEmitter;
var assign        = require("object-assign");
var dslClient     = require("../lib/dslClient");
var AppActions    = require("../actions/app");

var CHANGE_EVENT = "change";
var QUERY        = "SELECT * FROM site_narratives_materialized";

var state = {
  dataLoaded:     false
};

var data = null;

var decadeCache = {};

function setData(newData) {

  data = newData;
  state.dataLoaded = true;
  NarrativesStore.emitChange({narrativestore: "dataUpdate"});

}

function getInitialData() {

  dslClient.sqlRequest(QUERY, function(err, narratives) {

    if (err) {

      return false;
    }

    setData(narratives);

  }, {"format":"geojson"});

}

var NarrativesStore = assign({}, EventEmitter.prototype, {

  /**
   * Get the entire collection of TODOs.
   * @return {object}
   */

  getNarrativesFilteredByDecade: function(decade) {

    if (data && data.features) {

      if (!decadeCache[decade]) {

        var censusYear   = parseInt(decade)+10; //The data is keyed by the census year which is 10 years after the beginning of the decade
        var geoJSONclone = JSON.parse(JSON.stringify(data));

        if (geoJSONclone && geoJSONclone.features) {
          geoJSONclone.features = geoJSONclone.features
          .filter(function(row) {

            return (parseInt(parseInt(row.properties.year).toString().substring(0,3)+"0")+10 === parseInt(censusYear));

          });

          decadeCache[decade] = geoJSONclone;
        } else {
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

  getYearForNarrativeId: function(id) {

    if (data && data.features) {

      for (var i=0; data.features.length > i; i++) {

        if (parseInt(data.features[i].properties.narrative_id) === parseInt(id)) {
          return parseInt(data.features[i].properties.year);
        }

      }

    }

  },

  getNarrativesForYear: function(year) {

    if (data && data.features) {

      return data.features.filter(function(feature) {

        return parseInt(feature.properties.year) === parseInt(year);

      });

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

    case "selectNarrative":

      selectNarrative(action.id);

      break;

    default:
      // no op
  }
});

module.exports = NarrativesStore;
