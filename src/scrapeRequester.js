(function () {

	var scraperjs = require("scraperjs"),
		promiseUtil = require("./promiseWhile");

	var C_MAX_OUTGOING_REQUESTS = 10;

	var queuedRequests = [],
		outgoingRequestCount = 0;

	function queueRequest(url) {
		var defer = promiseUtil.defer();
		queuedRequests.push({ url: url, defer: defer });
		checkShouldService();
		return defer.promise;
	}

	function checkShouldService() {
		if (queuedRequests.length > 0 && outgoingRequestCount < 10) {
			serviceNextRequest();
		}
	}

	function serviceNextRequest() {
		var request = queuedRequests.splice(0, 1)[0];
		outgoingRequestCount++;
		console.log("Request started: " + request.url);
		scraperjs.StaticScraper.create(request.url).scrape(function ($) {
			console.log("Request finished: " + request.url);
			outgoingRequestCount--;
			checkShouldService();
			setTimeout(function () {
				request.defer.resolve($);
			}, 0);
		});
	}

	exports.queueRequest = queueRequest;

} ());