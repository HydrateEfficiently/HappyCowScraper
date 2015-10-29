(function () {

	function Region(options) {
		var path = options.path,
			name = options.name;
			
		this._id = path;
		this.path = path;
		this.name = name;
		this.isScraped = false;
		this.isTraversed = false;
		this.areOutletsScraped = false;
		this.children = [];
	}

	Region.getFindByIdQuery = function (region) {
		return { _id: region._id };
	};

	module.exports = Region;

} ());