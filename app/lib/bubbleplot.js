var colorbrewer = require("colorbrewer");
var d3          = require("d3");

module.exports = function bubbleplot(rootSelector, options) {

  options = options || {};

  var data = [];
  var selected_state = null;
  var color = function() {return '#fff'};

  var margin = options.margin || {top: 0, right: 0, bottom: 0, left: 0},
      width = options.width,
      height = options.height,
      innerWidth = options.width - options.margin.left - options.margin.right,
      innerHeight = options.height - options.margin.top - options.margin.bottom;

  var x = d3.scale.log()
    .range([0, innerWidth])
    .domain([0.01, 80]).nice();

  var y = d3.scale.sqrt()
    .range([innerHeight, 15 * innerHeight/54, 0])
    .domain([-39000, 0, 15000]).nice();

  var radius = d3.scale.sqrt()
    .range([0.5,10]);

  var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom")
      .tickSize(-height)
      .tickValues([1, 10, 20, 40, 100])
      .tickFormat(d3.format(","));

  var yAxis = d3.svg.axis()
      .tickSize(-width)
      .scale(y)
      .orient("right")
      .tickValues([-30000,  -10000,  -5000,  -1000, 0, 1000, 5000,  10000]);

  var svg = d3.select(rootSelector).append("svg")
      .attr("width", width)
      .attr("height", height);

  var background = svg.append("g")
      .attr('class', 'bubbleplot-background')
      // .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
      .attr("transform", "translate(0,0)")
      .attr("width", width)
      .attr("height", height);

  var foreground = svg.append("g")
      .attr('class', 'bubbleplot-foreground')
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  function update(subset) {
    var selection = foreground.selectAll(".dot")
      .data(subset, function(d) { return d.nhgis_join; });

    selection.exit()
      .style("opacity", 0)
      .transition()
      .remove();

    var enter = selection.enter().append("circle")
        .attr("class", function(stuff) {
          return "dot dot-" + stuff.nhgis_join;
        })
        .attr("r", function(d) { return radius(d.population); })
        .attr("cx", function(d) { return Math.max(x(d.per_sqmi),-2) || -2; })
        .attr("cy", function(d) { return y(d.inmigrations); })
        .style("opacity", 0);

    enter
        .on("click", function(e) {

          if (typeof options.click === "function") {
            options.click(e);
          }

        });

    selection
        .sort(function(a,b) { return b.population - a.population; });

    selection.transition()
        .duration(1300)
        .attr("r", function(d) { return radius(d.population); })
        .attr("cx", function(d) { return Math.max(x(d.per_sqmi),-2) || -2; })
        .attr("cy", function(d) { return y(d.inmigrations); })
        .style("fill", function(d) { return color(d.inmigrations); })
        .style("opacity", function(d) {
          if (selected_state) {
            return selected_state == d.state_terr ? 0.9 : 0.1;
          } else {
            return 0.9;
          }
        });
  };

  update.removePaths = function() {
    //background.selectAll("path.county-path-permanent").remove();
  };

  update.highlightReset = function() {
    selected_state = null;
    d3.selectAll("circle")
      .style("opacity", 0.9)
    d3.selectAll(".legend")
      .classed("active", false)
  };

  update.highlightState = function(state) {
    selected_state = state;
    d3.selectAll("circle")
      .style("opacity", 0.1)
      .filter(function(d) { return d.state_terr == state; })
      .style("opacity", 1)
    d3.selectAll(".legend")
      .classed("active", false)
      .filter(function(d) { return d == state; })
      .classed("active", true);
  };

  function updateDimensions() {

    x.range([0, width/10, width/5, 4*width/5, width]);
    xAxis.scale(x);
    svg.attr("width", width + margin.left + margin.right);
    yAxis.tickSize(-width);

    y.range([height, 5*height/6, height/6, 0]);
    yAxis.scale(y);
    svg.attr("height", height + margin.top + margin.bottom);
    xAxis.tickSize(-height);

    foreground.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  }

  update.margin = function(_) {
    if (!arguments.length) return margin;
    margin = _;
    updateDimensions();
    return update;
  };

  update.data = function(_) {
    if (!arguments.length) return data;
    data = _;
    return update;
  };

  update.color = function(_) {
    if (!arguments.length) return color;
    color = _;
    return update;
  };

  update.width = function(_) {
    if (!arguments.length) return width;
    width = _ - margin.left - margin.right;
    updateDimensions();
    return update;
  };

  update.height = function(_) {
    if (!arguments.length) return height;
    height = _ - margin.top - margin.bottom;
    updateDimensions();

    return update;
  };

  update.x = x;
  update.y = y;
  update.xAxis = xAxis;
  update.yAxis = yAxis;
  update.radius = radius;
  update.foreground = foreground;
  update.background = background;

  return update;
};
