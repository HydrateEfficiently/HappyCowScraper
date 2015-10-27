(function () {

	var Promise = require("bluebird"),
		MongoDb = Promise.promisifyAll(require("mongodb")),
		Db = MongoDb.Db,
		Server = MongoDb.Server;

	var db = new Db('test', new Server('localhost', 27017));

	function getCollection(collectionName, overwrite) {
		return db.open()
			.then(function () {
				return createCollection(db, collectionName);
			})
			.then(function (collection) {
				if (overwrite) {
					collection.drop();
				}
				return createCollection(db, collectionName);
			});
	}

	function createCollection(db, collectionName) {
		return db.createCollection(collectionName);
	}

	module.exports.getCollection = getCollection;

} ());