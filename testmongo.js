var MongoDb = require("mongodb"),
	Promise = require("bluebird");

Promise.promisifyAll(MongoDb);

var Db = MongoDb.Db,
	Server = MongoDb.Server,
	_ = require("lodash");

var children = [
		{ _id: "Child1", children: [], isParent: false },
		{ _id: "Child2", children: [], isParent: false }
	];

var collection;

var db = new Db('test', new Server('localhost', 27017));
db.open()
	.then(function (db) {
		return db.createCollection("TestCollection" + new Date().getTime());
	})
	.then(function (result) {
		collection = result;
		return collection.insert({ _id: "Parent", children: [], isParent: false });
	})
	.then(function () {
		return collection.insert({ _id: "Parent", children: [], isParent: false });
	})
	.catch(function (error) {

	})
	.then(function (result) {
		return collection.insertMany(children);
	})
	.then(function (result) {
		return collection.update(
			{ _id: "Parent" },
			{
				"$push": {
					"children": {
						"$each": _.map(children, function (child) { return child._id; })
					}
				},
				"$set": {
					"isParent": true
				}
				
			});
	})
	.then(function (result) {
		return collection.findOne({ _id: "Parent"});
	})
	.then(function (result) {
		return collection.findOne({ children: "Child1" });
	})
	.then(function (result) {
		return result;
	})
	.then(function (result) {
		console.log("Insert completed");
	});


