(function () {

	var _ = require("lodash"),
		Region = require("./region");

	function regionHasSubRegions($) {
		return getSubRegionElements($).length > 0;
	}

	function getSubRegions($) {
		var self = this;
		return _.map(getSubRegionElements($), function (element) {
			return new Region({
				path: $(element).children("a")[0].attribs.href,
				name: $(element).text().trim()
			});
		});
	}

	function getSubRegionElements($) {
		return $("ul.list-group > li.country.list-group-item").toArray();
	}

	module.exports = {
		regionHasSubRegions: regionHasSubRegions,
		getSubRegions: getSubRegions
	};
	
} ());