(function () {

	var MongoDb = require("mongodb"),
	Promise = require("bluebird");

	Promise.promisifyAll(require("mongodb"));

	var Db = MongoDb.Db,
		Server = MongoDb.Server;

	var db = new Db('test', new Server('localhost', 27017));

	module.exports.createCollection = function (collectionName) {
		return db.open().then(function (db) {
			return db.createCollection(collectionName);
		});
	};

} ());


/*
db.open()
	.then(function (db) {
		return db.createCollection("TestCollection");
	})
	.then(function (collection) {
		return collection.insert({
			name: "Test",
			value: 5
		});
	})
	.then(function () {
		console.log("Insert completed");
	});
*/