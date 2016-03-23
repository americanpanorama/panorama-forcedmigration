var React             = require("react");
var PopulationActions = require("./actions/population");
var browsersugar      = require("browsersugar");

function naturalSort(a, b, column) {
   var re = /(^-?[0-9]+(\.?[0-9]*)[df]?e?[0-9]?$|^0x[0-9a-f]+$|[0-9]+)/gi,
       sre = /(^[ ]*|[ ]*$)/g,
       dre = /(^([\w ]+,?[\w ]+)?[\w ]+,?[\w ]+\d+:\d+(:\d+)?[\w ]?|^\d{1,4}[\/\-]\d{1,4}[\/\-]\d{1,4}|^\w+, \w+ \d+, \d{4})/,
       hre = /^0x[0-9a-f]+$/i,
       ore = /^0/,
       i = function(s) { return naturalSort.insensitive && (''+s).toLowerCase() || ''+s },
       // convert all to strings strip whitespace
       x = i(a[column]).replace(sre, '') || '',
       y = i(b[column]).replace(sre, '') || '',
       // chunk/tokenize
       xN = x.replace(re, '\0$1\0').replace(/\0$/,'').replace(/^\0/,'').split('\0'),
       yN = y.replace(re, '\0$1\0').replace(/\0$/,'').replace(/^\0/,'').split('\0'),
       // numeric, hex or date detection
       xD = parseInt(x.match(hre)) || (xN.length != 1 && x.match(dre) && Date.parse(x)),
       yD = parseInt(y.match(hre)) || xD && y.match(dre) && Date.parse(y) || null,
       oFxNcL, oFyNcL;
   // first try and sort Hex codes or Dates
   if (yD)
       if ( xD < yD ) return -1;
       else if ( xD > yD ) return 1;
   // natural sorting through split numeric strings and default strings
   for(var cLoc=0, numS=Math.max(xN.length, yN.length); cLoc < numS; cLoc++) {
       // find floats not starting with '0', string or 0 if not defined (Clint Priest)
       oFxNcL = !(xN[cLoc] || '').match(ore) && parseFloat(xN[cLoc]) || xN[cLoc] || 0;
       oFyNcL = !(yN[cLoc] || '').match(ore) && parseFloat(yN[cLoc]) || yN[cLoc] || 0;
       // handle numeric vs string comparison - number < string - (Kyle Adams)
       if (isNaN(oFxNcL) !== isNaN(oFyNcL)) { return (isNaN(oFxNcL)) ? 1 : -1; }
       // rely on string comparison if different types - i.e. '02' < 2 != '02' < '2'
       else if (typeof oFxNcL !== typeof oFyNcL) {
           oFxNcL += '';
           oFyNcL += '';
       }
       if (oFxNcL < oFyNcL) return -1;
       if (oFxNcL > oFyNcL) return 1; 
   }
   return 0;
}

var NarrativeAccordion = React.createClass({

  getInitialState: function () {

    return {};

  },

  utils: browsersugar.mix({}),

  componentDidMount: function() {

    var that = this;

    this.setSelectedDisplay();
    this.setScroll();

  },

  componentWillUnmount: function() {

  },

  setSelectedDisplay: function() {

    var narrativeElements = this.getDOMNode().querySelectorAll("ul li");

    for (var i=0; narrativeElements.length > i; i++) {

      if (parseInt(narrativeElements[i].getAttribute("data-narrative-id")) === parseInt(this.props.selectedNarrative)) {
        narrativeElements[i].classList.remove("closed");
        narrativeElements[i].classList.add("selected");
      } else {
        narrativeElements[i].classList.add("closed");
        narrativeElements[i].classList.remove("selected");
      }

    }

  },

  componentDidUpdate: function() {

    this.setSelectedDisplay();
    this.setScroll();

  },

  displayAuthorName: function(name) {
    var nameParts = name.split(",");

    return (nameParts.length && nameParts.length > 1) ? nameParts[0] + (" (and others)") : name;

  },

  yearList: function(year) {

    var that = this;

    return (
      <ul>
        {year.map(function(item, i) {

          return (
            <li key={i} className={"narrative-item closed narrative-item-"+item.properties.narrative_id} data-narrative-id={item.properties.narrative_id} onClick={that.props.onClick}>
              <h4 className="entry-title">{that.displayAuthorName(item.properties.name)}</h4>
              <div className="entry-details">{item.properties.description}</div>
              <div className="citation"><a href={item.properties.link} dangerouslySetInnerHTML={{__html: item.properties.source}} /></div>
            </li>
          )

        })}
      </ul>
    )

  },

  setScroll: function() {

    var narrativeElement = this.getDOMNode().querySelector(".narrative-item-" + this.props.selectedNarrative);

    if (narrativeElement) {
      this.getDOMNode().parentNode.parentNode.scrollTop = narrativeElement.offsetTop - 80;
    }

  },

  itemList: function() {

    var years = {},
        out   = [],
        ids   = [];

    var that = this;

    this.props.narratives.features.filter(function(row) {

      if (ids.indexOf(row.properties.narrative_id) < 0) {

        ids.push(row.properties.narrative_id);
        return true;

      } else {
        return false;
      }

    }).map(function(row) {

      row.year = parseInt(row.properties.year);

      return row;

    }).sort(function(a, b) {

      return naturalSort(a, b, "year");

    }).forEach(function(row)  {

      if (!years[parseInt(row.properties.year)]) {
        years[parseInt(row.properties.year)] = [];
      }

      years[parseInt(row.properties.year)].push(row);

    });

    return Object.keys(years).map(function(key, i) {

      return (
        <div key={i}>
          <h3>{key}</h3>
          {that.yearList(years[key])}
        </div>
      );

    });

  },

  render: function() {

    var that = this;

    return (
      <div className="component narrative-accordion">
        {that.itemList()}
      </div>
    );
  }

});

module.exports = NarrativeAccordion;
