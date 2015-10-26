(function () {

	var Promise = require("bluebird"),
		_ = require("lodash"),
		db = require("./../database"),
		Region = require("./region"),
		RegionParser = require("./regionParser"),
		ScrapeRequester = require("./../scrapeRequester"),
		HappyCowUtil = require("./../util/happyCowUtil");

	function RegionScraper(options) {
		this.regions = options.regions;
		this.collectionName = options.collectionName || "RegionScrape-" + new Date().getTime();
		this.overwrite = options.overwrite || true;
	}

	RegionScraper.prototype.scrape = function () {
		var self = this,
			regions = _.map(this.regions, function (region) { return new Region(region[0], region[1]); });

		return new Promise(function (resolve) {
				return resolve(db.getCollection(self.collectionName, self.overwrite));
			})
			.then(function (collection) {
				self._collection = collection;
				return self._insertRootRegions(regions);
			})
			.then(function (batchResult) {
				return self._traverseRegions(_.map(batchResult, function (result) {
					return result.ops[0];
				}));
			});
	};

	RegionScraper.prototype._insertRootRegions = function (regions) {
		var self = this;
		return Promise.map(regions, function (region) {
			return (
				self._collection.insertAsync(region)
				.catch(function (e) {
					var ex = e;
				}));
		});
	};

	RegionScraper.prototype._traverseRegions = function (regions) {
		var self = this;
		return Promise.map(regions, function (region) {
			return self._traverseRegion(region);
		});
	};

	RegionScraper.prototype._traverseRegion = function (region) {
		var self = this;
		return new Promise(function (resolve) {
			if (region.isScraped) {
				if (region.isTraversed) { // TODO: Need isParent?
					resolve();
				} else {
					self._traverseChildRegions(region).then(resolve);
				}
			} else {
				ScrapeRequester.queueRequest(HappyCowUtil.buildUrl(region.path)).then(function ($) {
					if (RegionParser.regionHasSubRegions($)) {
						var childRegions = RegionParser.getSubRegions($),
							regionFromDb;

						return (
							self._insertRegionsWithParent(region, childRegions)
							.then(self._getRegion.bind(self, region.path))
							.then(function (region) {
								regionFromDb = region;
								return self._updateRegionToScraped(regionFromDb);
							})
							.then(function () {
								return self._traverseChildRegions(regionFromDb);
							})
							.then(resolve));
					} else {
						self._updateRegionToScraped(region)
							.then(function () {
								return self._updateRegionToTraversed(region);
							})
							.then(resolve);
					}
				});
			}
		});
	};

	RegionScraper.prototype._traverseChildRegions = function (region) {
		var self = this;
		return self._getChildRegions(region)
			.then(function (childRegions) {
				return self._traverseRegions(childRegions)
					.then(function () {
						return self._updateRegionToTraversed(region);
					});
			});
	};

	RegionScraper.prototype._insertRegionsWithParent = function (parentRegion, childRegions) {
		var self = this;
		return new Promise(function (resolve) {
				return resolve(self._insertRegions(childRegions));
			})
			.then(function () {
				return self._collection.updateAsync(
					Region.getFindByIdQuery(parentRegion),
					{ 
						"$push": {
							"children": {
								"$each": _.map(childRegions, function (region) { return region.path; })
							}
						}
					});
			});	
	};

	RegionScraper.prototype._insertRegions = function (regions) {
		return this._collection.insertManyAsync(regions);
	};

	RegionScraper.prototype._updateRegionToScraped = function (region) {
		return this._updateRegion(region, { isScraped: true });
	};

	RegionScraper.prototype._updateRegionToTraversed = function (region) {
		return this._updateRegion(region, { isTraversed: true });
	};

	RegionScraper.prototype._updateRegion = function (region, update) {
		return this._collection.updateAsync(Region.getFindByIdQuery(region), { "$set": update });
	};

	RegionScraper.prototype._getRegion = function (id) {
		return this._collection.findOneAsync({
			"_id": id
		});
	};

	RegionScraper.prototype._getChildRegions = function (region) {
		return this._collection.findAsync({
			"_id": {
				"$in": region.children
			}
		})
		.then(function (result) {
			return result.toArrayAsync();
		});
	};

	module.exports = RegionScraper;
	
} ());