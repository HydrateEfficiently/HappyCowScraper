(function () {

	var Promise = require("bluebird"),
		_ = require("lodash"),
		Constants = require("./../constants"),
		Database = require("./../database"),
		ScrapeRequester = require("./../scrapeRequester"),
		HappyCowUtil = require("./../util/happyCowUtil"),
		PromiseUtil = require("./../util/promiseUtil");

	function OutletScraper(options) {
		this.outletCollectionName = Constants.C_OUTLET_COLLECTION_NAME_PREFIX + options.collectionNameSuffix;
		this.regionCollectionName = Constants.C_REGION_COLLECTION_NAME_PREFIX + options.collectionNameSuffix;
	}

	OutletScraper.prototype.scrape = function () {
		return Database.usingConnection(this._withDatabaseConnection.bind(this));
	};

	OutletScraper.prototype._withDatabaseConnection = function (db) {
		return this._initializeCollection(db)
			.then(this._enumerateRegions.bind(this, db));
	};

	OutletScraper.prototype._initializeCollection = function (db) {
		var self = this;
		return Database.getCollection(db, this.outletCollectionName)
			.then(function (collection) {
				self._collection = collection;
				return PromiseUtil.identityPromise();
			});
	};

	OutletScraper.prototype._enumerateRegions = function (db) {
		console.log("Enumerating regions");
		return Database.enumerateCollection(db, this.regionCollectionName, this._forEachRegion.bind(this));
	};

	OutletScraper.prototype._forEachRegion = function (region) {
		
	};

	module.exports = OutletScraper;

} ());



// RegionScraper.prototype._scrapeRegionForPages = function ($) {
// 		var deferred = when.defer(),
// 			$currentPage = $,
// 			scrapedPages = [$currentPage];

// 		promiseWhile(this._hasNextPage($currentPage), function () {
// 		});

// 		if (this._hasNextPage($currentPage)) {
// 			scrapeRequester.queueRequest(this._getNextPageUrl($currentPage), function ($) {

// 			});
// 		}

// 		return deferred;
// 	};

// 	RegionScraper.prototype._getNextPage = function ($currentPage) {

// 	};

// 	RegionScraper.prototype._hasNextPage = function ($) {
// 		return !$("ul.pagination").children("li").last().hasClass("disabled");
// 	};

// 	RegionScraper.prototype._getPageNumber = function ($) {
// 		return $("ul.pagination").children("li.active").text();
// 	};

// 	RegionScraper.prototype._getNextPageUrl = function ($) {

// 	};