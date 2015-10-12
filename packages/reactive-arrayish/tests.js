/* global Tinytest: true */
/* global ReactiveArrayish: true */

function thingByIndex(x) {
	return {
		a: x
	};
}

function idArrayToObjs(ra) {
	return _.forEach(ra.__getIdArray_NR(), function(v, k) {
		return {
			_id: v,
			__idx__: k
		};
	});
}

function filterToIdIdx(ra) {
	return _.forEach(ra.__getAll_Raw_NR(), function(v) {
		return {
			_id: v._id,
			__idx__: v.__idx__
		};
	});
}

function logAll(ra) {
	console.log('---');
	ra.__getAll_Raw_NR().forEach(x => console.log(x));
	console.log('---');
}
// Dumb shit to placate JSHint
var _logAll = logAll;
var __logAll = _logAll;
_logAll = __logAll;


Tinytest.add('[ReactiveArrayish] Constructor + Clear', function(test) {
	var ra1 = new ReactiveArrayish();
	test.isTrue(_.isEqual([], ra1.getAll_NR()), 'Equality check. (Nothing in nothing out.)');

	var subObj = {
		a: 1
	};
	var objs = [{
		a: 1,
		b: subObj,
		c: [1, 2, 4],
		d: function() {
			return 5;
		}
	}, {
		b: 3,
		p: 3
	}];
	var ra2 = new ReactiveArrayish(objs);
	var fetchedObjs = ra2.getAll_NR();
	test.isTrue(_.isEqual(objs, fetchedObjs), 'Equality check. (Objects in objects out.)');
	subObj['b'] = 2;
	test.isTrue(!_.isEqual(fetchedObjs[0].b, subObj), 'Deep copy done.');
	test.isTrue(_.isEqual(fetchedObjs[0].d(), 5), 'Function comes out.');

	ra2.clear();
	test.isTrue(_.isEqual(ra2.getAll_NR(), []), 'Clear');
});


Tinytest.add('[ReactiveArrayish] Getting Stuff By Index', function(test) {
	var allObjects = _.range(10).map(thingByIndex);
	var idx_1 = 3;
	var idx_2 = 7;
	var someObjects = _.range(idx_1, idx_2).map(thingByIndex);

	var ra = new ReactiveArrayish(allObjects);
	test.isTrue(_.isEqual(thingByIndex(idx_1), ra.getByIdx_NR(idx_1)), 'Get check. (Single Item)');
	test.isTrue(_.isEqual(someObjects, ra.getByIdxRange_NR(idx_1, idx_2)), 'Get check. (Range)');
});


Tinytest.add('[ReactiveArrayish] Filter Map Reduce', function(test) {
	var n = 5;
	var allObjects = _.range(-5, n).map(function(idx) {
		return {
			num: idx,
			include: (idx >= 0)
		};
	});
	var mapperAddOneToNum = function(v) {
		return v.num + 1;
	};
	var filter = function(x) {
		return x.include;
	};
	var allObjectsMapped = allObjects.filter(filter).map(mapperAddOneToNum);
	var selector = {
		include: true
	};
	var reducerSum = function(previousValue, currentValue) { // function(previousValue, currentValue, index, array) {
		return previousValue + currentValue;
	};

	var ra = new ReactiveArrayish(allObjects);
	test.isTrue(_.isEqual(ra.get(selector, {}), allObjects.filter(filter)), 'filter (' + n + ')');
	test.isTrue(_.isEqual(ra.get(selector, {}, mapperAddOneToNum), allObjectsMapped), 'filter and map (' + n + ')');
	test.isTrue(_.isEqual(ra.get(selector, {}, mapperAddOneToNum, reducerSum), n * (n + 1) / 2), 'filter-map-reduce (' + n + ')');
	test.isTrue(_.isEqual(ra.get(selector, {}, mapperAddOneToNum, reducerSum, 100), 100 + n * (n + 1) / 2), 'filter-map-reduce with initial value(' + n + ')');
});


