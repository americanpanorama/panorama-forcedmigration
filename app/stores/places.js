var AppDispatcher = require("../dispatchers/app");
var EventEmitter  = require("events").EventEmitter;
var assign        = require("object-assign");
var dslClient     = require("../lib/dslClient");
var AppActions    = require("../actions/app");
var topojson      = require("topojson");

var CHANGE_EVENT       = "change";
var COUNTYBUBBLES_QUERY= "SELECT * from site_countybubbles_materialized";
var COUNTYNAMES_QUERY  = "SELECT * from site_countynames_materialized";
var COUNTY_META_QUERY  = "SELECT county_name, key, nhgis_join, year FROM site_counties_materialized";
var COUNTY_SHAPE_QUERY = "SELECT the_geom, county_name, key, nhgis_join, year FROM site_counties_materialized";
var STATES_QUERY       = "SELECT * FROM site_states_materialized";

var data = {
      bubbles      : null, //This is where population is
      names        : null,
      counties     : {},
      countyShapes : {},
      states       : null
    };

var dataCache = {
  getGeographicStatesFilteredByDecade:null,
  getCountyShapesByDecade:null,
  getCountyMetadataById:{},
  getCountyBubbleById:{},
  statesByDecade: {}
};

var state = {};

function setData(newData) {

  for (var i in newData) {
    if (newData.hasOwnProperty(i)) {
      data[i] = newData[i];
    }
  }

  state.dataLoaded = true;
  PlacesStore.emitChange({placestore: 'dataUpdate'});

}

function getCompleteTest(data) {
  return (Object.keys(data).length >= 4);
}

function getRemoteData() {

  var data = {};

  return new Promise(function(resolve, reject) {
    dslClient.sqlRequest(COUNTYBUBBLES_QUERY, function(error, bubblesResponse) {

      if (error) {
        reject(error);
      }

      if (bubblesResponse && bubblesResponse.features) {

        bubblesResponse.features.forEach(function(feature) {

          if (!dataCache.getCountyBubbleById[feature.properties.nhgis_join]) {
            dataCache.getCountyBubbleById[feature.properties.nhgis_join] = [];
          }

          dataCache.getCountyBubbleById[feature.properties.nhgis_join].push(feature.properties);

        });

      }

      data.bubbles = bubblesResponse;

      if (getCompleteTest(data)) {
        resolve(data);
      }

    });

    dslClient.sqlRequest(COUNTYNAMES_QUERY, function(error, namesResponse) {

      if (error) {
        reject(error);
      }

      data.names = namesResponse;

      if (getCompleteTest(data)) {
        resolve(data);
      }

    }, {"format":"JSON"});

    dslClient.sqlRequest(STATES_QUERY, function(error, response) {

      if (error) {
        reject(error);
      }

      data.states = response;

      if (getCompleteTest(data)) {
        resolve(data);
      }

    }, {"format":"GEOJSON"});

    dslClient.sqlRequest(COUNTY_META_QUERY, function(error, response) {

      if (error) {
        reject(error);
      }

      if (response && response.rows) {

        response.rows.forEach(function(row) {

          if (!dataCache.getCountyMetadataById[row.nhgis_join]) {
            dataCache.getCountyMetadataById[row.nhgis_join] = [];
          }

          dataCache.getCountyMetadataById[row.nhgis_join].push(row);

        });

      }

      data.counties = response;

      if (getCompleteTest(data)) {
        resolve(data);
      }

    }, {"format":"JSON"});

  });

}

function getInitialData() {
  getRemoteData().then(function(data) {
    setData(data);
  });
}

function selectDecade(decade) {
  var _state = { decade: decade };

  if (!data.countyShapes[decade]) {
    data.countyShapes[decade] = { fetching: true, data: null };
    dslClient.sqlRequest(COUNTY_SHAPE_QUERY + " WHERE year = '" + (parseInt(decade)+10) + "'", function(error, response) {
      data.countyShapes[decade].fetching = false;
      data.countyShapes[decade].data = response;
      PlacesStore.emitChange(_state);
    }, {"format":"GEOJSON"});
  }
  else {
    PlacesStore.emitChange(_state);
  }
}

function selectGeographicState(geographicState, decade, statePassthrough) {
  var _state = statePassthrough || { 'selectedCounty': null};
  _state["selectedGeographicState"] = geographicState;
  if (!data.countyShapes[decade]) {
    data.countyShapes[decade] = {};
  }

  if (!data.countyShapes[decade][geographicState]) {
    data.countyShapes[decade][geographicState] = {fetching: true, data: null};

    dslClient.sqlRequest(COUNTY_SHAPE_QUERY + " WHERE year = '" + (parseInt(decade)+10) + "' AND key = '" + geographicState + "'", function(error, response) {
      data.countyShapes[decade][geographicState].fetching = false;
      data.countyShapes[decade][geographicState].data = response;

      PlacesStore.emitChange(_state);

    }, {"format":"GEOJSON"});

  } else {
    PlacesStore.emitChange(_state);
  }


}

function selectCounty(county, geographicState, decade) {
  selectGeographicState(geographicState, decade, {
    "selectedCounty": county
  }); //This will emit the change event

}

var PlacesStore = assign({}, EventEmitter.prototype, {

  emitChange: function(_caller) {

    this.emit(CHANGE_EVENT, _caller);

  },

  getData: function() {
    return data;
  },

  getGeographicStateSelection: function() {
    return state.selectedGeographicState;
  },

  getGeographicStatesFilteredByDecade: function(decade) {

    if (data && data.states && data.states.features) {
      if (dataCache.statesByDecade[decade]) return dataCache.statesByDecade[decade];

      var censusYear = parseInt(decade)+10; //The data is keyed by the census year which is 10 years after the beginning of the decade

      var geoJSONclone = JSON.parse(JSON.stringify(data.states));

      if (geoJSONclone && geoJSONclone.features) {
        dataCache.statesByDecade[decade] = {features: []};
        dataCache.statesByDecade[decade].features = geoJSONclone.features
        .filter(function(feature) {

          return parseInt(feature.properties.year.toString().substring(0,3)+0) === censusYear;

        });

        return dataCache.statesByDecade[decade];
      } else {
        return {features: []};
      }
    } else {
      return {
        features: []
      }
    }

  },

  getCountyShapesByDecade: function(decade) {
    if (decade) {
      var data = PlacesStore.getData();
      if (data.countyShapes[decade] && data.countyShapes[decade].data) {
        return data.countyShapes[decade].data;
      }
      else {
        if (data.countyShapes[decade] && data.countyShapes[decade].fetching) {
          return { features:[] };
        }
        selectDecade(decade);
        return { features:[] };
      }
    }
    else {
      return { features:[] };
    }
  },

  getCountyMetadataById: function(id /*nhgis_join*/) {

    return dataCache.getCountyMetadataById[id];

  },

  getCountyBubbleById: function(id /*nhgis_join*/) {

    return dataCache.getCountyBubbleById[id];

  },

  getCountySelection: function() {
    return state.selectedCounty;
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

      getInitialData(action.state);

      break;

    case "selectGeographicState":

      selectGeographicState(action.geographicState, action.selectedDecade)

      break;

    case "selectCounty":

      selectCounty(action.county, action.geographicState, action.selectedDecade)

      break;

    default:
      // no op
  }
});

module.exports = PlacesStore;
