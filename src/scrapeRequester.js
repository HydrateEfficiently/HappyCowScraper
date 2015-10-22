(function () {

	var scraperjs = require("scraperjs");

	var C_MAX_OUTGOING_REQUESTS = 10;

	var queuedRequests = [],
		outgoingRequestCount = 0;

	function queueRequest(url, callback) {
		queuedRequests.push({ url: url, callback: callback });
		checkShouldService();
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
				request.callback($);
			}, 0);
		});
	}

	exports.queueRequest = queueRequest;

} ());