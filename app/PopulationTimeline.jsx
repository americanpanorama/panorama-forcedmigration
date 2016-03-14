var React        = require("react");
var interact     = require("interact.js");
var browsersugar = require("browsersugar");
var d3           = require("d3");

var PopulationTimeline = React.createClass({

  utils: browsersugar.mix({}),

  getInitialState: function () {

    return {
      narrativePointsDrawn: false,
      moving: false
    };

  },

  componentDidMount: function() {

    if (this.props.narratives && !this.state.narrativePointsDrawn) {
      this.drawNarrativeForDecade(this.props.selectedDecade);
    }

    this.initPlayhead();

    this.onWindowResizeCallback = this.utils.debounce(this.updatePlayheadPosition, 10);
    window.addEventListener("resize", this.onWindowResizeCallback);

  },

  componentWillUnmount: function() {
    window.removeEventListener("resize", this.onWindowResizeCallback);
  },

  componentDidUpdate: function() {

    this.clearSelectedDecades();
    this.selectDecade(this.props.selectedDecade);

    if (this.props.narratives && !this.state.narrativePointsDrawn) {
      this.drawNarrativeForDecade(this.props.selectedDecade);
    }

    this.updateYearSelectionState();

  },

  animationStep: function(timestamp) {

    this.updatePlayheadPosition();

    if (this.trackAnimation) {
      window.requestAnimationFrame(this.animationStep);
    }
  },

  startTrackingAnimation: function() {

    if (!this.state.moving) {
      this.trackAnimation = true;
    }

    window.requestAnimationFrame(this.animationStep);

  },

  stopTrackingAnimation: function() {
    this.trackAnimation = false;
  },

  updateYearSelectionState: function() {

    var dotElements = this.getDOMNode().querySelectorAll(".dot");

    for (var i=0; dotElements.length > i; i++) {

      if (parseInt(dotElements[i].getAttribute("data-year")) === parseInt(this.props.selectedNarrativeYear)) {

        dotElements[i].classList.add("selected");

      } else {

        dotElements[i].classList.remove("selected");

      }

    }

    this.startTrackingAnimation();

  },

  _onClick: function(e) {

    var decade = e.target.getAttribute("data-value");

    // Try to get parent's decade if this element doesn't have one. Easily makes
    // years above timeline clickable.
    if (!decade) {
      decade = e.target.parentElement.getAttribute('data-value');
    }

    if (decade) {
      this.props.onDecadeSelect(decade);
    }

  },

  clearSelectedDecades: function() {

    if (!this.state.moving) {
      var decadeElements = this.getDOMNode().querySelectorAll(".decade");

      for (var i=0; decadeElements.length > i; i++) {

        decadeElements[i].classList.remove("selected");

      }
    }

  },

  selectDecade: function(decade) {

    if (!this.state.moving) {

      var decadeElement = this.getDOMNode().querySelector(".decade-" + decade);

      decadeElement.classList.add("selected");

      this.updatePlayheadPosition();

    }

  },

  updatePlayheadPosition: function() {

    var offset = 6;
    var decadeElement = this.getDOMNode().querySelector(".decade-" + this.props.selectedDecade);
    var playheadElement = this.getDOMNode().querySelector(".playhead-container");
    playheadElement.style.left = ((decadeElement.offsetLeft + decadeElement.offsetWidth)-offset) + "px";

  },

  initPlayhead: function() {

    var min            = 12;
    var offset         = 30;
    var that           = this;
    var decadeElements = this.getDOMNode().querySelectorAll(".decade");

    interact(this.getDOMNode().querySelector(".playhead-container")).draggable({
      restrict: {
        restriction: "parent"
      },
      onstart: function(e) {

        that.setState({"moving":true});

      },
      onmove: function(e) {

        if ((e.pageX-offset) > min && that.getDOMNode().offsetWidth-min > (e.pageX-offset)) {
          e.target.style.left = (e.pageX-offset) + "px";
        }

      },
      onend: function(e) {

        that.setState({"moving":false});

      }
    });

    for (var i=0; decadeElements.length > i; i++) {

      interact(decadeElements[i]).dropzone({
        accept: ".playhead-container",
        ondrop: function(e) {
          that.props.onDecadeSelect(e.target.getAttribute("data-value"));
        },
        ondragenter: function(e) {
          that.props.onDecadeSelect(e.target.getAttribute("data-value"));
        }
      });

      decadeElements[i].addEventListener(
        'transitionend',
        that.utils.debounce(function() {

          that.updatePlayheadPosition();
          that.stopTrackingAnimation();

        }, 500)
      , false);

    }

  },

  drawNarrativeForDecade: function() {

    var that = this;

    var decadeElements = this.getDOMNode().querySelectorAll(".decade");

    for (var i=0; decadeElements.length > i; i++) {

      var decade = decadeElements[i].getAttribute("data-value");

      var yearCount = {};

      var radius = d3.scale.sqrt().range([0,2,6]);

      var allYears = this.props.narratives.features.filter(function(feature) {

        var yearNumber = parseInt(feature.properties.year);
        return (yearNumber >= decade && yearNumber <= parseInt(decade)+9)

      }).map(function(feature) {

        var yearNumber = parseInt(feature.properties.year);

        if (!yearCount[yearNumber]) {
          yearCount[yearNumber] = 0;
        }

        yearCount[yearNumber]++;

        return yearNumber;

      });

      var decadeElement = decadeElements[i];
        decade = decadeElement.getAttribute('data-value');

      radius.domain([0,1, d3.max(d3.values(yearCount))]);

      d3.select(decadeElement)
        .selectAll(".line")
        .data([0,1,2,3,4,5,6,7,8,9,10])
        .enter().append("div")
        .attr("class", "line")
        .attr("data-value", decade)
        .style("left", function(d) { return ((d % 10) * 10)+3 + "%"; });

      d3.select(decadeElement)
        .selectAll(".dot")
        .data(d3.keys(yearCount))
        .enter().append("div")
        .attr("class", "dot")
        .on("click", that.props.onClickNarrativeYear)
        .attr("data-year", function(year) {return year})
        .style("height", function(d) { return Math.round(radius(yearCount[d]))*2 + "px"; })
        .style("width", function(d) { return Math.round(radius(yearCount[d]))*2 + "px"; })
        .style("margin-left", function(d) { return "-" + Math.round(radius(yearCount[d])) + "px"; })
        .style("border-radius", function(d) { return Math.round(radius(yearCount[d])) + "px"; })
        .style("left", function(d) { return ((d % 10) * 10)+3 + "%"; });

    }

    this.setState({"narrativePointsDrawn":true});

  },

  render: function() {

    return (
      <div className="component population-timeline" onClick={this._onClick}>
        <div className="population-timeline-wrapper">
          <div className="decade decade-1810 selected" data-value="1810">
            <h3>1820</h3>
            <h4>1810s</h4>
            <div className="decade-detail">
              <p>Planter migrations and the slave trade accelerated as American slaveowners consolidated control over the lower Mississippi Valley by suppressing a slave revolt in 1811 and ending any threats to U.S. sovereignty in the region through the War of 1812. (Note: cotton and sugar data is not available for this decade.)</p>
            </div>
          </div>
          <div className="decade decade-1820" data-value="1820">
            <h3>1830</h3>
            <h4>1820s</h4>
            <div className="decade-detail">
              <p>Enslaved people were moved to an expanding slavery frontier as lands in Mississippi and Georgia were ceded by the Choctaw and seized from the Cherokee. The Missouri Compromise grew the slave frontier while setting a limit to future expansion. (Note: cotton and sugar data is not available for this decade.)</p>
            </div>
          </div>
          <div className="decade decade-1830" data-value="1830">
            <h3>1840</h3>
            <h4>1830s</h4>
            <div className="decade-detail">
              <p>More enslaved people—nearly 300,000—were moved during the 1830s than any other decade as planters sought to enrich themselves by growing massive amounts of cotton for the Atlantic market, much of it on lands seized from Native Americans. </p>
            </div>
          </div>
          <div className="decade decade-1840" data-value="1840">
            <h3>1850</h3>
            <h4>1840s</h4>
            <div className="decade-detail">
              <p>In 1845, slaveholders secured new lands for slavery's expansion by annexing Texas. Yet overall the intensity of slave trading slowed amid the lengthy economic depression that followed the Panic of 1837, when the speculative bubble in cotton burst. </p>
            </div>
          </div>
          <div className="decade decade-1850" data-value="1850">
            <h3>1860</h3>
            <h4>1850s</h4>
            <div className="decade-detail">
              <p>The slave trade reintensified with the resurgence of the world cotton market in the 1850s. Slaveowners in areas like Natchez and the Black Belt that had been settled decades earlier sold bondspeople to their counterparts in Texas and Arkansas.</p>
            </div>
          </div>
          <div className="playhead-container">
            <img src="./static/playhead.svg" />
          </div>
          <div className="labels">
            <label className="census">Census</label>
            <label className="narratives">Narratives</label>
          </div>
        </div>
      </div>
    );
  }

});

module.exports = PopulationTimeline;
