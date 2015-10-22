(function () {

	var scraperjs = require("scraperjs"),
		_ = require("lodash"),
		when = require("when"),
		scrapeRequester = require("./scrapeRequester"),
		promiseWhile = require("./promiseWhile").promiseWhile;

	function RegionScraper(rootUrl) {
		this.rootUrl = rootUrl;
	}

	RegionScraper.prototype.scrape = function (regions) {
		var self = this;
		this._scrapeRegions(_.map(regions, function (region) {
			return self._createRegionJson(region[0], region[1]);
		}));
	};

	RegionScraper.prototype._getUrl = function (path) {
		return this.rootUrl + path;
	};

	RegionScraper.prototype._createRegionJson = function (name, path) {
		return {
			name: name,
			path: path,
			subRegions: [],
			outlets: []
		};
	};

	RegionScraper.prototype._appendSubRegions = function (parent, subRegions) {
		var self = this;
		parent.subRegions = _.map(subRegions, function (region) {
			return self._createRegionJson(region.name, region.path);
		});
	};

	RegionScraper.prototype._getSubRegionElements = function ($) {
		return $("ul.list-group > li.country.list-group-item");
	};

	RegionScraper.prototype._hasSubRegions = function ($) {
		return this._getSubRegionElements($).length > 0;
	};

	RegionScraper.prototype._getSubRegions = function ($) {
		return this._getSubRegionElements($).map(function () {
			return {
				name: $(this).text().trim(),
				path: $(this).children("a")[0].attribs.href
			};
		});
	};

	RegionScraper.prototype._scrapeRegion = function (region) {
		var self = this,
			regionUrl = this._getUrl(region.path);

		return when.promise(function (resolve) {
			scrapeRequester.queueRequest(regionUrl, function ($) {
				if (self._hasSubRegions($)) {
					self._appendSubRegions(region, self._getSubRegions($));
					self._scrapeSubRegions(region).then(resolve);
				} else {
					self._scrapeRegionForOutlets($, region).then(resolve);
				}
			});
		});
	};

	RegionScraper.prototype._scrapeSubRegions = function (region) {
		var self = this;
		return when.all(_.map(region.subRegions, function (subRegion) {
			return self._scrapeRegion(subRegion);
		}));
	};

	RegionScraper.prototype._scrapeRegions = function (regions) {
		var self = this;
		var scrapeRegionFunctions = _.map(regions, function (region) {
			return self._scrapeRegion(region);
		});
		return when.all(scrapeRegionFunctions).then(function () {
			return regions;
		});
	};

	RegionScraper.prototype._scrapeRegionForOutlets = function ($, region) {
		return this._scrapeRegionForPages($, region).then(function () {
			var i = "test";
		});
	};

	RegionScraper.prototype._scrapeRegionForPages = function ($, region) {
		var self = this,
			$currentPage = $,
			pageNumber = 1,
			pages = [$currentPage];

		return promiseWhile(
			function condition() {
				return self._hasNextPage($currentPage, region);
			},
			function worker(resolve) {
				pageNumber++;
				scrapeRequester.queueRequest(self._getPageUrl(region, pageNumber), function ($page) {
					resolve($page);
				});
			},
			function iteration(result) {
				$currentPage = result;
				pages.push($currentPage);
			},
			function result() {
				return pages;
			});
	};

	RegionScraper.prototype._getPageUrl = function (region, pageNumber) {
		return this.rootUrl + region.path + "?page=" + pageNumber;
	};

	RegionScraper.prototype._hasNextPage = function ($) {
		return !($("ul.pagination").children("li").last().hasClass("disabled"));
	};

	exports.RegionScraper = RegionScraper;
} ());