var intro = require("intro.js").introJs;
var d3    = require("d3");

var mapText = "<p><strong><h1>The map shows where nearly a million enslaved people were moved from and where they were moved to through the American slave trade and the migration of planters from 1810 to 1860.</h1></strong></p><p>Over time, the places where people were bought and the places where they were sold moved progressively westward.  The domestic slave trade changed continually, shifting shape in response to markets for cotton and sugar as well as to the seizing of land from the American Indians of the southeastern United States.</p>";
var bubbleChartText = "<p><strong><h1>The bubbleplot is a tool for seeing patterns that are not visible on a map.</h1></strong></p><p>In this case, for example, we see that many counties moved from being net importers to net exporters as the population density of enslaved people reached around 20 or so per square mile. Presumably slaveowners in those counties began to sell some of their human property once they owned an adequate labor force to cultivate arable land, enriching themselves by turning \"surplus\" labor into commodities.</p>";
var legendText = "<p><strong><h1>The profit motive drove this trade and these migrations.</h1></strong></p><p>Slaveholders possessing “surplus” labor could turn the people they owned into considerable amounts of cash. Many who bought slaves or moved them to the southwest used them to cultivate cotton, and to a lesser extent sugar, for the world market. Cotton was arguably the most important commodity in the transatlantic economy of the nineteenth century, fueling early industrialization in the textile mills of Britain, western Europe and the northern US. The South came to dominate the production of this staple crop, with American slaves producing nearly two thirds of the global supply by 1860. Hundreds of thousands of square miles of the best agricultural lands in the lower South along the Black Belt and the lower Mississippi Valley&#8212;much of it seized from Native American tribes who experienced their own traumatic migration in the 1830s&#8212;were almost exclusively devoted to the cultivation of cotton.</p>";
var narrativeText = "<p><strong><h1>Enslaved people's accounts of the slave trade powerfully testify to experiences that cannot be represented on a map or in a chart.</h1></strong></p><p>The slave trade created a traumatic emotional landscape shaped by the wrenching misery of separations from spouses, children, and parents. The anger and anguish of being invasively inspected by potential buyers on the auction block, followed by the pain and exhaustion of marching hundreds of miles chained to others in a coffle, scarred the lives of hundreds of thousands of people.</p>";
var timelineText = "<p><strong><h1>The landscape of the American slave trade continually shifted and evolved.</h1></strong></p><p>Some of the changes in the intensity stemmed from the booms and busts of the national and international economies. The slave trade expanded during the flush decades of the 1830s and 1850s and contracted during the recession that stretched from 1837 well into the 1840s. Other changes were related to the population growth. As enslaved people had children and the enslaved population grew, slaveholders in areas that had once seen massive in-migration of enslaved people through migration and purchase–upcountry South Carolina, central Kentucky through central Tennessee into northern Alabama, the Natchez District of Mississippi, parts of Georgia and Alabama–found themselves in possession of “surplus” labor. Slaveholders thus enriched themselves not just through slaves’ production of cotton but through their reproduction. The agonizing and traumatic experience of uprooting and separation from families through the domestic slave trade crossed the American South in complicated and ever-changing patterns.</p>";

