/* global ReactiveArrayish: true */

ReactiveArrayish = function ReactiveArrayish(arr) {
	// Reject certain keys
	var ID_KEY = '_id';
	var INDEX_KEY = '__idx__';
	var RESERVED_KEYS = [ID_KEY, INDEX_KEY];
	var SORT_BY_IDX = _.object([
		[INDEX_KEY, 1]
	]);
	var NO_ID_NO_IDX = _.object([
		[ID_KEY, 0],
		[INDEX_KEY, 0]
	]);

	// Check for reserved keys
	function checkKeys(v) {
		RESERVED_KEYS.forEach(function(key) {
			if (v.hasOwnProperty(key)) {
				throw new Meteor.Error('invalid-property', 'Invalid Key: ' + key);
			}
		});
	}

	// Check for reserved keys
	function stripFields(v) {
		RESERVED_KEYS.forEach(function(key) {
			if (v.hasOwnProperty(key)) {
				delete v[key];
			}
		});
		return v;
	}

	// returns an object like {__idx__: idx}
	function indexObject(idx) {
		return _.object([
			[INDEX_KEY, idx]
		]);
	}

	// returns an object like {__idx__: {$gte: idx_1, $lt: idx_2}}
	function indexRangeSelector(idx_1, idx_2) {
		return _.object([
			[INDEX_KEY, {
				$gte: idx_1,
				$lt: idx_2
			}]
		]);
	}

	// Backed by a Mongo.Collection client-side, which means exotic stuff
	// like functions can be stored
	var collection = new Mongo.Collection(null);
	var idArray = [];
	if ((typeof arr !== "undefined") && (arr instanceof Array)) {
		_.forEach(arr, function(o, idx) {
			checkKeys(o);
			idArray.push(collection.insert(_.extend(indexObject(idx), o)));
		});
	}
	var instance = this;


	// .observe
	instance.observe = function observe(selector, options, callbacks) {
		return collection.find(selector, options).observe(callbacks);
	};


	// .observeChanges
	instance.observeChanges = function observeChanges(selector, options, callbacks) {
		return collection.find(selector, options).observeChanges(callbacks);
	};


	// .clear: remove everything
	instance.clear = function clear() {
		collection.remove({});
		idArray = [];
	};


	// .push(elem_1, elem_2, ..., elem_n) - Adds new elements to the end of
	// an array, and returns the new length
	instance.push = function push() {
		var count = instance.getAll_NR().length;
		var insertedIds = [];
		var id;
		for (var idx = 0; idx < arguments.length; idx++) {
			checkKeys(arguments[idx]);
			var o = _.extend(indexObject(idx + count), arguments[idx]);
			id = collection.insert(o);
			idArray.push(id);
			insertedIds.push(id);
		}

		/*
		if (insertedIds.length == 0) {
			return;
		} else if (insertedIds.length == 0) {
			return insertedIds[0];
		} else {
			return insertedIds;
		}
		*/
		return insertedIds;
	};


	// .pop() - Removes the last element of an array, and returns that element
	instance.pop = function pop() {
		var _id = idArray.pop();
		if (!!_id) {
			var item = collection.findOne(_id, {
				reactive: false
			});
			delete item[ID_KEY];
			delete item[INDEX_KEY];
			collection.remove(_id);
			return item;
		}
		return;
	};


	// unshift(elem_1, elem_2, ..., elem_n) - Adds new elements to the
	// beginning of an array and returns the new length.
	instance.unshift = function unshift() {
		var insertedIds = [];
		var id;

		collection.update({}, {
			$inc: {
				__idx__: arguments.length
			}
		}, {
			multi: true
		});
		var oldIdArray = idArray;
		idArray = [];
		for (var idx = 0; idx < arguments.length; idx++) {
			checkKeys(arguments[idx]);
			var o = _.extend(indexObject(idx), arguments[idx]);
			id = collection.insert(o);
			idArray.push(id);
			insertedIds.push(id);
		}
		oldIdArray.forEach(function(id) {
			idArray.push(id);
		});

		/*
		if (insertedIds.length == 0) {
			return;
		} else if (insertedIds.length == 0) {
			return insertedIds[0];
		} else {
			return insertedIds;
		}
		*/
		return insertedIds;
	};


	// .shift() - Removes the first element from an array and returns that
	// element. This method changes the length of the array.
	instance.shift = function shift() {
		var _id = idArray.shift();
		collection.update({}, {
			$inc: {
				__idx__: -1
			}
		}, {
			multi: true
		});
		if (!!_id) {
			var item = collection.findOne(_id, {
				reactive: false
			});
			delete item[ID_KEY];
			delete item[INDEX_KEY];
			collection.remove(_id);
			return item;
		}
		return;
	};


	// reverse() - Reverses an array in place.
	instance.reverse = function reverse() {
		idArray.reverse();
		_.forEach(idArray, function(_id, idx) {
			collection.update(_id, {
				$set: indexObject(idx)
			});
		});
	};


	// splice(index, howMany[, elem_1, elem_2, ..., elem_n]) - Changes the
	// content of an array, adding new elements while removing old elements.
	function splice(index, howMany) {
		if (typeof howMany === "undefined") {
			howMany = idArray.length - index;
		}

		var elements = Array.prototype.splice.call(arguments, 2);

		var resultSet = _.range(howMany).map(function(k) {
			var item = collection.findOne(indexObject(index + k));
			collection.remove(item[ID_KEY]);
			delete item[ID_KEY];
			delete item[INDEX_KEY];
			return item;
		});

		var shift = elements.length - resultSet.length;
		collection.update(indexObject({
			$gt: index
		}), {
			$inc: shift
		});

		var args = _.map(elements, function(item, idx) {
			checkKeys(item);
			var o = _.extend(indexObject(index + idx), item);
			return collection.insert(o);
		});
		args.unshift(index, howMany);
		Array.prototype.splice.apply(idArray, args);

		return resultSet;
	}
	instance.splice = splice;

	// Get all: select, sort, map
	function get(selector, sortDefinition, mapper, reducer, initialValue) {
		if (typeof selector === "undefined") {
			selector = {};
		}
		if (typeof sortDefinition === "undefined") {
			sortDefinition = _.extend({}, SORT_BY_IDX);
		} else {
			if (_.isEqual(sortDefinition, {})) {
				sortDefinition = _.extend({}, SORT_BY_IDX);
			}
			if (!sortDefinition.hasOwnProperty(INDEX_KEY)) {
				sortDefinition[INDEX_KEY] = 1;
			}
		}
		if (typeof mapper !== "function") {
			mapper = function(x) {
				return x;
			};
		}

		var queryResult, mapped, finalResult;

		queryResult = collection.find(selector, {
			sort: sortDefinition
		});

		mapped = queryResult.fetch().map(stripFields).map(mapper);

		if (typeof reducer !== "function") {
			// Simple Map
			finalResult = mapped;
		} else {
			if (typeof initialValue === "undefined") {
				// no initial value
				finalResult = mapped.reduce(reducer);
			} else {
				finalResult = mapped.reduce(reducer, initialValue);
			}
		}

		return finalResult;
	}
	instance.get = get;
	instance.getAll = get;
	instance.getAll_NR = function(selector, sortDefinition, mapper, reducer, initialValue) {
		var result;
		Tracker.autorun(function(c) {
			result = get(selector, sortDefinition, mapper, reducer, initialValue);
			c.stop();
		});
		return result;
	};
	instance.get_NR = instance.getAll_NR;

	// For debugging
	instance.__getAll_Raw_NR = function __getAll_Raw_NR() {
		var arr;
		Tracker.autorun(function(c) {
			arr = collection.find({}, {
				sort: SORT_BY_IDX
			}).fetch();
			c.stop();
		});
		return arr;
	};
	instance.__getIdArray_NR = function __getIdArray_NR() {
		return idArray.map(function(v) {
			return v;
		});
	};

	// Get by idx
	function getByIdx(idx) {
		return stripFields(collection.findOne(indexObject(idx), {}, {
			reactive: true
		}));
	}
	instance.getByIdx = getByIdx;
	instance.getByIdx_NR = function getIdx_NR(idx) {
		return collection.findOne(indexObject(idx), {
			fields: NO_ID_NO_IDX
		}, {
			reactive: false
		});
	};
	instance.getById = function getById(_id) {
		return stripFields(collection.findOne(_id, {}, {
			reactive: true
		}));
	};
	instance.getById_NR = function getIdx_NR(_id) {
		return collection.findOne(_id, {
			fields: NO_ID_NO_IDX
		}, {
			reactive: false
		});
	};

	// Get idx_1 to idx_2
	function getByIdxRange(idx_1, idx_2) {
		return collection.find(indexRangeSelector(idx_1, idx_2), {
			sort: SORT_BY_IDX
		}).fetch().map(stripFields);
	}
	instance.getByIdxRange = getByIdxRange;
	instance.getByIdxRange_NR = function(idx_1, idx_2) {
		var arr;
		Tracker.autorun(function(c) {
			arr = getByIdxRange(idx_1, idx_2);
			c.stop();
		});
		return arr;
	};

	// length
	instance.length = function length() {
		return collection.find().count();
	};
	// length
	instance.length_NR = function length() {
		var n;
		Tracker.autorun(function(c) {
			n = collection.find().count();
			c.stop();
		});
		return n;
	};

	// update
	instance.update = function update(idx, setInfo) {
		checkKeys(setInfo);
		return collection.update(indexObject(idx), {
			$set: setInfo
		});
	};
	instance.updateById = function updateById(_id, setInfo) {
		checkKeys(setInfo);
		return collection.update(_id, {
			$set: setInfo
		});
	};
	instance.updateBySelector = function updateBySelector(selector, setInfo) {
		checkKeys(setInfo);
		return collection.update(selector, {
			$set: setInfo
		}, {
			multi: true
		});
	};

	// replace
	instance.replace = function replace(idx, newObj) {
		checkKeys(newObj);
		return collection.update(indexObject(idx), _.extend(indexObject(idx), newObj));
	};
	instance.replaceById = function replaceById(_id, newObj) {
		checkKeys(newObj);
		var idx = idArray.indexOf(_id);
		if (idx > -1) {
			return collection.update(_id, _.extend(indexObject(idx), newObj));
		}
	};

	// remove
	instance.remove = function remove(idx) {
		var items = splice(idx, 1);
		return (items.length === 1) ? items[0] : undefined;
	};

	// remove by id
	instance.removeById = function removeById(id) {
		var item = collection.findOne(id, {reactive: false});
		collection.remove(id);
		var idx = idArray.indexOf(id);
		if (idx > -1) {
			idArray.splice(id, 1);
		}
		_.forEach(idArray, function(_id, idx) {
			collection.update(_id, {
				$set: indexObject(idx)
			});
		});
		return item;
	};

	// removeBySelector
	instance.removeBySelector = function removeBySelector(selector) {
		if (typeof selector === "undefined") {
			selector = {};
		}
		if (_.isEqual(selector, {})) {
			throw new Meteor.call('invalid-selector');
		}

		var queryResult;
		Tracker.autorun(function(c) {
			queryResult = collection.find(selector, {
				sort: _.object([
					[INDEX_KEY, -1]
				])
			}).fetch();
			c.stop();
		});

		queryResult.forEach(function(item) {
			collection.remove(item._id);
			idArray.splice(item[INDEX_KEY], 1);
		});

		_.forEach(idArray, function(_id, idx) {
			collection.update(_id, {
				$set: indexObject(idx)
			});
		});

		return queryResult;
	};


	// findAllIndicesOf
	function findAllIndicesOf(searchElement, step, startingIndex, numberRequired) {
		var arr = instance.get();
		var indices = [];

		if ((typeof step === "undefined") || (step === 0)) {
			step = 1;
		}
		if (typeof startingIndex === "undefined") {
			if (step > 0) {
				startingIndex = 0;
			} else {
				startingIndex = arr.length - 1;
			}
		}
		if (typeof numberRequired === "undefined") {
			numberRequired = arr.length;
		}

		var count = 0;
		var o;
		for (var idx = startingIndex;
			((idx >= 0) && (idx < arr.length)); idx += step) {
			o = arr[idx];
			if (_.isEqual(o, searchElement)) {
				indices.push(idx);
				count += 1;

				if (count >= numberRequired) {
					break;
				}
			}
		}
		indices.sort();

		return indices;
	}


	// indexOf(searchElement[, fromIndex = 0]) - Returns the first index at
	// which a given element can be found in the array, or -1 if it is not
	// present.
	instance.indexOf = function indexOf(searchElement, fromIndex) {
		var indices = findAllIndicesOf(searchElement, 1, fromIndex, 1);
		if (indices.length > 0) {
			return indices[0];
		} else {
			return;
		}
	};
	instance.indexOf_NR = function indexOf_NR(searchElement, fromIndex) {
		var n;
		Tracker.autorun(function(c) {
			n = instance.indexOf(searchElement, fromIndex);
			c.stop();
		});
		return n;
	};

	// lastIndexOf(searchElement[, fromIndex = arr.length - 1]) - Returns the
	// last index at which a given element can be found in the array, or -1
	// if it is not present. The array is searched backwards, starting at
	// fromIndex.
	instance.lastIndexOf = function lastIndexOf(searchElement, fromIndex) {
		var indices = findAllIndicesOf(searchElement, -1, fromIndex, 1);
		if (indices.length > 0) {
			return indices[0];
		} else {
			return;
		}
	};
	instance.lastIndexOf_NR = function lastIndexOf_NR(searchElement, fromIndex) {
		var n;
		Tracker.autorun(function(c) {
			n = instance.lastIndexOf(searchElement, fromIndex);
			c.stop();
		});
		return n;
	};

	// allIndicesOf(searchElement)
	instance.allIndicesOf = function allIndicesOf(searchElement) {
		return findAllIndicesOf(searchElement);
	};
	instance.allIndicesOf_NR = function allIndicesOf_NR(searchElement) {
		var indices;
		Tracker.autorun(function(c) {
			indices = instance.allIndicesOf(searchElement);
			c.stop();
		});
		return indices;
	};

	//
	// Tested
	////////////////////////////////////////////////////////////////////////
	// Not Tested
	//
};