var React   = require("react");
var numeral = require('numeral');

var CountyOverlay = React.createClass({

  getInitialState: function () {

    return {};

  },

  county: {},

  hex: {},

  crops: [],

  stateAbbrs: {'alabama': 'AL', 'arkansas': 'AK', 'delaware': 'DE', 'district of columbia': 'DC', 'florida': 'FL', 'georgia': 'GA', 'kentucky': 'KY', 'louisiana': 'LA', 'maryland': 'MD', 'mississippi': 'MS', 'missouri': 'MO', 'north carolina': 'NC', 'orleans': 'Orleans', 'south carolina': 'SC', 'southwest': 'South West', 'tennessee': 'TN', 'texas': 'TX', 'virginia': 'VA'},

  componentDidMount: function() {

   this.setCounty();

  },

  componentDidUpdate: function() {},

  componentWillUnmount: function() {

    this.county = {};
    this.hex = {};
    this.crops  = [];

  },

  setCounty: function() {
    var that = this;
    var county;
    var crops;
    var hex;
    var hexPrevDecade;

    if (this.props.counties) {

      county = this.props.counties.filter(function(row) {

        return parseInt(row.year) === parseInt(that.props.selectedDecade)+10;

      });

      if (county && county.length) {
        this.county = county[0];
      } else {
        this.county = {};
      }

    }

    if (this.props.hex) {

      hex = this.props.hex.filter(function(row) {

        return parseInt(row.year) === parseInt(that.props.selectedDecade)+10;

      });

      if (hex && hex.length) {
        this.hex = hex[0];
      } else {
        this.hex = {};
      }

    }

    if (this.props.crops && this.props.crops.rows) {

      crops = this.props.crops.rows.filter(function(row) {

        return parseInt((row.year+"").substring(0,3)+"0") === parseInt(that.props.selectedDecade);

      });

      if (crops && crops.length) {
        this.crops = crops;
      } else {
        this.crops = [];
      }

    }

  },

  getShowClass: function() {
    return (this.props.selectedCounty && this.county.county_name) ? "show" : "hide";
  },

  getShowCrop(count) {
    return (parseInt(count) > 0) ? 'show' : 'hide';
  },

  getSugar: function() {

    var sugar;

    if (this.crops.length) {

      sugar = this.crops.filter(function(crop) {

        return crop.crop_category_id === 89 || crop.crop_category_id === 29;

      });

      if (sugar.length) {
        return numeral(sugar[0].count).format("0,0") + " lbs";
      } else {
        return "N/A";
      }

    } else {
      return "N/A";
    }

    sugar = null;

  },

  getCotton: function() {

    var cotton;

    if (this.crops.length) {

      cotton = this.crops.filter(function(crop) {

        return crop.crop_category_id === 87 || crop.crop_category_id === 26;

      });

      if (cotton.length) {
        return numeral(cotton[0].count).format("0,0") + " lbs";
      } else {
        return "N/A";
      }

    } else {
      return "N/A";
    }

    cotton = null;

  },

  getMigrationClassName: function(val) {
    if (val) {
      return (val >= 0 ) ? "inmigration" : "outmigration";
    }

    return "";

  },

  getMigrationText: function(val) {
    if (val) {
      return (val >= 0 ) ? "Estimated in-migrations": "Estimated out-migrations";
    }

    return "Migration";

  },

  getCountyText: function() {
    let unit = (this.county.key == 'louisiana') ? 'parish' : 'county';
    let theState = (this.stateAbbrs[this.county.key]) ? this.stateAbbrs[this.county.key] : this.county.key;
    return (this.county.key == 'south carolina') ? (this.county.county_name.replace('Dist.', 'District') + ', SC').toUpperCase() : (this.county.county_name + " " + unit + ", " + theState).toUpperCase();
  },

  checkLoading: function() {
    var r = "";
    if (arguments.length) {
      for(var i=0; i< arguments.length; i++) {
        if (typeof arguments[i] === 'undefined') r = "loading";
      }
    }

    return r;
  },

  render: function() {
    this.setCounty();

    return (
      <div className={"component county-overlay " + this.getShowClass()}>
        <h3>{this.getCountyText()}</h3>
        <button className="close" onClick={this.props.onClick}></button>
        <ul className={this.checkLoading(this.hex.population,this.hex.inmigrations)}>
          <li className={this.getMigrationClassName(this.hex.inmigrations)}>{this.getMigrationText(this.hex.inmigrations)}: <strong>{numeral(Math.abs(this.hex.inmigrations)).format("0,0")}</strong></li>
          <li className="population">Enslaved population in { (parseInt(this.props.selectedDecade) + 10) }: <strong>{numeral(this.hex.population).format("0,0")}</strong></li>
          <li className="population">Enslaved population in { this.props.selectedDecade}: <strong>{numeral(this.hex.prev_population).format("0,0")}</strong></li>
          <li className={"cotton " + this.getShowCrop(this.getCotton())}>Cotton grown in {this.props.selectedDecade - 1}: <strong>{this.getCotton()}</strong></li>
          <li className={"sugar " + this.getShowCrop(this.getSugar())}>Sugar produced in {this.props.selectedDecade - 1}: <strong>{this.getSugar()}</strong></li>
        </ul>
      </div>
    );
  }

});

module.exports = CountyOverlay;
