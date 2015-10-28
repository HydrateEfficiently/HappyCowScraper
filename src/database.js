(function () {

	var Promise = require("bluebird"),
		MongoDb = Promise.promisifyAll(require("mongodb")),
		Db = MongoDb.Db,
		Server = MongoDb.Server,
		PromiseUtil = require("./util/promiseUtil"),
		async = require("async");

	function createConnection() {
		return new Db('test', new Server('localhost', 27017)).openAsync();
	}

	function usingConnection(connectionFunc) {
		var dbHandle;
		return createConnection()
			.then(function (db) {
				dbHandle = db;
				return connectionFunc(db);
			})
			.finally(function () {
				dbHandle.close();
			});
	}

	function getCollection(db, collectionName) {
		return db.createCollection(collectionName);
	}

	function enumerateCollection(db, collectionName, forEachDoc) {
		var C_MAX_PARALLEL_TASKS = 10,
			deffered = PromiseUtil.defer(),
			queue = async.queue(function (task, callback) {
				return forEachDoc(task.doc).then(callback);
			}, C_MAX_PARALLEL_TASKS);

		queue.drain = function () {
			deffered.resolve();
		};

		getCollection(db, collectionName)
			.then(function (collection) {
				return collection.findAsync({});
			})
			.then(function (result) {
				result.each(function(err, doc) {
					if (doc) {
						queue.push({ doc: doc });
					}
				});
			});

		return deffered.promise;
	}

	// function enumerateCollection(db, collectionName, forEachDoc) {
	// 	var C_MAX_PARALLEL_TASKS = 10,
	// 		deffered = PromiseUtil.defer(),
	// 		queue,
	// 		cursor;

	// 	function readCursorAndPushTask() {
	// 		if (!cursor.isClosed() && cursor.hasNext()) {
	// 			queue.push({});
	// 		}
	// 	}

	// 	queue = async.queue(function (task, callback) {
	// 		if (!cursor.isClosed() && cursor.hasNext()) {
	// 			cursor.nextObjectAsync()
	// 				.then(function (doc) {
	// 					return forEachDoc(doc);
	// 				})
	// 				.then(function () {
	// 					readCursorAndPushTask();
	// 					callback();
	// 				});
	// 		} else {
	// 			callback();
	// 		}
	// 	}, C_MAX_PARALLEL_TASKS);

	// 	queue.drain = function () {
	// 		deffered.resolve();
	// 	};

	// 	getCollection(db, collectionName).then(function (collection) {
	// 		cursor = collection.find({});
	// 		for (var i = 1; i <= C_MAX_PARALLEL_TASKS; i++) {
	// 			readCursorAndPushTask();
	// 		}
	// 	});

	// 	return deffered.promise;
	// }

	module.exports = {
		usingConnection: usingConnection,
		getCollection: getCollection,
		enumerateCollection: enumerateCollection
	};

} ());