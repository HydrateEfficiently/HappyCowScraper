var RegionScraper = require("./src/regionScraper").RegionScraper;
var promiseWhile = require("./src/promiseWhile").promiseWhile;
var when = require("when");

console.log("Program started");

var regionScraper = new RegionScraper("http://happycow.net");
regionScraper.scrape([
	//["Australia & Oceania", "/m/australia/"],
	["New Zealand", "/m/australia/new_zealand/auckland/"]
]);