var AppDispatcher = require('../dispatchers/app');

var PopulationActions = {

  getInitialData: function(state) {
    AppDispatcher.dispatch({
      actionType: "getInitialData",
      state: state
    });
  },

  selectGeographicState: function(geographicState, decade) {

    AppDispatcher.dispatch({
      actionType: "selectGeographicState",
      geographicState: geographicState,
      selectedDecade: decade
    });
  },

  selectCounty: function(county, geographicState, decade) {
    AppDispatcher.dispatch({
      actionType: "selectCounty",
      geographicState: geographicState,
      selectedDecade: decade,
      county: county
    });
  }
}

module.exports = PopulationActions;
