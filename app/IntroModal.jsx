var React = require("react");


/**
 * The new (Summer 2016) intro modal.
 * This is distinct from the IntroManager "intro",
 * which acts more like a series of walkthrough overlays.
 */
var coverImgPath = './static/introModalCover.png';
var IntroModal = React.createClass({

	propTypes: {
		onDismiss: React.PropTypes.func
	},

	componentWillMount: function() {

		var img = new Image(),
			onload = function (event) {
				img.removeEventListener('load', onload);
				this.setState({
					coverImgLoaded: true
				});
			}.bind(this);

		img.addEventListener('load', onload);
		img.src = coverImgPath;

	},

	getInitialState: function () {

		return {
			pageIndex: 0,
			coverImgLoaded: false
		};

	},

	setPage: function (pageIndex) {

		pageIndex = Math.max(0, Math.min(pageIndex, 1));
		this.setState({
			pageIndex: pageIndex
		});

	},

	dismissIntro: function () {

		if (this.props.onDismiss) this.props.onDismiss(this.refs.muteIntroInput.getDOMNode().checked);

	},

	handleInputChange: function () {

		this.refs.muteIntroLabel.getDOMNode().classList.toggle('checked', this.refs.muteIntroInput.getDOMNode().checked);

	},



	// ============================================================ //
	// Lifecycle
	// ============================================================ //

	render: function () {

		if (this.state.pageIndex === 0) {

			return (
				<div className='intro-modal'>
					<div className='page p0'>
						<div className='title-block'>
							<span className='title-sm'>the</span>
							<span className='title-lg'>FORCED</span>
							<span className='title-lg'>MIGRATION</span>
							<span className='title-sm'>of</span>
							<span className='title-lg'>ENSLAVED PEOPLE</span>
							<span className='title-sm'>in the United States</span>
						</div>
						<img src={ coverImgPath } className={ this.state.coverImgLoaded ? '' : 'loading' } />
						<div className='dates-overlay'><span>1810</span><span>1860</span></div>
						<p>The decades between the banning of the international slave trade in 1808 and the abolition of slavery during the Civil War saw the massive and harrowing relocation of approximately 850,000 enslaved men, women, and children. While some enslaved people were moved when their owners relocated to the western frontier, about two-thirds were bought and sold in America’s slave market. They were forcibly uprooted from their homes, separated from their loved ones, and marched and shipped across the South on railroads and steamships.</p>
						<div className='intro-modal-button' onClick={ function (e) { this.setPage(1); }.bind(this) }>Next</div>
					</div>
				</div>
			);

		} else {

			return (
				<div className='intro-modal'>
					<div className='page p1'>
						<div className='title-block'>
							<h3>How to Use</h3>
							<h2>THIS MAP</h2>
						</div>
						<div className='content'>
							<ol>
								<li>
									<div className='ordinal'>1</div>
									<div className='item'>
										<p>Click on the map for statistics about forced migration in particular counties and states.</p>
										<img src='./static/introModalStep01.png' />
									</div>
								</li>
								<li className='wider'>
									<div className='ordinal'>2</div>
									<div className='item'>
										<p>Markers connect to enslaved people’s first-hand accounts of the slave trade.</p>
										<img src='./static/introModalStep02.png' />
									</div>
								</li>
								<li>
									<div className='ordinal descender'>3</div>
									<div className='item'>
										<p>Use the timeline to select a different decade and trace the changing landscape of forced migration over time.</p>
										<img src='./static/introModalStep03.png' />
									</div>
								</li>
								<li className='wider'>
									<div className='ordinal descender'>4</div>
									<div className='item'>
										<p>Use the bubbleplot to explore population density and forced migration for a county, state or the South as a whole.</p>
										<img src='./static/introModalStep04.png' />
									</div>
								</li>
							</ol>
						</div>
						<p className='map-desc'>The map shows where nearly a million enslaved people were moved from and where they were moved to through the American slave trade and the migration of planters from 1810 to 1860.</p>
						<div className='intro-modal-button' onClick={ this.dismissIntro }>Enter</div>
						<div className='footer'>
							<div onClick={ function (e) { this.setPage(0); }.bind(this) }>&lt; back</div>
							<label onChange={ this.handleInputChange } ref='muteIntroLabel'><input type='checkbox' ref='muteIntroInput' />do not show again</label>
						</div>
					</div>
				</div>
			);

		}

	}

});

module.exports = IntroModal;