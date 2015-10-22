(function () {

	var when = require("when");

	function promiseWhile(condition, worker, iteration) {
		var deferred = when.defer();

		function loop() {
			if (!condition()) {
				deferred.resolve();
			} else {
				when.promise(worker).then(iteration).then(loop);
			}
		}

		setTimeout(loop, 0);

		return deferred.promise;
	}

	exports.promiseWhile = promiseWhile;

} ());