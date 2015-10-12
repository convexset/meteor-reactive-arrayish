# ReactiveArrayish

This package was created to deal with (probably Blaze-related) reactivity problems with existing "Reactive Array" packages that conventional `_id` solutions failed to address. (... and that the original committer of this package might just have not been smart enough to properly diagnose.)

In any event, this provides a "truly" reactive client-side object store that:
 - provides useful (and reactive) functionality such as filter, sort, map and reduce
 - provides standard (and reactive) array functionality such as `push`/`pop`/`shift`/`unshift`/`splice`
 - indexOf-type operators match using underscore's `_.isEqual`
 - flexible CRUD methods

The reactivity works nicely (with Blaze) because the object is backed by a local `Mongo.Collection`.

A nice-ish example is provided that requires `dburles:google-maps`. (It can be prettified using `semantic:ui`.)

## Install

This is available as [`convexset:reactive-arrayish`](https://atmospherejs.com/convexset/reactive-arrayish) on [Atmosphere](https://atmospherejs.com/). (Install with `meteor add convexset:reactive-arrayish`.)


## API

### Getters

`get(selector, sortDefinition, mapper, reducer, initialValue)`
 - `selector`: a selector such as `{x: {$gt: 5}}`
 - `sortDefinition`: a description of how to sort such as `{x: 1}` (will sort by index in ascending order not specified)
 - `mapper`: a function that maps each item of the result set (default: identity a.k.a. `function(x) {return x;}`)
 - `reducer`: a reducer that aggregates, [see this](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/Reduce)
 - `initialValue`: the initial value for the reduction, [see this](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/Reduce)

`getAll`: alias for `get`

`getByIdx(idx)`: grabs an item by "array index"

`getByIdxRange(idx_1, idx_2)`: grabs an items by "array index" (`idx_1`, `idx_1 + 1`, ..., `idx_2 - 1`)

`getById`: grabs items by underlying `Mongo.Collection` `_id`.

*Non-reactive Counterparts:*
 - `get_NR`
 - `getAll_NR`
 - `getByIdx_NR`
 - `getById_NR`
 - `getByIdxRange_NR`

*Getting for Debugging*
 - `__getAll_Raw_NR()`: returns the contents of the `Mongo.Collection` holding the data.
 - `__getIdArray_NR()`: returns the underlying `Array` holding the relevant `_id`'s.

### Population Control

As a preliminary note, beware of "recursive-ish objects" which blow up call-stacks. 

`clear()`: clears the `ReactiveArrayish` object

`length()`: reports the number of objects in the `ReactiveArrayish` reactively

`length_NR()`: reports the number of objects in the `ReactiveArrayish` non-reactively

`push(elem_1, elem_2, ..., elem_n)`: Adds new elements to the end of an array, and returns the new length

`pop()`: Removes the last element of an array, and returns that element

`unshift(elem_1, elem_2, ..., elem_n)`: Adds new elements to the beginning of an array and returns the new length.

`shift()`: Removes the first element from an array and returns that element. This method changes the length of the array.

`splice(index, howMany[, elem_1, elem_2, ..., elem_n])`: Changes the content of an array, adding new elements while removing old elements.

## Updating/Replacing/Removing

`update(idx, setInfo)`: partially updates the object at "array index" using `setInfo` (e.g.: `{isMostRecent: true}`)

`updateById(_id, setInfo)`: partially updates the object at the `_id` of the underlying `Mongo.Collection` using `setInfo` (e.g.: `{isMostRecent: true}`)

`updateById(selector, setInfo)`: partially updates objects matching [`selector`](http://docs.meteor.com/#/full/selectors) using `setInfo` (e.g.: `{isMostRecent: true}`)

`replace(idx, newObj)`: replaces the object at "array index" with `newObject`

`replaceById(_id, newObj)`: replaces the object at the `_id` of the underlying `Mongo.Collection` with `newObject`

`remove(idx)`: remove the object at "array index"

`removeById(id)`: remove the object at the `_id` of the underlying `Mongo.Collection`

`removeBySelector(selector)`: removes all objects matching [`selector`](http://docs.meteor.com/#/full/selectors)

### indexOf-type Methods

`indexOf(searchElement, fromIndex)`: gets the first index (at or after `fromIndex`) matching `searchElement`

`lastIndexOf(searchElement, fromIndex)`: gets the last index (at or before `fromIndex`) matching `searchElement`

`allIndicesOf(searchElement)`: get all indices matching `searchElement`

*Non-reactive Counterparts:*
 - `indexOf_NR`
 - `lastIndexOf_NR`
 - `allIndicesOf_NR`

### Misc Methods

`reverse()`: Reverses an array in place.