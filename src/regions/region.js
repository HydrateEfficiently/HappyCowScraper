(function () {

	function Region(name, path) {
		this._id = path;
		this.path = path;
		this.name = name;
		this.isScraped = false;
		this.isTraversed = false;
		this.children = [];
	}

	Region.getFindByIdQuery = function (region) {
		return { _id: region._id };
	};

	module.exports = Region;

} ());