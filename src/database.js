(function () {

	var Promise = require("bluebird"),
		MongoDb = Promise.promisifyAll(require("mongodb")),
		Db = MongoDb.Db,
		Server = MongoDb.Server,
		PromiseUtil = require("./util/promiseUtil");

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
		var deferred = PromiseUtil.defer();

		getCollection(db, collectionName)
			.then(function (collection) {
				var stream = collection.find().stream();

				stream.on("end", function () {
					deferred.resolve();
				});

				stream.on("data", function (doc) {
					forEachDoc(doc);
				});
			});

		return deferred.promise;
	}

	module.exports = {
		usingConnection: usingConnection,
		getCollection: getCollection,
		enumerateCollection: enumerateCollection
	};

} ());