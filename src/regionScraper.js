(function () {

	var scraperjs = require("scraperjs"),
		_ = require("lodash"),
		when = require("when"),
		scrapeRequester = require("./scrapeRequester");

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
					resolve();
					//self._scrapeRegionForOutlets(region).then(resolve);
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

	RegionScraper.prototype._scrapeRegionForPages = function ($) {
		var deferred = when.defer(),
			$currentPage = $,
			scrapedPages = [$currentPage];

		promiseWhile(this._hasNextPage($currentPage), function () {
		});

		if (this._hasNextPage($currentPage)) {
			scrapeRequester.queueRequest(this._getNextPageUrl($currentPage), function ($) {

			});
		}

		return deferred;
	};

	RegionScraper.prototype._getNextPage = function ($currentPage) {

	};

	RegionScraper.prototype._hasNextPage = function ($) {
		return !$("ul.pagination").children("li").last().hasClass("disabled");
	};

	RegionScraper.prototype._getPageNumber = function ($) {
		return $("ul.pagination").children("li.active").text();
	};

	RegionScraper.prototype._getNextPageUrl = function ($) {

	};

	exports.RegionScraper = RegionScraper;
} ());