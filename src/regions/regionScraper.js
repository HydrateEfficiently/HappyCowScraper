(function () {

	var Promise = require("bluebird"),
		_ = require("lodash"),
		Constants = require("./../constants"),
		Database = require("./../database"),
		Region = require("./region"),
		RegionParser = require("./regionParser"),
		ScrapeRequester = require("./../scrapeRequester"),
		HappyCowUtil = require("./../util/happyCowUtil"),
		PromiseUtil = require("./../util/promiseUtil");

	function RegionScraper(options) {
		this.regions = options.regions;
		this.collectionName =  Constants.C_REGION_COLLECTION_NAME_PREFIX + options.collectionNameSuffix;
	}

	RegionScraper.prototype.scrape = function () {
		return Database.usingConnection(this._withDatabaseConnection.bind(this));
	};

	RegionScraper.prototype._withDatabaseConnection = function (db) {
		return this._initializeCollection(db, this.collectionName)
			.then(this._insertRootRegion.bind(this))
			.then(this._insertBaseRegions.bind(this))
			.then(this._traverseRegions.bind(this));
	};

	RegionScraper.prototype._initializeCollection = function (db) {
		var self = this;
		return Database.getCollection(db, this.collectionName)
			.then(function (collection) {
				self._collection = collection;
				return PromiseUtil.identityPromise();
			});
	};

	RegionScraper.prototype._insertRootRegion = function () {
		var rootRegion = new Region({ path: Constants.C_ROOT_REGION_ID });
		return this._getRegionOrInsert(rootRegion);
	};

	RegionScraper.prototype._insertBaseRegions = function (rootRegion) {
		var self = this,

			regions = _.map(this.regions, function (region) { 
				return new Region({
					name: region[0],
					path: region[1]
				});
			});

		return this._getRegions(regions)
			.then(function (regionsFromDatabase) {
				var regionsToInsert = _.filter(regions, function (region) {
					return _.findIndex(regionsFromDatabase, function (regionFromDatabase) {
						return regionFromDatabase && regionFromDatabase.path === region.path;
					}) < 0;
				});
				return self._insertRegionsWithParent(rootRegion, regionsToInsert)
					.then(self._getRegions.bind(self, regions));
			});
	};

	RegionScraper.prototype._traverseRegions = function (regions) {
		var self = this;
		return Promise.map(regions, function (region) {
			return self._traverseRegion(region);
		});
	};

	RegionScraper.prototype._traverseRegion = function (region) {
		var self = this,
			regionPath = region.path;

		console.log("Started traversal - " + regionPath);
		return new Promise(function (resolve) {
			if (region.isScraped) {
				if (region.isTraversed) {
					console.log("Already traversed, skipping - " + regionPath);
					resolve();
				} else {
					console.log("Already scraped, started traversing children - " + regionPath);
					self._traverseChildRegions(region).then(resolve);
				}
			} else {
				console.log("Started scraping - " + regionPath);
				ScrapeRequester.queueRequest(HappyCowUtil.buildUrl(region.path)).then(function ($) {
					console.log("Received web page - " + regionPath);

					if (RegionParser.regionHasSubRegions($)) {
						var childRegions = RegionParser.getSubRegions($),
							regionFromDb;

						console.log("Region found to have children. Started updating data - " + regionPath);
						return self._insertRegionsWithParent(region, childRegions)
							.then(function () {
								console.log("Inserted child regions - " + regionPath);
								return self._getRegionById(region.path);
							})
							.then(function (region) {
								regionFromDb = region;
								return self._updateRegionToScraped(regionFromDb);
							})
							.then(function () {
								console.log("Updated region to scraped - " + regionPath);
								console.log("Started traversing children - " + regionPath);
								return self._traverseChildRegions(regionFromDb);
							})
							.then(function () {
								console.log("Finished traversing children - " + regionPath);
								resolve();
							});
					} else {
						console.log("Region has no children. Started updating data - " + regionPath);
						self._updateRegionToScraped(region)
							.then(function () {
								console.log("Region had no children, isScraped set to true - " + regionPath);
								return self._updateRegionToTraversed(region);
							})
							.then(function () {
								console.log("Region had no children, isTraversed set to true - " + regionPath);
								resolve();
							});
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

	RegionScraper.prototype._getRegionOrInsert = function (region) {
		var self = this;
		return this._getRegionById(region.path)
			.then(function (result) {
				if (result) {
					return result;
				} else {
					return self._insertRegion(region);
				}
			});
	};

	RegionScraper.prototype._insertRegion = function (region) {
		return this._collection.insertAsync(region)
			.then(function (insertResult) {
				return insertResult.ops[0];
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

	RegionScraper.prototype._getRegionById = function (id) {
		return this._collection.findOneAsync({
			"_id": id
		});
	};

	RegionScraper.prototype._getRegions = function (regions) {
		var self = this;
		return Promise.map(regions, function (region) {
			return self._getRegionById(region.path);
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