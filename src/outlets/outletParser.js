(function () {

	var _ = require("lodash"),
		Outlet = require("./outlet");

	function getOutlets($, region) {
		return _.map(getOutletElements($), function (element) {
			return new Outlet(
				$(element).text().trim(),
				$(element)[0].attribs.href,
				region
			);
		});
	}

	function getOutletElements($) {
		return $("ul.list-group.listings").find("a.listing-link").toArray();
	}

	function hasNextPage($) {
		return !($("ul.pagination").children("li").last().hasClass("disabled"));
	}

	module.exports = {
		getOutlets: getOutlets,
		hasNextPage: hasNextPage
	};
	
} ());