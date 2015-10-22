(function () {

	var when = require("when");

	/* Example of promiseWhile usage:
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
	*/

	function promiseWhile(condition, worker, iteration, result) {
		var deferred = when.defer();

		function loop() {
			if (!condition()) {
				deferred.resolve(result());
			} else {
				when.promise(worker).then(iteration).then(loop);
			}
		}

		setTimeout(loop, 0);

		return deferred.promise;
	}

	exports.promiseWhile = promiseWhile;

} ());