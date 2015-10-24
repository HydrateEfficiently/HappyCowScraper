(function () {

	var Promise = require("bluebird"),
		_ = require("lodash"),
		db = require("./../database"),
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

		return Promise.resolve(function () {
				db.getCollection(this.collectionName, this.overwrite);
			})
			.then(function (collection) {
				self._collection = collection;
				return self._insertRootRegions(regions);
			})
			.then(function (regionsFromDb) {
				return self._traverseRegions(regionsFromDb);
			});
	};

	RegionScraper.prototype._insertRootRegions = function (regions) {
		var self = this;
		return Promise.all(Promise.map(regions), function (region) {
			return collection.findAndModify({
				query: region.getFindByIdQuery(),
				upsert: true
			});
		});
	};

	RegionScraper.prototype._scrapeRootRegions = function (regions) {
		var self = this,
			regionsToScrape = this._whereRegionNotScraped(regions),
			scrapeRegionFuncs = _.map(
				regionsToScrape,
				function (region) {
					return self._scrapeRegion(region);
				});

		return Promise.all(scrapeRegionFuncs);
	};

	RegionScraper.prototype._traverseRegions = function (regions) {
		var self = this;
		return Promise.all(
			Promise.map(regions, function (region) {
				return self._traverseRegion(region);
			}));
	};

	RegionScraper.prototype._traverseRegion = function (region) {
		var self = this;
		return new Promise(function (resolve) {
			if (region.isScraped) {
				if (region.isTraversed || !region.isParent) { // TODO: Need isParent?
					resolve();
				} else {
					self._traverseChildRegions(region).then(resolve);
				}
			} else {
				self._scrapeRegion(region).then(function ($) {
					if (self._regionHasChildRegions($)) {
						var childRegions = self._parseChildRegions($);
						Promise.resolve(function () {
							return self._insertRegionsWithParent(region, childRegions);
						})
						.then(function () {
							return self._markRegionAsScraped(region);
						})
						.then(function () {
							return self._traverseChildRegions(childRegions);
						})
						.then(function () {
							return self._markRegionAsTraversed(region);
						})
						.then(resolve);
					} else {
						Promise.resolve(function () {
							return self._markRegionAsScraped(region);
						})
						.then(function () {
							return self._markRegionAsTraversed(region);
						})
						.then(resolve);
					}
				});
			}
		});
	};

	RegionScraper.prototype._traverseChildRegions = function (region) {
		var self = this;
		return Promise.resolve(function () {
				return self._getChildRegions(region);
			})
			.then(function (childRegions) {
				return Promise.resolve(function () {
						return self._traverseRegions(childRegions);
					})
					.then(function () {
						return self._markRegionAsTraversed(region);
					});
			});
	};

	RegionScraper.prototype._insertRegionsWithParent = function (parentRegion, childRegions) {
		var self = this;
		return Promise.resolve(function () {
				return self._insertRegions(childRegions);
			})
			.then(function () {
				return self._collection.update(
					parentRegion.getFindByIdQuery(),
					{ 
						"$push": {
							"children": {
								"$each": _.map(subRegions, function (region) { return region.path; })
							}
						}
					});
			});	
	};

	RegionScraper.prototype._insertRegions = function (regions) {
		return this._collection.insertMany(regions);
	};

	RegionScraper.prototype._updateRegionToScraped = function (region) {
		return this._updateRegion(region, { isScraped: true });
	};

	RegionScraper.prototype._updateRegionToTraversed = function (region) {
		return this._updateRegion(region, { isTraversed: true });
	};

	RegionScraper.prototype._updateRegion = function (region, update) {
		return this._collection.update({ _id: parentRegion._id }, { "$set": update });
	};

	RegionScraper.prototype._getChildRegions = function (region) {
		return this._collection.find({
			"_id": {
				"$in": region.children
			}
		});
	};

	module.exports = RegionScraper;
	
} ());