(function () {

	var Promise = require("bluebird");

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
		var deferred = defer();

		function loop() {
			if (!condition()) {
				deferred.resolve(result());
			} else {
				new Promise(worker).then(iteration).then(loop);
			}
		}

		setTimeout(loop, 0);

		return deferred.promise;
	}

	function defer() {
		var resolve, reject;

		var promise = new Promise(function() {
			resolve = arguments[0];
			reject = arguments[1];
		});

		return {
			resolve: resolve,
			reject: reject,
			promise: promise
		};
	}

	function identityPromise() {
		return new Promise(function (resolve) {
			resolve();
		});
	}

	module.exports = {
		promiseWhile: promiseWhile,
		defer: defer,
		identityPromise: identityPromise
	};

} ());