var RegionScraper = require("./src/regionScraper").RegionScraper;
var promiseWhile = require("./src/promiseWhile").promiseWhile;
var when = require("when");

console.log("Program started");

// var regionScraper = new RegionScraper("http://happycow.net");
// regionScraper.scrape([
// 	//["Australia & Oceania", "/m/australia/"],
// 	["New Zealand", "/m/australia/new_zealand/"]
// ]);


var count = 0;

function getWorkerPromise() {
	return when.promise(function (resolve) {
		setTimeout(resolve, 1000);
	});
}

promiseWhile(
	function () {
		return count < 10;
	},
	function (resolve) {
		setTimeout(resolve, 1000);
	},
	function (result) {
		count++; console.log(count);
	})
.then(function () {
	console.log("Completed!");
});