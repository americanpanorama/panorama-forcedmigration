//Node modules for dev
var React             = require("react");

//React actions
var PopulationActions = require("./actions/population");

//JS Modules for the client
var browsersugar      = require("browsersugar");
var d3                = require("d3");

var DivergingBarChart = React.createClass({

  getInitialState: function () {
    return {};
  },

  margin:   {top: 10, right: 10, bottom: 2, left: 10},
  barwidth: null,
  format:   null,
  color:    null,
  barMidPoint: 0,
  didFirstDraw: false,
  maxTextWidth: 0,
  maxValueWidths: {},
  countyLookup: {},

  utils: browsersugar.mix({}),

  componentDidMount: function() {
    this.barwidth = d3.scale.linear()
              .domain([0, 25000])
              .range([0, 110]);

    this.format = d3.format(",");

    this.color = d3.scale.sqrt()
              .domain([25000,-25000])
              .range(["#AC3712", "#50a5b2"]);

    this.firstRun();

  },

  componentWillUnmount: function() {
    this.countyLookup = {};
    this.maxTextWidth = 0;
    this.maxValueWidths = {};
    this.didFirstDraw = false;
  },

  updateBarScale: function(year) {
    var width = this.props.width - this.margin.left - this.margin.right;
    var barSpace = width - this.maxTextWidth;
    var maxBarWidth = (barSpace / 2) - this.maxValueWidths[year] - 10;
    this.barMidPoint = this.maxTextWidth + (barSpace / 2);
    this.barwidth.range([0, maxBarWidth])
  },

  ready: function(raw, counties) {
    if (!this.props.width && !this.props.height) return;
    if (!raw || !raw.rows) return;
    var that = this;

    this.props.counties.rows.forEach(function(d) {
      that.countyLookup[d.nhgis_join] = d;
    });


    this.didFirstDraw = true;

    // todo: factor out special logic
    var filtered = [];
    raw.rows.forEach(function(d) {
      d.growth = d.population - d.prev_population - d.inmigrations;

      if (d.nhgis_join in that.countyLookup) {
        var county = that.countyLookup[d.nhgis_join];
        d.name     = county.name;
        d.state    = county.state_terr.replace(" Territory","").replace(" Colony", "").replace(" Republic", "");
        d.per_sqmi = d.population / county.area_sqmi;
        filtered.push(d);
      }
    });

    var data = d3.nest()
      .key(function(d) { return d.state; })
      .key(function(d) { return d.name; })
      .entries(filtered)

    var dates = [1820, 1830, 1840, 1850, 1860];
    var counter = 1;

    data = data.filter(function(r) {return (r.key !== "undefined");});

    data.forEach(function(state) {
      dates.forEach(function(year) {
        state[year] = {
          inmigrations: 0,
          outmigrations: 0
        };
      });

      state.values.forEach(function(county) {
        county.values.forEach(function(d) {
          if (d.inmigrations > 0) {
            state[d.year].inmigrations += d.inmigrations;
          } else {
            state[d.year].outmigrations -= d.inmigrations;
          }
        });
      });

      dates.forEach(function(year) {
        if (state[year].inmigrations > that.barwidth.domain()[1]) that.barwidth.domain([0, state[year].inmigrations]);
        if (state[year].outmigrations > that.barwidth.domain()[1]) that.barwidth.domain([0, state[year].outmigrations]);
      });

    });


    var width = that.props.width - that.margin.left - that.margin.right;
    var height = that.props.height - that.margin.top - that.margin.bottom;

    var svg = d3.select(".component.diverging-bar-chart")
      .append("svg")
        .attr("width",  that.props.width)
        .attr("height", that.props.height)
      .append("g")
        .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

    // run through data to get max text values
    var testText = svg.append('text')
      .style('opacity', 0);

    data.forEach(function(state){
      testText.text(state.key);
      that.maxTextWidth = Math.max(that.maxTextWidth, testText.node().getBBox().width);

      dates.forEach(function(year){
        if (!that.maxValueWidths.hasOwnProperty(year)) that.maxValueWidths[year] = 0;

        testText.text(that.format(state[year].inmigrations));
        var inVal = Math.ceil(testText.node().getBBox().width);
        testText.text(that.format(state[year].outmigrations));
        var outVal = Math.ceil(testText.node().getBBox().width);

        that.maxValueWidths[year] = Math.max(that.maxValueWidths[year], Math.max(inVal, outVal));
      });
    });

    testText.remove();

    this.maxTextWidth = Math.ceil(this.maxTextWidth) + 10;
    var selectedYear = (this.props.selectedDecade) ? +this.props.selectedDecade + 10 : '1820';
    this.updateBarScale(selectedYear);

    // Add text key labels
    // TODO: Provide way for labels to be dynamic
    svg.append("text")
      .attr("class", "key-label clr-inmigration")
      .attr("y", 5)
      .attr("x", this.barMidPoint)
      .attr("dx", -8)
      .attr("text-anchor", "end")
      .attr("alignment-baseline", "middle")
      .text("Inmigration");

    svg.append("text")
      .attr("class", "key-label clr-outmigration")
      .attr("y", 5)
      .attr("x", this.barMidPoint)
      .attr("dx", 8)
      .attr("text-anchor", "start")
      .attr("alignment-baseline", "middle")
      .text("Outmigration");

    var topY = 20;
    svg.append("line")
      .attr("x1", this.barMidPoint)
      .attr("x2", this.barMidPoint)
      .attr("y1", 0)
      .attr("y2", height);

    var row = svg.selectAll("g")
      .data(data)
      .enter().append("g")
      .attr("class", function(stuff) {
        return "row places-state-" + stuff.key.toLowerCase().replace(/\s/g, "-");
      })
      .attr("data-state-key", function(stuff) {
        return stuff.key.toLowerCase().replace(/\s/g, " ")
      })
      .sort(function(a,b) {
        return a.key.toLowerCase() < b.key.toLowerCase() ? -1 : 1;
      })
      .attr("transform", function(d,i) { return "translate(0," + (topY + (16 * i)) + ")"});

    row.append("text")
      .attr("y", 8)
      .attr("x", that.maxTextWidth - 10)
      .attr("text-anchor", "end")
      .attr("alignment-baseline", "middle")
      .text(function(d) { return d.key; });

    row.append("rect")
      .attr("class", "inmigrations")
      .style("fill", that.color.range()[0])
      .attr("y", 0)
      .attr("height", 12)
      .attr("x", function(d) { return that.barMidPoint-that.barwidth(d[selectedYear].inmigrations); })
      .attr("width", function(d) { return that.barwidth(d[selectedYear].inmigrations); });

    row.append("rect")
      .attr("class", "outmigrations")
      .style("fill", that.color.range()[1])
      .attr("y", 0)
      .attr("height", 12)
      .attr("x", function(d) { return that.barMidPoint; })
      .attr("width", function(d) { return that.barwidth(d[selectedYear].outmigrations); });

    row.append("text")
      .attr("class", "outmigrations")
      .attr("alignment-baseline", "middle")
      .attr("dy", 8)
      .attr("dx", function(d) { return that.barMidPoint + that.barwidth(d[selectedYear].outmigrations) + 4; })
      .text(function(d) { return that.format(d[selectedYear].outmigrations); });

    row.append("text")
      .attr("class", "inmigrations")
      .attr("alignment-baseline", "middle")
      .attr("text-anchor", "end")
      .attr("dy", 8)
      .attr("dx", function(d) { return that.barMidPoint - that.barwidth(d[selectedYear].inmigrations) - 4; })
      .text(function(d) { return that.format(d[selectedYear].inmigrations); });
      this.setSelectedGeographicState();


  },

  _rowClick: function(e) {

    var rowElement = this.utils.parentHasClass(e.target, "row");

    if (rowElement) {
      rowElement.classList.add("selected");
      var geoState = rowElement.getAttribute("data-state-key");
      if (geoState !== this.props.selectedGeographicState) {
        PopulationActions.selectGeographicState(geoState, this.props.selectedDecade || null);
      } else {
        PopulationActions.selectGeographicState(null, this.props.selectedDecade || null);
      }
    }

  },

  firstRun: function() {

    var that = this;

    if (!this.didFirstDraw && this.props.counties) {

      this.getDOMNode().addEventListener("click", that._rowClick);

      this.ready(
        that.props.inmigration,
        that.props.counties
      );

    }

  },

  updateChartForDecade: function(decade) {
    var that = this,
        year = parseInt(decade)+10;

    this.updateBarScale(year);


    if (that.row) {
      that.row.selectAll("rect.inmigrations")
        .transition()
        .duration(700)
        .style("fill", that.color.range()[0])
        .attr("x", function(d) { return that.barMidPoint-that.barwidth(d[year].inmigrations); })
        .attr("width", function(d) { return that.barwidth(d[year].inmigrations); });

      that.row.selectAll("rect.outmigrations")
        .transition()
        .duration(700)
        .style("fill", that.color.range()[1])
        .attr("x", function(d) { return that.barMidPoint; })
        .attr("width", function(d) { return that.barwidth(d[year].outmigrations); });

      that.row.selectAll("text.outmigrations")
        .transition()
        .duration(700)
        .attr("dx", function(d) { return that.barMidPoint + that.barwidth(d[year].outmigrations) + 4; })
        .text(function(d) { return that.format(d[year].outmigrations); });

      that.row.selectAll("text.inmigrations")
        .transition()
        .duration(700)
        .attr("dx", function(d) { return that.barMidPoint - that.barwidth(d[year].inmigrations) - 4; })
        .text(function(d) { return that.format(d[year].inmigrations); });
    }

  },

  clearSelectedGeographicState: function() {

    var stateElements = this.getDOMNode().querySelectorAll(".row.selected");

    for (var i=0; stateElements.length > i; i++) {

      stateElements[i].classList.remove("selected");

    }

  },

  setSelectedGeographicState: function() {

    if (this.props.selectedGeographicState) {

      var stateElement = this.getDOMNode().querySelector(".row.places-state-" + this.props.selectedGeographicState.replace(/\s/g, "-"));

      if (stateElement) {
        stateElement.classList.add("selected");
      }

    }

  },

  componentDidUpdate: function() {

    this.firstRun();

    if (this.didFirstDraw) {
      this.clearSelectedGeographicState();

      this.updateChartForDecade(this.props.selectedDecade);

      this.setSelectedGeographicState();
    }

  },

  render: function() {

    return (
      <div className={"component diverging-bar-chart " + (this.props.selectedGeographicState ? "state-selected" : "no-state-selected")}>
      </div>
    );
  }

});

module.exports = DivergingBarChart;
