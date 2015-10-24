(function () {

	function Region(name, path) {
		this._id = path;
		this.path = path;
		this.name = name;
		this.isParent = false;
		this.scrapeCompleted = false;
		this.traverseCompleted = false;
		this.children = [];
	}

	Region.prototype.getFindByIdQuery = function () {
		return { _id: this._id };
	};

	module.exports = Region;

} ());