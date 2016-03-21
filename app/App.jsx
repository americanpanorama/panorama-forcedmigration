//
// Imports
//
var config = require("../.env.json");

// NPM Modules
var React        = require("react");
var browsersugar = require("browsersugar");
var d3           = require("d3");


// Actions
var PopulationActions     = require("./actions/population");

// Stores
var PopulationStore       = require("./stores/population.js");
var PlacesStore           = require("./stores/places.js");
var NarrativesStore       = require("./stores/narratives.js");
var CropsStore            = require("./stores/crops.js");
var Intro                 = require("./stores/introStore.js");
var PanoramaNavData       = require("../data/panorama_nav.json");

// Components
var LeafletMap            = require("./LeafletMap.jsx");
var TileLayer             = LeafletMap.TileLayer;
var GeoJSONLayer          = LeafletMap.GeoJSONLayer;
var LeafletMapKey         = require("./LeafletMapKey.jsx");
var CartoTileLayer        = require("./LeafletCartoDBTileLayer.jsx");
var LeafletHexLayer       = require("./LeafletHexLayer.jsx");
var PopulationTimeline    = require("./PopulationTimeline.jsx");
var CountyBubblePlot      = require("./CountyBubblePlot.jsx");
var DivergingBarChart     = require("./DivergingBarChart.jsx");
var Tabs                  = require('react-simpletabs');
var NarrativeAccordion    = require("./NarrativeAccordion.jsx");
var CountyOverlay         = require("./CountyOverlay.jsx");
var Modal                 = require('react-modal');
var Legend                = require('./Legend.jsx');
var PanoramaNav           = require('./PanoramaNavigation.jsx');
var throttle              = require('lodash.throttle');
var includes              = require('lodash.includes');

