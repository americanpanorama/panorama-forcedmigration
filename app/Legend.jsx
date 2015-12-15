var React        = require("react");
var browsersugar = require("browsersugar");

var Legend = React.createClass({

  utils: browsersugar.mix({}),

  getInitialState: function () {

    return {};

  },

  componentDidMount: function() {

  },

  componentWillUnmount: function() {

  },

  componentDidUpdate: function() {

  },

  onListItemClick: function(e) {

    var itemElement = this.utils.parentHasClass(e.target, "item");

    if (itemElement) {
      this.props.onClick(itemElement.getAttribute("data-item-type"));
    }

  },

  render: function() {

    return (
      <div className="component map-legend" onClick={this.onListItemClick}>
        <ul>
          <li className={"item narratives" + (!this.props.narratives ? " off" : "")} data-item-type="narratives"><span>Narratives</span></li>
          <li className={"item cotton" + (!this.props.cotton ? " off" : "")} data-item-type="cotton"><span>Cotton</span></li>
          <li className={"item sugar" + (!this.props.sugar ? " off" : "")} data-item-type="sugar"><span>Sugar</span></li>
        </ul>
      </div>
    );
  }

});

module.exports = Legend;
