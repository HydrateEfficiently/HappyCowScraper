(function () {

	var Promise = require("bluebird"),
		_ = require("lodash"),
		async = require("async"),
		Constants = require("./../constants"),
		Database = require("./../database"),
		ScrapeRequester = require("./../scrapeRequester"),
		HappyCowUtil = require("./../util/happyCowUtil"),
		PromiseUtil = require("./../util/promiseUtil"),
		OutletParser = require("./outletParser");

	function OutletScraper(options) {
		this.outletCollectionName = Constants.C_OUTLET_COLLECTION_NAME_PREFIX + options.collectionNameSuffix;
		this.regionCollectionName = Constants.C_REGION_COLLECTION_NAME_PREFIX + options.collectionNameSuffix;
	}

	OutletScraper.prototype.scrape = function () {
		return Database.usingConnection(this._withDatabaseConnection.bind(this));
	};

	OutletScraper.prototype._withDatabaseConnection = function (db) {
		return this._initializeCollection(db)
			.then(this._findOutlets.bind(this, db));
	};

	OutletScraper.prototype._initializeCollection = function (db) {
		var self = this;
		return Database.getCollection(db, this.outletCollectionName)
			.then(function (collection) {
				self._collection = collection;
				return PromiseUtil.identityPromise();
			});
	};

	OutletScraper.prototype._findOutlets = function (db) {
		console.log("Enumerating regions");
		return Database.enumerateCollection(db, this.regionCollectionName, this._scrapeRegionForOutlet.bind(this));
	};

	OutletScraper.prototype._scrapeRegionForOutlet = function (region) {
		if (!region) {
			var i = 0;
		}

		var self = this,
			path = region.path;

		return new Promise(function (resolve) {
			if (!region.isTraversed) {
				throw "Region was not marked as traversed - " + path;
			} else if (region.children.length > 0) {
				console.log("Region is a parent, skipping - " + path);
				resolve();
			} else {
				self._doScrape(region).then(resolve);
			}
		});
	};

	OutletScraper.prototype._doScrape = function (region) {
		var self = this,
			deferred = PromiseUtil.defer(),
			pageNumber = 0,
			currentPageScrape,
			currentUrl;

		async.doWhilst(
			function (callback) {
				pageNumber++;
				currentUrl = self._getPageUrl(region, pageNumber);

				console.log("Begin scraping outlets for region - " + currentUrl);
				ScrapeRequester.queueRequest(currentUrl)
					.then(function ($) {
						console.log("End scraping outlets for region - " + currentUrl);
						currentPageScrape = $;
						var outlets = OutletParser.getOutlets(currentPageScrape, region);
						return self._insertOutlets(outlets);
					})
					.then(callback);
			},
			function () {
				if (OutletParser.hasNextPage(currentPageScrape)) {
					console.log("Next page found - " + currentUrl);
					return true;
				} else {
					console.log("No next page, resolving - " + currentUrl);
					deferred.resolve();
					return false;
				}
			});

		return deferred.promise;
	};

	OutletScraper.prototype._getPageUrl = function (region, pageNumber) {
		return HappyCowUtil.buildUrl(region.path + "?page=" + pageNumber + "&svo=2");
	};

	OutletScraper.prototype._insertOutlets = function (outlets) {
		var self = this;
		console.log("Begin inserting outlets - " + outlets[0].regionPath);
		return this._collection.insertManyAsync(outlets)
			.then(function () {
				console.log("End inserting outlets - " + outlets[0].regionPath);
			});
	};

	module.exports = OutletScraper;

} ());