var App = React.createClass({

  utils: browsersugar.mix({}),

  urlKeyMap: {
    "selectedDecade"          : "decade",
    "selectedNarrative"       : "narrative",
    "selectedCounty"          : "county",
    "selectedGeographicState" : "state",
    "tabActive"               : "tab",
    "showAbout"               : "about",
    "show_cotton"             : "cotton",
    "show_sugar"              : "sugar",
    "show_narratives"         : "narratives",
    "show_labels"             : "labels",
    "intro"                   : "intro",
    "smallmap"                : "smallmap"
  },

  keyOptions: {
    html: true,
    position: 'bottomleft',
    items: [
      {
        klass: 'out',
        content: '<img src="./static/map-key-circles-grey.svg"/><span>Outmigration</span>'
      },
      {
        klass: 'in',
        content: '<img src="./static/map-key-circles-red.svg"/><span>Inmigration</span>'
      }
    ]
  },

  initialMapState: {
    coords: [-10, 10],
    zoom: 5
  },

  getDefaultProps: function() {
    var overrides = (typeof RICHMOND_OVERRIDES !== 'undefined') ? RICHMOND_OVERRIDES : {};
    return {
      showIntroOnStart: overrides.showIntroOnStart || false
    };
  },

  getCurrentHashState: function() {
    var defaultState = {
      "tabActive" : 1,
      "show_narratives": true,
      "show_cotton": true,
      "show_sugar": true,
      "show_labels": false,
      "selectedDecade": 1810,
      "show_panorama_menu": false
    };

    var urlState = this.readURL();

    for (var i in urlState) {
      defaultState[i] = urlState[i];
    }

    return defaultState;
  },


  getInitialState: function () {
    var defaultState = this.getCurrentHashState();

    defaultState.placeData = PlacesStore.getData();
    defaultState.populationData = PopulationStore.getData();
    defaultState.narrativeData = NarrativesStore.getData();

    return defaultState;
  },

  componentWillMount: function() {
    this.computeDimensions();
    Modal.setAppElement(document.querySelector("body"));
  },

  componentDidMount: function() {

    var that = this;
    //this.computeDimensions();

    // reset the zoom level and position of the map to fit the bounds of the slave south
    // the coordinates represent ([[30, -93.5], [39.7, -75.87]]) in 2163
    this.refs.map.map.fitBounds([[-15.73, 6.06], [-3.36, 19.49]]);


    PopulationActions.getInitialData(this.state);

    PopulationStore.addChangeListener(this.onChange);
    NarrativesStore.addChangeListener(this.onChange);
    PlacesStore.addChangeListener(this.onChange);
    CropsStore.addChangeListener(this.onChange);

    window.onhashchange = function locationHashChanged() {

      var newState = that.getCurrentHashState();
      var change   = null;

      for (var i in newState) {
        if (newState.hasOwnProperty(i) && newState[i] !== that.state[i]) {
          change = true;
        }
      }

      if (change) {
        that.setState(newState);
      }

    }

    if (this.state.selectedGeographicState) {
      PopulationActions.selectGeographicState(this.state.selectedGeographicState, this.state.selectedDecade);
    }

    if (this.state.selectedCounty) {
      PopulationActions.selectCounty(this.state.selectedCounty, this.state.selectedGeographicState, this.state.selectedDecade);
    }

    Intro.init();
    this.changeIntroSteps(this.state.tabActive, this.state.smallmap);

    if (this.props.showIntroOnStart) Intro.open();

    this.handleResizeThrottled = throttle(this.handleResize, 250);
    window.addEventListener('resize', this.handleResizeThrottled);
    // window.addEventListner('resize');
  },

  changeIntroSteps: function(tabIndex, smallmap) {
    if (tabIndex == '1') Intro.setTabOneSteps(smallmap);
    if (tabIndex == '2') Intro.setTabTwoSteps(smallmap);
  },

  componentWillUnmount: function() {

    PopulationStore.removeChangeListener(this.onChange);
    NarrativesStore.removeChangeListener(this.onChange);
    PlacesStore.removeChangeListener(this.onChange);
    CropsStore.removeChangeListener(this.onChange);

    window.removeEventListener('resize', this.handleResizeThrottled);
    window.onhashchange = null;

    Intro.destroy();

  },

  componentDidUpdate: function() {

    this.updateURL();

  },

  updateURL: function() {
    var out = [];

    for (var i in this.state) {
      if (this.state.hasOwnProperty(i) && Object.keys(this.urlKeyMap).indexOf(i) > -1) {
        var val = this.state[i];
        if (this.urlKeyMap[i] === 'state') {
          val = this.state[i] ? this.state[i].replace(/\s/g, "-") : this.state[i];
        }

        out.push(this.urlKeyMap[i]);
        out.push("=");
        out.push(val);
        out.push("&");

      }
    }

    // add map location & zoom to hash
    // since it has no real bearing to the app state
    // we are applying it out of the state flow above...
    out.push("loc");
    out.push("=");
    out.push(this.initialMapState.zoom + "/" + this.initialMapState.coords[0] + "/" + this.initialMapState.coords[1]);

    location.hash = out.join("");//.substring(0,out.join("").length-1);

  },

  readURL: function() {

    var segments = location.hash.substring(1).split("&");
    var subseg;
    var out         = {};
    var reverseMap = {};
    var that = this;

    for (var i in this.urlKeyMap) {
      reverseMap[this.urlKeyMap[i]] = i;
    }

    segments.forEach(function(segment) {

      subseg = segment.split("=");

      // check and populate default map location & zoom
      // since `initialMapState` is not part of the app
      // state it will not re-render the component
      // on changes
      if(subseg[0] === 'loc') {

        var locationParts = subseg[1].split('/');
        if( locationParts.length === 3) {
          that.initialMapState.coords = [+locationParts[1], +locationParts[2]];
          that.initialMapState.zoom = +locationParts[0];
        }

      // only populate reverse map if they share keys
      } else if(reverseMap.hasOwnProperty(subseg[0])) {

        var val = subseg[1];
        if (subseg[0] === 'state') {
          val = val.replace(/-/g, ' ');
        }
        if (val == 'true') {
          val = true;
        }
        if (val == 'false') {
          val = false;
        }

        out[reverseMap[subseg[0]]] = val;
      }

    });

    return out;

  },

  onChange: function(e) {

    var currentState = this.getCurrentHashState();

    // Special case to dismiss county selection when selectedGeographicState changes...
    if (currentState.selectedCounty && currentState.selectedGeographicState && e.selectedGeographicState) {
      if (!e.selectedCounty) {
        if (currentState.selectedGeographicState !== e.selectedGeographicState) {
          e.selectedCounty = null;
        }
      }
    } else if (e.selectedGeographicState === null) {
      e.selectedCounty = null;
    }

    if (e.placestore) {
      this.setState({placeData: PlacesStore.getData()});
    } else if (e.populationstore) {
      this.setState({populationData: PopulationStore.getData()});
    } else if (e.narrativestore) {
      this.setState({narrativeData: NarrativesStore.getData()});
    } else {
     this.setState(e);
    }

  },

  onEachFeatureNarratives: function(feature, layer) {
    var className = "narrative-circle";
    if (parseInt(feature.properties.narrative_id) === parseInt(this.state.selectedNarrative)) {
      className += " selected";
    }

    layer.options.icon = L.divIcon({className: className, iconSize: null, iconAnchor: null});
  },

  onEachFeatureCounties: function(feature, layer) {
    var className = '';
    if (feature.properties.nhgis_join === this.state.selectedCounty) {
      className += ' selected';
    }
    if (feature.properties.key === this.state.selectedGeographicState) {
      className += ' geographic-state-selected';
    }
    if (className) {
      layer.eachLayer(function(_layer) {
        _layer.options.className += className;
      });
    }
  },

  onEachFeatureCrops: function(feature, layer) {

    layer.eachLayer(function(_layer) {
      _layer.options.className = "crop-" + feature.properties.crop;
    });

  },

  onEachStateLabel: function(feature, layer) {


  },

  onCountyClick: function(e) {
    PopulationActions.selectCounty(e.feature.properties.nhgis_join, e.feature.properties.key, this.state.selectedDecade);
  },

  onGeographicStateClick: function(e, event) {

    e.eachLayer(function(_layer) {
      _layer.options.className += "selected";
    });

    PopulationActions.selectGeographicState(e.feature.properties.key, this.state.selectedDecade);
    // TODO find the county you would have clicked on + select that too
    // TODO if not already the case, always have counties on the map with no
    // border?
    // TODO simulate a second click after selectGeographicState?
    var latlng = event.latlng;

  },

  onNarrativeListClick: function(e) {
    var narrativeElement = this.utils.parentHasClass(e.target, "narrative-item");

    if (narrativeElement) {
      var narrativeId = narrativeElement.getAttribute('data-narrative-id');

      // If narrative already selected, de-select
      if (this.state.selectedNarrative === narrativeId) {
        narrativeId = null;
      }
      this.setState({ selectedNarrative: narrativeId });
    }
  },

  onTabChange: function(e) {
    this.changeIntroSteps(e, this.state.smallmap);
    this.setState({tabActive:e});
  },

  onNarrativeMapClick: function(e) {
    this.changeIntroSteps('2', this.state.smallmap);

    // toggle narrative dots
    var theSame = (this.state.selectedNarrative == e.feature.properties.narrative_id) ? true : false;

    if (theSame) {
      this.setState({
        selectedNarrative: null,
        tabActive: 1
      });
    } else {
      this.setState({
        selectedNarrative: e.feature.properties.narrative_id,
        tabActive: 2
      });
    }

  },

  onClickNarrativeYear: function(year) {
    var features = NarrativesStore.getNarrativesForYear(year);

    if (features && features[0]) {
      this.changeIntroSteps('2', this.state.smallmap);
      this.setState({
        selectedNarrative:features[0].properties.narrative_id,
        tabActive:2,
        selectedDecade:parseInt((year+"").substring(0,3) + 0)
      });
    }

  },

  onEnbiggen: function() {
    var smallmapState = this.state.smallmap ? false : true;
    this.changeIntroSteps(this.state.tabActive, smallmapState);
    this.setState({"smallmap": smallmapState});
  },

  onTimelineDecadeSelect: function(decade) {

    // TODO if county no longer exists, de-select
    this.setState({"selectedDecade":decade});

  },

  onPanoramaMenuClick: function() {
    this.setState({"show_panorama_menu": !this.state.show_panorama_menu});
  },

  onLegendClick: function(itemType) {
    var newState = {};

    newState["show_" + itemType] = this.state["show_" + itemType] ? false : true;

    this.setState(newState);
  },

  openAbout: function() {
    this.setState({"showAbout":true});
  },

  closeAbout: function() {
    this.setState({"showAbout":false});
  },

  getAboutCopy: function() {
    return aboutContent;
  },

  clearCounty: function() {
    this.setState({"selectedCounty":null});
  },

  openIntro: function(e) {
    Intro.open(e);
  },

  heights: {
    app      : 0,
    map      : 0,
    tab      : 0,
    tabPanel : 0,
    bubble   : 0
  },

  handleResize: function() {
    this.computeDimensions();
    this.setState({windowSize: {width: window.innerWidth, height: window.innerHeight}});
  },

  computeDimensions: function() {
    // min-height: 700
    this.heights.app = Math.max(window.innerHeight, 700);

    // .tabs top position = 77
    //  top & bottom borders = 20
    //  bottom padding = 15
    this.heights.tab = this.heights.app - 77 - 20 - 15;

    // tab-nav = 33
    this.heights.tabPanel = this.heights.tab - 33;

    // timeline height = 200
    this.heights.map = this.heights.tab - 200;

    // chart height = 326
    // padding = 15
    this.heights.bubble = this.heights.tabPanel - 326 - 30; // padding increased to 35 to prevent scrollbars
  },

  // TODO: Responsive
  getBubblePlotDimensions: function() {
    if (document.querySelector(".content") && document.querySelector(".sidebar")) {
      if (this.state.smallmap) {
        return {
          "height": document.querySelector(".population-map-container").offsetHeight,
          "width": document.querySelector(".population-map-container").offsetWidth - 50
        }
      } else {

        // 326 is height of bar chart
        // 15 is padding
        return {
          "height": (document.querySelector(".tab-panel").offsetHeight - 326) - 15,
          "width": document.querySelector(".tab-panel").offsetWidth
        }
      }
    } else {
      return {
        "width"  : null,
        "height" : null
      }
    }

  },

  // TODO: Responsive
  getBarChartDimensions: function() {

    if (document.querySelector(".diverging-bar-chart")) {
      return {
        "height": (document.querySelector(".diverging-bar-chart").offsetHeight),
        "width": document.querySelector(".diverging-bar-chart").offsetWidth
      }
    } else {
      return {
        "width"  : null,
        "height" : null
      }
    }

  },

  setTabsHeight: function() {
    d3.select('.richmondatlas-forcedmigraton .component.tabs').style('height', this.heights.tab + 'px');
    d3.selectAll('.richmondatlas-forcedmigraton .component.tabs .tab-panel').style('height', this.heights.tabPanel + 'px' );
  },

  mapMoveHandler: function(center, zoom) {
    var precision = Math.max(0, Math.ceil(Math.log(zoom) / Math.LN2));
    this.initialMapState.coords = [center.lat.toFixed(precision), center.lng.toFixed(precision)];
    this.initialMapState.zoom = zoom;

    this.updateURL();
  },

  getRichmondContainerClass: function() {
    return "richmondatlas-forcedmigraton" +
      (!this.state.show_narratives ? " hide-narratives" : "") +
      (!this.state.show_cotton ? " hide-cotton" : "") +
      (!this.state.show_sugar ? " hide-sugar" : "") +
      (!this.state.show_labels ? " hide-labels" : "") +
      (this.state.smallmap ? " showing-small-map" : "");
  },

  getNavData: function() {
    // remove the current map from the list
    PanoramaNavData.map(function(item, i) {
      if (item.url.indexOf('forcedmigration') > -1) {
          PanoramaNavData.splice(i, 1);
      }
    });

    return PanoramaNavData;
  },

  render: function() {
    var cropFeatures = CropsStore.getCropsByDecade(this.state.selectedDecade),
      crops = cropFeatures.features.map(function (feature) {
        return feature.properties.crop;
      }),
      cottonAvailable = includes(crops, 'cotton'),
      sugarAvailable = includes(crops, 'sugar');
    var stateFeatures = PlacesStore.getGeographicStatesFilteredByDecade(this.state.selectedDecade);
    var countyFeatures = PlacesStore.getCountyShapesByDecade(this.state.selectedDecade);
    var narrativeFeatures = (this.state.show_narratives) ? NarrativesStore.getNarrativesFilteredByDecade(this.state.selectedDecade) : {features:[]};
    
    return (
      <div className={this.getRichmondContainerClass()} style={{height: this.heights.app + 'px'}} >

        <PanoramaNav show_panorama_menu={ this.state.show_panorama_menu } on_hamburger_click={ this.onPanoramaMenuClick } nav_data={ this.getNavData() }  />

        <article className="content">
          <h1>The forced migration of enslaved people in the United States 1810 - 1860</h1>
          <button className="about-action" onClick={this.openAbout}>About this map</button>
          <div className="article-content-wrapper">
            <div className="article-content-inner">
              <div className="population-map-container" style={{height: this.heights.map + 'px'}}>
                {!this.state.smallmap &&
                  <LeafletMap ref="map"
                    location={this.initialMapState.coords}
                    zoom={this.initialMapState.zoom}
                    mapMoveEndHandler={this.mapMoveHandler}
                    mapOptions={{attributionControl:false, scrollWheelZoom: true}}>
                    <CartoTileLayer
                      zIndex={20}
                      src="http://sm.mapstack.stamen.com/openterrain_2163/{z}/{x}/{y}.png"
                      userId={config.cartodbAccountName}
                      sql="SELECT * FROM unified_basemap_layers order by ord"
                      cartocss="@linecolor: lighten(#b1b4b4,20); @land: #f9f9f9; #unified_basemap_layers[layer='ne_10m_coastline_2163']{  line-color: @linecolor;  line-width: 0.75;  line-opacity: 1;  line-join: round;  line-cap: round;}#unified_basemap_layers[layer='ne_10m_lakes_2163'] {  line-color: @linecolor;  line-width: 2.5;  line-opacity: 1;  line-join: round;  line-cap: round;  /* Soften lines at lower zooms */  [zoom<=7] {    line-width: 2.5;    line-color: @linecolor;  }  [zoom<=5] {    line-width: 1.5;    line-color: @linecolor;  }  /* Separate attachment because seams */  ::fill {    polygon-fill: #b1b4b4;    polygon-opacity: 1;  }  /* Remove small lakes at lower zooms */  [scalerank>3][zoom<=5] {    ::fill {      polygon-opacity: 0;    }    line-opacity: 0;  }  [scalerank>6][zoom<=7] {    ::fill {      polygon-opacity: 0;    }    line-opacity: 0;  }}#unified_basemap_layers[layer='ne_10m_rivers_lake_centerlines_2163'] {  line-color: @linecolor;  line-width: 1.5;  line-opacity: 1;  line-join: round;  line-cap: round;  [name='Mississippi'],  [name='St. Lawrence'],  [name='Rio Grande'] {    line-width: 4;  }  [zoom<=8][name='Mississippi'],  [zoom<=8][name='St. Lawrence'],  [zoom<=8][name='Rio Grande'] {    line-width: 2;  }  [zoom<=8][name!='Mississippi'][name!='St. Lawrence'][name!='Rio Grande'],  [zoom<=6][name='Mississippi'],  [zoom<=6][name='Rio Grande'] {    line-width: 1;    line-color: @linecolor;  }  [zoom<=6][name!='Mississippi'][name!='St. Lawrence'][name!='Rio Grande'] {    line-width: 0.5;    line-color: @linecolor;  }  [zoom<=5][name!='Mississippi'][name!='St. Lawrence'][name!='Rio Grande']{    line-width: 0;  }  [zoom<=5][name='Mississippi'],  [zoom<=5][name='St. Lawrence'],  [zoom<=5][name='Rio Grande'] {    line-width: 0.5;    line-color: @linecolor;  }}#unified_basemap_layers[layer='ne_10m_admin_0_countries_lakes_2163'] {  line-color: @land;  line-width: 1;  line-opacity: 1;  line-join: round;  line-cap: round;  polygon-fill: @land;  polygon-opacity: 1;}"
                    />
                    <TileLayer src="http://sm.mapstack.stamen.com/openterrain_2163/{z}/{x}/{y}.png" zIndex={50}/>
                    <GeoJSONLayer featuregroup={cropFeatures} onEachFeature={this.onEachFeatureCrops} />
                    <LeafletHexLayer featuregroup={PopulationStore.getHexbinDataFilteredByDecade(this.state.selectedDecade)} />
                    <GeoJSONLayer featuregroup={stateFeatures} className="places-states" onClick={this.onGeographicStateClick} />
                    <GeoJSONLayer featuregroup={countyFeatures} className="places-county" onClick={this.onCountyClick} onEachFeature={this.onEachFeatureCounties} selectedFeature={this.state.selectedCounty} centerGeography={true} panIntoView={true} />
                    <GeoJSONLayer featuregroup={narrativeFeatures} onEachFeature={this.onEachFeatureNarratives} onClick={this.onNarrativeMapClick} />
                    <LeafletMapKey keyOptions={this.keyOptions} />
                  </LeafletMap>
                }

                {this.state.smallmap &&
                  <CountyBubblePlot
                    showLegend={true}
                    showAxisLabels={true}
                    selectedDecade={this.state.selectedDecade}
                    selectedCounty={this.state.selectedCounty}
                    bubbles={this.state.placeData.bubbles}
                    counties={this.state.placeData.counties}
                    selectedCountyMetadata={PlacesStore.getCountyMetadataById(this.state.selectedCounty)}
                    width={this.getBubblePlotDimensions().width}
                    height={this.getBubblePlotDimensions().height} />
                }

                <div className="map-legend-wrapper">
                  <button className="info-icon info-icon-legend" data-step="2" onClick={this.openIntro} />
                  <Legend narratives={this.state.show_narratives} cotton={cottonAvailable && this.state.show_cotton} sugar={sugarAvailable && this.state.show_sugar} onClick={this.onLegendClick} />
                </div>

                <button className="info-icon info-icon-map" data-step="0" onClick={this.openIntro} />
                <CountyOverlay selectedDecade={this.state.selectedDecade} counties={PlacesStore.getCountyMetadataById(this.state.selectedCounty)} crops={CropsStore.getCropDetailsByCountyId(this.state.selectedCounty)} hex={PlacesStore.getCountyBubbleById(this.state.selectedCounty)} onClick={this.clearCounty} />
              </div>

              <div className="population-timeline-container">
                <PopulationTimeline selectedDecade={this.state.selectedDecade} narratives={this.state.narrativeData} selectedNarrativeYear={NarrativesStore.getYearForNarrativeId(this.state.selectedNarrative)} onClickNarrativeYear={this.onClickNarrativeYear} onDecadeSelect={this.onTimelineDecadeSelect} />
                <button className="info-icon info-icon-timeline" data-step="3" onClick={this.openIntro} />
              </div>

            </div>
          </div>
        </article>
        <aside className="sidebar">
          <div className='component selected-decade-display'><div><span className="little-the">the</span><span>{this.state.selectedDecade}s</span></div></div>
          <Tabs className="component tabs" ref="tabs" tabActive={parseInt(this.state.tabActive)} onAfterChange={this.onTabChange} onMount={this.setTabsHeight}>
            <Tabs.Panel title="Data">
              <div className="trianglything top-left"></div>
              <div className="trianglything top-middle-left"></div>
              <div className="trianglything top-right"></div>

              <DivergingBarChart
                selectedDecade={this.state.selectedDecade}
                selectedGeographicState={this.state.selectedGeographicState}
                inmigration={this.state.populationData.inmigration}
                counties={this.state.placeData.names}
                width={this.getBarChartDimensions().width}
                height={this.getBarChartDimensions().height}/>

              <div className="relative-container" style={{height: this.heights.bubble + 'px'}}>
              {!this.state.smallmap &&
                <CountyBubblePlot
                  showSimpleLabels={true}
                  showLegend={true}
                  selectedDecade={this.state.selectedDecade}
                  selectedCounty={this.state.selectedCounty}
                  bubbles={this.state.placeData.bubbles}
                  counties={this.state.placeData.counties}
                  selectedCountyMetadata={PlacesStore.getCountyMetadataById(this.state.selectedCounty)}
                  width={this.getBubblePlotDimensions().width} height={this.heights.bubble} />}

              {this.state.smallmap &&
                <div style={{height: this.heights.bubble + 'px'}}>
                  <LeafletMap ref="map"
                    location={this.initialMapState.coords}
                    zoom={this.initialMapState.zoom}
                    mapMoveEndHandler={this.mapMoveHandler}
                    mapOptions={{attributionControl:false}}>
                    <CartoTileLayer
                      src="http://sm.mapstack.stamen.com/openterrain_2163/{z}/{x}/{y}.png"
                      userId={config.cartodbAccountName}
                      sql="SELECT * FROM unified_basemap_layers order by ord"
                      cartocss="@linecolor: lighten(#b1b4b4,20); @land: #f9f9f9; #unified_basemap_layers[layer='ne_10m_coastline_2163']{  line-color: @linecolor;  line-width: 0.75;  line-opacity: 1;  line-join: round;  line-cap: round;}#unified_basemap_layers[layer='ne_10m_lakes_2163'] {  line-color: @linecolor;  line-width: 2.5;  line-opacity: 1;  line-join: round;  line-cap: round;  /* Soften lines at lower zooms */  [zoom<=7] {    line-width: 2.5;    line-color: @linecolor;  }  [zoom<=5] {    line-width: 1.5;    line-color: @linecolor;  }  /* Separate attachment because seams */  ::fill {    polygon-fill: #b1b4b4;    polygon-opacity: 1;  }  /* Remove small lakes at lower zooms */  [scalerank>3][zoom<=5] {    ::fill {      polygon-opacity: 0;    }    line-opacity: 0;  }  [scalerank>6][zoom<=7] {    ::fill {      polygon-opacity: 0;    }    line-opacity: 0;  }}#unified_basemap_layers[layer='ne_10m_rivers_lake_centerlines_2163'] {  line-color: @linecolor;  line-width: 1.5;  line-opacity: 1;  line-join: round;  line-cap: round;  [name='Mississippi'],  [name='St. Lawrence'],  [name='Rio Grande'] {    line-width: 4;  }  [zoom<=8][name='Mississippi'],  [zoom<=8][name='St. Lawrence'],  [zoom<=8][name='Rio Grande'] {    line-width: 2;  }  [zoom<=8][name!='Mississippi'][name!='St. Lawrence'][name!='Rio Grande'],  [zoom<=6][name='Mississippi'],  [zoom<=6][name='Rio Grande'] {    line-width: 1;    line-color: @linecolor;  }  [zoom<=6][name!='Mississippi'][name!='St. Lawrence'][name!='Rio Grande'] {    line-width: 0.5;    line-color: @linecolor;  }  [zoom<=5][name!='Mississippi'][name!='St. Lawrence'][name!='Rio Grande']{    line-width: 0;  }  [zoom<=5][name='Mississippi'],  [zoom<=5][name='St. Lawrence'],  [zoom<=5][name='Rio Grande'] {    line-width: 0.5;    line-color: @linecolor;  }}#unified_basemap_layers[layer='ne_10m_admin_0_countries_lakes_2163'] {  line-color: @land;  line-width: 1;  line-opacity: 1;  line-join: round;  line-cap: round;  polygon-fill: @land;  polygon-opacity: 1;}"
                    />
                    <TileLayer src="http://sm.mapstack.stamen.com/openterrain_2163/{z}/{x}/{y}.png" />
                    <GeoJSONLayer featuregroup={cropFeatures} onEachFeature={this.onEachFeatureCrops} />
                    <LeafletHexLayer featuregroup={PopulationStore.getHexbinDataFilteredByDecade(this.state.selectedDecade)}/>
                    <GeoJSONLayer featuregroup={stateFeatures} className="places-states" onClick={this.onGeographicStateClick} />
                    <GeoJSONLayer featuregroup={countyFeatures} className="places-county" onClick={this.onCountyClick} onEachFeature={this.onEachFeatureCounties} selectedFeature={this.state.selectedCounty} centerGeography={true} panIntoView={true}/>
                    <GeoJSONLayer featuregroup={narrativeFeatures} onEachFeature={this.onEachFeatureNarratives} onClick={this.onNarrativeMapClick} />
                  </LeafletMap>
                </div>
              }
              <button className="info-icon info-icon-bubbleplot" data-step="1" onClick={this.openIntro} />
              </div>
              <button className="enbiggen-icon" onClick={this.onEnbiggen}><span className="icon"></span>Enlarge</button>
            </Tabs.Panel>
            <Tabs.Panel title="Narratives">
              <div className="trianglything top-left"></div>
              <div className="trianglything top-middle-right"></div>
              <div className="trianglything top-right"></div>
              <NarrativeAccordion selectedNarrative={this.state.selectedNarrative} selectedDecade={this.state.selectedDecade} narratives={NarrativesStore.getNarrativesFilteredByDecade(this.state.selectedDecade)} onClick={this.onNarrativeListClick} />
              <button className="info-icon info-icon-narratives" data-step="1" onClick={this.openIntro} />
            </Tabs.Panel>
          </Tabs>

        </aside>


        <Modal
          isOpen={this.state.showAbout}
          onRequestClose={this.closeAbout}
          className="overlay">
          <button className="close" onClick={this.closeAbout}><span>×</span></button>
          <h2>A Note on Sources and Methods</h2>
          <p>The places of birth of enslaved people were not recorded in the census, so we can only estimate the numbers and locations of enslaved people who were moved through the domestic slave trade and the migration of planters. The historian Frederick Bancroft was one of the first to generate state-level estimates of out-migrations and in-migrations. The formula he used assumes that the growth rate of the enslaved population was uniform across the South. This is an imperfect assumption, to be sure, but still an arguably reasonable one. The mortality rates for enslaved people in the cotton-growing regions were higher. But as slaveowners in that region bought mostly people who were between the ages of 15 and 25, fertility rates in those regions were arguably higher too.</p>

          <p>Census figures can be used to calculate the population growth rate for each decade. If, say, the growth rate for a decade were 25% and the population of that area were 1,000, in the absence of in-migration or out-migration we would expect the population of that area to be 1,250 a decade later. If the population is greater than that, we attribute that extra growth to in-migration; if less, to out-migration. More specifically, to calculate out-migrations for a given area, we multiply the population at the beginning of the period by the rate of natural increase and subtract the population at the end of the period. That number is then divided by half of the growth rate as to avoid double counting reproduction in both in-migrating and out-migrating areas.</p>

          <p>To date, this technique has typically been applied at the state level. Applying it below the state level is challenging inasmuch as county boundaries in the lower South in particular changed from decade to decade. We have used two techniques to produce spaces that are comparable from decade-to-decade. </p>

          <p>The first technique is to create what in GIS is called a "union" of counties across subsequent decades. Essentially, the union generates the largest areas that exist within two counties (not necessarily the same two) across decades. We can then distribute the enslaved population into those areas proportional to their area and calculate migrations over the decade. This technique is used to produce the data that is visualized in the bubbleplot.</p>

          <p>Second, we overlay a honeycomb of hexagon-shaped spaces (or "hexbins") over the South. We then estimate the in-migrations and out-migrations using the data we produced at the county level. This technique is used to produce the data that is visualized in the map.</p>

          <p>We have not made any effort to account for manumissions or escapes. The number of enslaved people who were freed through escape or some other means were, relative to the size of in-migrations and out-migrations, modest. That said, escapes and manumissions were more prevalent on the north border of the slave South in places like Maryland and Delaware. The out-migrations visible on the map in those places might be very modestly exaggerated.</p>

          <p>The parishes in Louisiana where sugar was cultivated present an exceptional case. The mortality rate was higher and the fertility rate lower on sugar plantations. We have used historian Michael Tadman's estimate of 6.5% growth rate in our calculations (Tadman, 69). As Tadman emphasizes, even that 6.5% growth rate might be too high, so the in-migrations (almost all importations) in southern Louisiana may very well be underestimated on the map.</p>

          <p>The data we use for population, cotton, and sugar comes from the <a href="http://www.nhgis.org">Minnesota Population Center, National Historical Geographic Information System: Version 2.0 (Minneapolis, Minn.: University of Minnesota 2011)</a>. State boundaries are from the Newberry Library's <a href="http://publications.newberry.org/ahcbp/">Atlas of Historical County Boundaries</a>.</p>

          <h2>Suggested Reading</h2>

          <ul>
            <li>Bancroft, Frederick. <em>Slave-Trading in the Old South</em>. Baltimore MD: Furst, 1931.</li>
            <li>Baptist, Edward E. <em>The Half Has Never Been Told: Slavery and the Making of American Capitalism</em>. New York: Basic Books, 2014.</li>
            <li>Johnson, Walter. <em>Soul by Soul: Life Inside the Antebellum Slave Market</em>. Harvard University Press, 2001.</li>
            <li>Rothman, Adam. <em>Slave Country: American Expansion and the Origins of the Deep South</em>. Cambridge, Mass.: Harvard University Press, 2007.</li>
            <li>Schermerhorn, Calvin. <em>The Business of Slavery and the Rise of American Capitalism, 1815-1860</em>. New Haven, CT: Yale University Press, 2015.</li>
            <li>Tadman, Michael. <em>Speculators and Slaves: Masters, Traders, and Slaves in the Old South</em>. Madison, Wis: University of Wisconsin Press, 1989.</li>
          </ul>

          <h2>Acknowledgments</h2>

          <p>This map is authored by the staff of the Digital Scholarship Lab: Robert K. Nelson, Edward L. Ayers, Justin Madron, and Nathaniel Ayers. Scott Nesbit contributed substantially to the preliminary drafts.</p>

          <p>The developers, designers, and staff at <a href='http://stamen.com'>Stamen Design</a> have been exceptional partners on this project. Our thanks to Kai Chang, Jon Christensen, Sean Connelley, Seth Fitzsimmons, Eric Gelinas, Heather Grates, Nicolette Hayes, Alan McConchie, Michael Neuman, Dan Rademacher, Eric Rodenbeck, and Eric Socolofsky.</p>

          <p>We are also indebted to Phil Troutman, Calvin Schermerhorn, Joshua Rothman, and Samantha Seeley for their very thoughtful comments.</p>

          <p><a href='https://mellon.org/'>The Andrew W. Mellon Foundation</a> generously provided grant funding to develop <cite>American Panorama</cite>.</p>
        </Modal>
      </div>
    );
  }

});

module.exports = App;
