var React             = require("react");
var PopulationActions = require("./actions/population");
var bubbleplot        = require("./lib/bubbleplot.js");
var d3                = require("d3");

var margin = {top: 20, right: 60, bottom: 20, left: 20};

var CountyBubblePlot = React.createClass({

  getInitialState: function () {
    return {};
    /*
    var width = 300;
    var height = 500;
    var margin = {top: 0, right: 80, bottom: 30, left: 20};
    return {
      margin:         margin,
      width:          width - margin.left - margin.right,
      height:         height - margin.top - margin.bottom
    };
    */
  },

  data: {},
  raw: {},
  commaize: d3.format("0,"),
  countyLookup: {},

  componentDidMount: function() {

    this.setState({
      "mounted":  true,
    });

  },

  componentWillUnmount: function() {

  },

  bubbleClick: function(e) {

    var that = this;

    var counties = this.props.counties.rows.filter(function(county) {

      return (e.nhgis_join === county.nhgis_join && (parseInt(county.year)-10) === parseInt(that.props.selectedDecade));

    });

    if (counties.length) {
      PopulationActions.selectCounty(counties[0].nhgis_join, counties[0].key);
    }

  },

  ready: function(raw) {
    var that = this;

    raw.forEach(function(d) {
      d.per_sqmi = d.population / d.area_sqmi;
      d.state_terr = d.state_terr.replace(" Territory", "");
    });


    d3.nest()
      .key(function(d) { return d.year; })
      .entries(raw)
      .forEach(function(d) {
        that.data[d.key] = d.values;
      });

    this.bubble.radius
      .domain(d3.extent(raw, function(d) { return d.population; }));

    this.bubble.data(raw);

    var width = this.bubble.width(),
        height = this.bubble.height(),
        outerWidth = width + margin.left + margin.right,
        outerHeight = height + margin.top + margin.bottom;

    this.bubble.background.selectAll('text').remove();

    if (this.props.showAxisLabels) {

      var y = d3.scale.sqrt()
        .range([height, 15 * height/54, 0])
        .domain([-39000, 0, 15000]).nice();

      var x = d3.scale.log()
        .range([0, width])
        .domain([0.01, 80]).nice();

      this.bubble.background.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + (height - margin.bottom) + ")")
          .call(this.bubble.xAxis)
        .append("text")
          .attr("class", "label")
          .attr("x", width/2)
          .attr("y", margin.bottom - 25)
          .style("text-anchor", "middle")
          .text("Enslaved Persons per Square Mile");

      this.bubble.background.append("text")
          .attr("class", "internal-label")
          .attr("x", width/2)
          .attr("y", y(5000) - 8)
          .style("text-anchor", "middle")
          .text("In-migrations");

      this.bubble.background.append("text")
          .attr("class", "internal-label")
          .attr("x", width/2)
          .attr("y", y(-10000) - 12)
          .style("text-anchor", "middle")
          .text("Out-migrations");

      this.bubble.background.append("g")
          .attr("class", "y axis")
          .attr("transform", "translate(" + (width - margin.right) + ",0)")
          .call(this.bubble.yAxis)
        .append("text")
          .attr("writing-mode", "tb")
          .attr("class", "label")
          .attr("x", -10)
          .attr("y", height * 15/54)
          .style("text-anchor", "middle")
          .text("Net Forced Migrations");
    } else if (this.props.showSimpleLabels) {
      this.bubble.background
        .append("text")
          .attr("class", "label")
          .attr("y", height/2 + 10)
          .attr("x", 50)
          .attr("dy", "-.5em")
          .style("text-anchor", "middle")
          .text("Low Enslaved");

      this.bubble.background
        .append("text")
          .attr("class", "label")
          .attr("y", height/2 + 10)
          .attr("x", 50)
          .attr("dy", ".5em")
          .style("text-anchor", "middle")
          .text("Density");

      this.bubble.background
        .append("text")
          .attr("class", "label")
          .attr("y", height/2-20)
          .attr("x", width - 55)
          .attr("dy", "-.5em")
          .style("text-anchor", "middle")
          .text("High Enslaved");

      this.bubble.background
        .append("text")
          .attr("class", "label")
          .attr("y", height/2-20)
          .attr("x", width-55)
          .attr("dy", ".5em")
          .style("text-anchor", "middle")
          .text("Density");

      this.bubble.background
        .append("text")
          .attr("class", "label")
          .attr("y", 10)
          .attr("x", width/2)
          .attr("dy", ".71em")
          .style("text-anchor", "middle")
          .text("Inmigration");

      this.bubble.background
        .append("text")
          .attr("class", "label")
          .attr("x", width/2)
          .attr("y", height - 10)
          .attr("dy", "0")
          .style("text-anchor", "middle")
          .text("Outmigration");
    }
  },

  simplifyNumber: function(value) {
    if (value >= 1000) {
        var num = Math.floor( ("" + value).length / 3 );
        var base = Math.pow(1000, num);
        return Math.floor(value / base) * base;
    }
    return value;
  },

  makeLegend: function() {
    if (this.props.showLegend && this.bubble && this.state.didFirstDraw) {
      var domain = this.bubble.radius.domain();
      var steps = 4;
      var increment = (domain[domain.length - 1] - domain[0])/(steps - 1);
      var legendData = [];
      var i = 0;

      var sizes = [100, 10000, 20000, 40000, 60000];
      var radius = d3.scale.sqrt()
        .domain(domain)
        .range([0.5, 10]);

      var values = [];
      sizes.forEach(function(size){
        values.push({
          val: size,
          r: radius(size)
        });
      });

      // var n = this.simplifyNumber(domain[0] + i * increment);
      //
      //
      //

      var maxHeight = d3.max(values, function(d){ return d.r * 2});
      var circles = [];
      var maxWidth = 1;

      values.forEach(function(d,t) {
        var c = d.r * 2;
        var x = (t * maxHeight) + (maxHeight/2);
        var y = maxHeight;
        maxWidth = Math.max(maxWidth, x + d.r);

        circles.push(<circle key={'bubblelegend-' + t} className='circle' r={d.r} cx={x} cy={y}></circle>);
      });

      var offsetWidth = maxHeight/2 - values[0].r;
      var translateStr = "translate(" + -offsetWidth + "," + (-maxHeight/2) + ")";
      var w = Math.ceil(maxWidth + 1 - offsetWidth);
      var h = Math.ceil(maxHeight);
      return (
        <div className="bubble-chart-legend">
          <div className="bubble-chart--circles" style={{width: w + "px"}}>
            <svg width={w + "px"} height={h + "px"}>
              <g transform={translateStr}>
              {circles}
              </g>
            </svg>

            <div className="bubble-chart--values">
              <span>{this.commaize(values[0].val)}</span>
              <span>{this.commaize(values[values.length - 1].val)}</span>
            </div>
          </div>

          <p className="bubble-chart-label">enslaved persons</p>

        </div>
      );
    }

    return null;
  },

  updateData: function() {

    var that = this;

    var payload = this.props;

    if (!that.state.didFirstDraw && payload && payload.bubbles && payload.bubbles.features) {

      that.ready(payload.bubbles.features.map(function(feature) {
        return feature.properties;
      }));

      that.setState({didFirstDraw:true});
    }

    if (payload && payload.bubbles && payload.bubbles.features) {
      that.bubble(that.data[parseInt(that.props.selectedDecade) + 10]);
    }
  },

  clearCountySelections: function() {

    var countyElements = this.getDOMNode().querySelectorAll(".dot.selected");

    for (var i=0; countyElements.length > i; i++) {

      countyElements[i].classList.remove("selected");

    }

  },

  selectCounty: function(county) {

    this.clearCountySelections();

    var countyElements = this.getDOMNode().querySelector(".dot-" + this.props.selectedCounty);

    if (countyElements) {
      countyElements.classList.add("selected");
    }

  },

  updateView: function() {

    this.updateData();

    if (this.props.selectedCounty) {
      this.getDOMNode().classList.add("county-selected");
    } else {
      this.getDOMNode().classList.remove("county-selected");
    }

    this.selectCounty(this.props.selectedCounty);

  },


  componentDidUpdate: function() {
    var that = this;

    if (!that.first && that.props.width && that.props.height) {
      that.first = true;

      var bubble = bubbleplot(".component.county-bubble-plot", {"click":that.bubbleClick, "width": that.props.width, "height": that.props.height, "margin": margin });

      that.bubble = bubble;

        bubble.color(function(d) {
          if (d > 0) return "#ac3612";
          if (d <= 0) return "#50a5b2";
        });

        that.updateView();
        that.updateLabelPosition();
    }

    if (that.first) {
      that.updateView();
      that.updateLabelPosition();
    }

  },

  getCountyName: function() {
    var that = this;

    if (this.props.selectedCountyMetadata && this.props.selectedCountyMetadata.length) {
      var decadeMetadata = this.props.selectedCountyMetadata.filter(function(item) {
        return parseInt(item.year) === parseInt(that.props.selectedDecade)+10;
      });

      if (decadeMetadata.length) {
        return decadeMetadata[0].county_name;
      } else {
        return "";
      }
    } else {
      return "";
    }

  },

  updateLabelPosition: function() {

    var countyElement = this.getDOMNode().querySelector(".dot.selected");
    var labelElement  = this.getDOMNode().querySelector(".county-label");
    var svgElement    = this.getDOMNode().querySelector("svg");
    var offset        = 5;

    if (countyElement) {
      var parentOffset = svgElement.getBoundingClientRect();
      labelElement.style.position = "absolute";
      labelElement.style.top      = (svgElement.offsetTop + parseInt(countyElement.getAttribute("cy")) - offset) + "px";
      labelElement.style.left     = ((svgElement.offsetLeft + parentOffset.left + parseInt(countyElement.getAttribute("cx"))) - offset) + "px";
      labelElement.style.display  = "block";
    } else {
      labelElement.style.display  = "none";
    }

  },

  render: function() {

    return (
      <div className='component county-bubble-plot'>
        {this.makeLegend()}
        <div className="county-label">{this.getCountyName()}</div>

      </div>
    );
  }

});

module.exports = CountyBubblePlot;
