(function () {

	var Promise = require("bluebird"),
		_ = require("lodash"),
		db = require("./../database"),
		ScrapeRequester = require("./../scrapeRequester"),
		HappyCowUtil = require("./../util/happyCowUtil");

	function RegionScraper(regions) {
		this.regions = regions;
	}

	RegionScraper.prototype.scrape = function () {
		var self = this,
			collectionName = "RegionScrape-" + new Date().getTime(),
			regionsJson = _.map(
				this.regions, 
				function (region) {
					return self._getRegionJson(region[0], region[1]);
				});

		return db.createCollection(collectionName)
			.then(function (collection) {
				self._collection = collection;
				return self._insertRegions(regionsJson);
			})
			.then(function () {
				return self._scrapeRootRegions(regionsJson);
			});
	};

	RegionScraper.prototype._scrapeRootRegions = function (regions) {
		var self = this,
			scrapeRegionFuncs = _.map(
				regions,
				function (region) {
					return self._scrapeRegion(region);
				});

		return Promise.all(scrapeRegionFuncs);
	};

	RegionScraper.prototype._scrapeRegion = function (region) {
		var self = this,
			regionUrl = HappyCowUtil.buildUrl(region.path);

		return new Promise(function (resolve) {
			ScrapeRequester.queueRequest(regionUrl, function ($) {
				if (self._regionHasSubRegions($)) {
					var subRegions = self._getSubRegions($);
					self._insertSubRegions(region, subRegions)
						.then(function () {
							return self._scrapeSubRegions(subRegions);
						})
						.then(function () {
							return self._markRegionAsCompleted(region);
						})
						.then(resolve);
				} else {
					self._markRegionAsCompleted(region).then(resolve);
				}
			});
		});
	};

	RegionScraper.prototype._insertSubRegions = function (parentRegion, subRegions) {
		var self = this;
		return this._insertRegions(subRegions)
			.then(function () {
				self._collection.update(
					{ _id: parentRegion._id },
					{
						"$push": {
							"children": {
								"$each": _.map(subRegions, function (region) { return region.path; })
							}
						},
						"$set": {
							"isParent": true
						}
					});
			});
	};

	RegionScraper.prototype._insertRegions = function (regions) {
		return this._collection.insertMany(regions);
	};

	RegionScraper.prototype._markRegionAsCompleted = function (region) {
		return this._collection.update(
			{ _id: region._id },
			{ "$set": { scrapeCompleted: true } });
	};

	RegionScraper.prototype._updateRegion = function (region, values) {
		return this._collection.update({ path: region.path }, values);
	};

	RegionScraper.prototype._scrapeSubRegions = function (subRegions) {
		var self = this;
		return Promise.all(_.map(subRegions, function (subRegion) {
			return self._scrapeRegion(subRegion);
		}));
	};

	RegionScraper.prototype._regionHasSubRegions = function ($) {
		return this._getSubRegionElements($).length > 0;
	};

	RegionScraper.prototype._getSubRegions = function ($) {
		var self = this;
		return _.map(this._getSubRegionElements($), function (element) {
			return self._getRegionJson(
				$(element).text().trim(),
				$(element).children("a")[0].attribs.href
			);
		});
	};

	RegionScraper.prototype._getSubRegionElements = function ($) {
		return $("ul.list-group > li.country.list-group-item").toArray();
	};

	RegionScraper.prototype._getRegionJson = function (name, path) {
		return {
			_id: path,
			path: path,
			name: name,
			isParent: false,
			scrapeCompleted: false,
			children: []
		};
	};

	module.exports = RegionScraper;
	
} ());