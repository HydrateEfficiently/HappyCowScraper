var RegionScraper = require("./src/regions/regionScraper");
var promiseWhile = require("./src/promiseWhile").promiseWhile;

console.log("Program started");

/*
	Usage: main.js [startStep] [resume] [maxResults]
*/

/*
	Step 1: Scrape regions
	Step 2: Scrape outlets
	Step 3: Scrape outlet details
*/

var regionScraper = new RegionScraper({
	regions: [
		["Australia & Oceania", "/m/australia/"]
	],
	collectionName: "RegionScrape-1",
	overwrite: false
});

regionScraper.scrape().then(function () {
	var i = 0;
});