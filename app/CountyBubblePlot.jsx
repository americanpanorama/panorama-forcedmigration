var React             = require("react");
var PopulationActions = require("./actions/population");
var bubbleplot        = require("./lib/bubbleplot.js");
var d3                = require("d3");
var addons            = require('react-addons');

var TransitionGroup = addons.TransitionGroup;

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

	selectGeographicState: function() {
		this.clearCountySelections();

		let countyElements = this.getDOMNode().querySelectorAll(".dot-" + this.props.selectedGeographicState.replace(/ /g,''));

		if (countyElements) {
			for (let i = 0; i < countyElements.length; i++) {
				countyElements[i].classList.add("selected");
			}
		}
	},






	componentDidUpdate: function() {

	},





	render: function() {

		console.log(this.props);

		var x = d3.scale.log()
			.range([0, this.props.width])
			.domain([0.01, 80]).nice();

		var y = d3.scale.sqrt()
			.range([0, this.props.height])
			.domain([15000, -39000]);

		return (
			<svg
				width={ this.props.width }
				height={ this.props.height }
			>
				<g class='x axis'>
					{ [1, 5, 10, 25, 50].map(value => {
						return (
							<line 
								x1={ x(value) } 
								x2={ x(value) } 
								y1={ 0 } 
								y2={ this.props.height } 
								style={ {
									strokeWidth: 1,
									stroke: 'grey'
								} }
							/>
						);
					}) }
				</g>

				<g class='y axis'>
					{ [-30000,  -10000,  -5000,  -1000, 0, 1000, 5000,  10000].map(value => {
						return (
							<line 
								x1={ 0 } 
								x2={ this.props.width } 
								y1={ y(value) } 
								y2={ y(value) } 
								style={ {
									strokeWidth: 1,
									stroke: 'grey'
								} }
							/>
						);
					}) }
				</g>

			</svg>
		);
	}

});

module.exports = CountyBubblePlot;
