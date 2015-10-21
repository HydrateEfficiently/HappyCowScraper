var scraperjs = require("scraperjs"),
	_ = require("lodash"),
	when = require("when");

var rootUrl = "http://happycow.net",
	regions = [
		createRegionJson("Australia & Oceania", "/m/australia/")
		//createRegionJson("North America", "/m/north_america/")
	];

function createRegionJson(name, path) {
	return {
		name: name,
		path: path,
		subRegions: [],
		outlets: []
	};
}

function appendSubRegions(parent, subRegions) {
	parent.subRegions = _.map(subRegions, function (region) {
		return createRegionJson(region.name, region.path);
	});
}

function getTopLevelRegionUrls() {
	return _.map(topLevelRegions, function (region) {
		return rootUrl + region;
	});
}

function getSubRegionElements($) {
	return $("ul.list-group > li.country.list-group-item");
}

function hasSubRegions($) {
	return getSubRegionElements($).length > 0;
}

function getSubRegions($) {
	return getSubRegionElements($).map(function () {
		return {
			name: $(this).text().trim(),
			path: $(this).children("a")[0].attribs.href
		};
	});
}

function scrapeRegion(region) {
	var regionUrl = rootUrl + region.path,
		promise = when.promise(function(resolve, reject, notify) {
			console.log("Started request for: " + regionUrl);
			scraperjs.StaticScraper.create(regionUrl).scrape(function ($) {
				if (hasSubRegions($)) {
					appendSubRegions(region, getSubRegions($));
					when.all(_.map(region.subRegions, function (subRegion) {
						return scrapeRegion(subRegion);
					})).then(function () {
						resolve();
					});
				} else {
					resolve();
				}
			});
		});
	return promise;
}

function scrape() {
	var scrapeRegionFunctions = _.map(regions, function (region) {
		return scrapeRegion(region);
	});
	when.all(scrapeRegionFunctions)
		.then(function () {
			console.log(regions);
		});
}

console.log("Started");
scrape();
