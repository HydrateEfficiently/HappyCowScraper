(function () {

	function Outlet(name, path, region) {
		this._id = path;
		this.path = path;
		this.name = name;
		this.regionName = region.name;
		this.regionPath = region.path;
		this.areOutletDetailsScraped = false;
	}

	module.exports = Outlet;

} ());