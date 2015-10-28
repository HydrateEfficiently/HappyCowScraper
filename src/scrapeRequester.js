(function () {

	var scraperjs = require("scraperjs"),
		async = require("async"),
		PromiseUtil = require("./util/promiseUtil");

	var C_MAX_OUTGOING_REQUESTS = 10;

	var queue = async.queue(function (task, callback) {
		scraperjs.StaticScraper.create(task.url).scrape(function ($) {
			callback();
			task.deffered.resolve($);
		}).catch(function (error) {
			var e = error;
		});
	}, C_MAX_OUTGOING_REQUESTS);

	function queueRequest(url) {
		var deffered = PromiseUtil.defer();
		queue.push({ url: url, deffered: deffered });
		return deffered.promise;
	}

	exports.queueRequest = queueRequest;

} ());