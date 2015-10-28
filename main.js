(function () {

	var RegionScraper = require("./src/regions/regionScraper"),
		OutletScraper = require("./src/outlets/outletScraper");

	var C_REGIONS_TO_SEARCH = [
				["New Zealand", "/m/australia/new_zealand/"]
				//["Australia & Oceania", "/m/australia/"]
			],
		C_COLLECTION_NAME_SUFFIX = "-1";

	/*
		Usage: main.js [startStep] [resume] [maxResults]
	*/

	/*
		Step 1: Scrape regions
		Step 2: Scrape outlets
		Step 3: Scrape outlet details
	*/

	function scrapeRegion() {
		return new RegionScraper({
			regions: C_REGIONS_TO_SEARCH,
			collectionNameSuffix: C_COLLECTION_NAME_SUFFIX
		}).scrape();
	}

	function scrapeOutlets() {
		return new OutletScraper({
			collectionNameSuffix: C_COLLECTION_NAME_SUFFIX
		}).scrape();
	}

	console.log("Program started");

	scrapeRegion().then(scrapeOutlets).then(function () {
		console.log("Program finished");
		process.exit();
	});

} ());