Tinytest.add('[ReactiveArrayish] Push, Pop, Shift, Unshift, Reverse, Length', function(test) {
	var arr = _.range(10).map(thingByIndex);
	var ra = new ReactiveArrayish(arr);
	var thing1 = thingByIndex(-100);
	var thing2 = thingByIndex(100);

	arr.push(thingByIndex(500), thing1);
	ra.push(thingByIndex(500), thing1);
	test.isTrue(_.isEqual(arr, ra.getAll_NR()), 'push');
	test.isTrue(_.isEqual(idArrayToObjs(ra), filterToIdIdx(ra)), 'push (_id, idx match)');
	test.isTrue(_.isEqual(arr.length, ra.getAll_NR().length), 'push (length)');

	arr.unshift(thing2, thingByIndex(300));
	ra.unshift(thing2, thingByIndex(300));
	test.isTrue(_.isEqual(arr, ra.getAll_NR()), 'unshift');
	test.isTrue(_.isEqual(idArrayToObjs(ra), filterToIdIdx(ra)), 'unshift (_id, idx match)');
	test.isTrue(_.isEqual(arr.length, ra.getAll_NR().length), 'unshift (length)');

	var res;

	res = ra.pop();
	arr.pop();
	test.isTrue(_.isEqual(res, thing1), 'pop (result)');
	test.isTrue(_.isEqual(arr, ra.getAll_NR()), 'pop (collection)');
	test.isTrue(_.isEqual(idArrayToObjs(ra), filterToIdIdx(ra)), 'pop (_id, idx match)');
	test.isTrue(_.isEqual(arr.length, ra.getAll_NR().length), 'pop (length)');

	res = ra.shift();
	arr.shift();
	test.isTrue(_.isEqual(res, thing2), 'shift (result)');
	test.isTrue(_.isEqual(arr, ra.getAll_NR()), 'shift (collection)');
	test.isTrue(_.isEqual(idArrayToObjs(ra), filterToIdIdx(ra)), 'shift (_id, idx match)');
	test.isTrue(_.isEqual(arr.length, ra.getAll_NR().length), 'shift (length)');

	res = ra.splice(3, 3, {
		b: 5
	}, {
		b: 6
	});
	arr.splice(3, 3, {
		b: 5
	}, {
		b: 6
	});
	test.isTrue(_.isEqual(res, [thingByIndex(2), thingByIndex(3), thingByIndex(4)]), 'splice (result)');
	test.isTrue(_.isEqual(arr, ra.getAll_NR()), 'splice (collection)');
	test.isTrue(_.isEqual(idArrayToObjs(ra), filterToIdIdx(ra)), 'splice (_id, idx match)');
	test.isTrue(_.isEqual(arr.length, ra.getAll_NR().length), 'splice (length)');

	arr.reverse();
	ra.reverse();
	test.isTrue(_.isEqual(arr, ra.getAll_NR()), 'reverse (collection)');
	test.isTrue(_.isEqual(idArrayToObjs(ra), filterToIdIdx(ra)), 'reverse (_id, idx match)');
	test.isTrue(_.isEqual(arr.length, ra.getAll_NR().length), 'reverse (length)');
});


Tinytest.add('[ReactiveArrayish] update, replace', function(test) {
	var arr = _.range(10).map(thingByIndex);
	var ra = new ReactiveArrayish(arr);

	arr[5]['b'] = 5;
	ra.update(5, {
		'b': 5
	});
	test.isTrue(_.isEqual(arr[5], ra.getByIdx_NR(5)), 'update');

	var item = {
		xxx: 1
	};
	var id = ra.push(item)[0];
	arr.push(item);
	item['yyy'] = 1;
	ra.updateById(id, {
		yyy: 1
	});
	test.isTrue(_.isEqual(arr[ra.length() - 1], ra.getByIdx_NR(ra.length() - 1)), 'update by id');

	arr[4] = {
		q: 1
	};
	ra.replace(4, arr[4]);
	test.isTrue(_.isEqual(arr[4], ra.getByIdx_NR(4)), 'replace');

	arr[arr.length - 1] = {
		zzz: 1
	};
	ra.replaceById(id, arr[arr.length - 1]);
	test.isTrue(_.isEqual(arr[ra.length() - 1], ra.getByIdx_NR(ra.length() - 1)), 'replace by id');
});

Tinytest.add('[ReactiveArrayish] indexOf and friends', function(test) {
	var N = 3;
	var base = _.range(N);
	var ra = new ReactiveArrayish();
	base.forEach(function(n) {
		ra.push(thingByIndex(n));
	});
	base.forEach(function(n) {
		ra.push(thingByIndex(n));
	});

	base.forEach(function(n) {
		test.isTrue(_.isEqual(ra.indexOf(thingByIndex(n)), n), 'indexOf -> ' + n);
		test.isTrue(_.isEqual(ra.lastIndexOf(thingByIndex(n)), N + n), 'lastIndexOf -> ' + n);
	});

	ra.push(thingByIndex(0));
	test.isTrue(_.isEqual(ra.allIndicesOf(thingByIndex(0)), [0, N, N * 2]), 'allIndicesOf');
});


Tinytest.add('[ReactiveArrayish] removeBySelector', function(test) {
	var N = 3;
	var base = _.range(N);
	var ra = new ReactiveArrayish();
	base.forEach(function(n) {
		ra.push(thingByIndex(n));
	});
	ra.push(thingByIndex(N));
	base.forEach(function(n) {
		ra.push(thingByIndex(n));
	});
	ra.push(thingByIndex(N));

	ra.removeBySelector(thingByIndex(0));

	base.forEach(function(n) {
		test.isTrue(_.isEqual(ra.indexOf(thingByIndex(n + 1)), n), 'remove test (via indexOf) -> ' + n);
		test.isTrue(_.isEqual(ra.lastIndexOf(thingByIndex(n + 1)), N + n), 'remove test (via indexOf) -> ' + n);
	});
});

Tinytest.add('[ReactiveArrayish] update by selector, remove by id', function(test) {
	var ra = new ReactiveArrayish();

	var arr = [];
	ra.push(thingByIndex(0));
	ra.push(thingByIndex(1));
	var id = ra.push(thingByIndex(2))[0];
	ra.push(thingByIndex(0));
	ra.push(thingByIndex(2));
	ra.push(thingByIndex(1));

	arr.push(thingByIndex(10));
	arr.push(thingByIndex(1));
	arr.push(thingByIndex(2));
	arr.push(thingByIndex(10));
	arr.push(thingByIndex(2));
	arr.push(thingByIndex(1));

	ra.updateBySelector(thingByIndex(0), thingByIndex(10));

	test.isTrue(_.isEqual(arr, ra.getAll_NR()), 'update by selector');

	ra.removeById(id);
	arr.splice(2, 1);
	test.isTrue(_.isEqual(arr, ra.getAll_NR()), 'update by selector');
});