var IntroManager = {
  state: false,
  intro: null,
  opened: false,
  buttonClass: '.info-icon',
  steps: {
    map: {
      element: ".population-map .leaflet-container",
      intro: mapText,
      position: "right"
    },
    bubbleplot: {
      element: ".county-bubble-plot",
      intro: bubbleChartText,
      position: "top-right-aligned"
    },
    mapSmallmap: {
      element: ".population-map .leaflet-container",
      intro: mapText,
      position: "top-right-aligned"
    },
    bubbleplotSmallmap: {
      element: ".county-bubble-plot",
      intro: bubbleChartText,
      position: "right"
    },
    legend: {
      element: ".map-legend",
      intro: legendText,
      position: "right-middle-aligned"
    },
    timeline: {
      element: ".population-timeline-container",
      intro: timelineText,
      position: "top"
    },
    narrative: {
      element: ".tabs",
      intro: narrativeText,
      position: "left"
    }

  },

  setTabOneSteps: function(smallmap) {
    this.intro.exit();
    this.intro.setOptions({
      "steps": (smallmap) ?
        [this.steps.bubbleplotSmallmap, this.steps.mapSmallmap, this.steps.timeline] :
        [this.steps.map, this.steps.bubbleplot, this.steps.legend, this.steps.timeline]
    });
    /*
    this.intro.setOptions({
      "steps": [
        {
          element: ".population-map .leaflet-container",
          intro: mapText,
          position: "right"
        },
        {
          element: ".county-bubble-plot",
          intro: bubbleChartText,
          position: "top-right-aligned"
        },
        {
          element: ".map-legend",
          intro: legendText,
          position: "right-middle-aligned"
        },
        {
          element: ".population-timeline-container",
          intro: timelineText,
          position: "top"
        }
      ]
    });
    */

    this.intro.refresh();
  },

  setTabTwoSteps: function(smallmap) {
    this.intro.exit();

    this.intro.setOptions({
      "steps": (smallmap) ?
        [this.steps.bubbleplotSmallmap, this.steps.narrative, this.steps.timeline] :
        [this.steps.map, this.steps.narrative, this.steps.legend, this.steps.timeline]
    });
    /*
    this.intro.setOptions({
      "steps": [
        {
          element: ".population-map .leaflet-container",
          intro: mapText,
          position: "right"
        },
        {
          element: ".tabs",
          intro: narrativeText,
          position: "left"
        },
        {
          element: ".map-legend",
          intro: legendText,
          position: "right-middle-aligned"
        },
        {
          element: ".population-timeline-container",
          intro: timelineText,
          position: "top"
        }
      ]
    });
    */

    this.intro.refresh();
  },

  init: function() {
    this.intro = intro(document.querySelector("body"));

    this.intro.setOptions({
      "showStepNumbers": false,
      'skipLabel': '×',
      'nextLabel': '⟩',
      'prevLabel': '⟨',
      'doneLabel': '×',
      'widthHeightPadding': 0
    });

    this.intro.refresh();

    // events
    var that = this;
    this.intro.onchange(function(e) {
      var step = that.intro._currentStep;

      that.deselectAllButtons();
      that.selectButtonByStep(step);
    });

    this.intro.onexit(function(){
      that.state = false;
      that.deselectAllButtons();
    });

    this.intro.onbeforechange(function(targetElement) {
      //console.log(targetElement)
      that.onbeforechange(targetElement);
    });

    this.intro.onafterchange(function(targetElement) {
      //console.log(targetElement)
    });

    this.intro.oncomplete(function() {
      that.deselectAllButtons();
      // Do something when intro is complete
    });

  },

  onbeforechange: function(targetElement) {},

  getCurrentStep: function() {
    return this.intro._currentStep || null;
  },

  deselectAllButtons: function() {
    d3.selectAll(this.buttonClass).classed('selected', false).attr('disabled', null);
  },

  selectButtonByStep: function(step) {
    d3.select('[data-step="' + step + '"]').classed('selected', true)
      .attr('disabled', 'disabled');
  },

  selectButtonByElement: function(elm) {
    d3.select(elm).classed('selected', true)
      .attr('disabled', 'disabled');
  },

  open: function(e) {
    if (!this.intro) return;

    this.state = true;
    var step = (e && e.currentTarget) ? parseInt(e.currentTarget.getAttribute("data-step")) : null;

    // Fixes a problem where step indexes are different
    // when initially called
    //if (e && !this.opened) step += 1;

    if (step) {
      if (!this.opened) {
        this.intro.goToStep(step).start().nextStep();
      } else {
        this.intro.goToStep(step).start();
      }


    } else {
      this.intro.start();
    }

    this.opened = true;
  },

  close: function() {
    if (!this.intro) return;
    this.intro.exit();
  },

  destroy: function() {
    this.close();
    this.intro = null;
  }
};

module.exports = IntroManager;