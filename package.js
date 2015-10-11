Package.describe({
	name: 'convexset:reactive-arrayish',
	version: '0.1.0',
	summary: 'Provides an array-like reactive collection that plays well with Blaze (i.e.: #each), can be manipulated like an array, and provides useful reactive functionality such as filter-map-reduce.',
	git: 'https://github.com/convexset/reactive-arrayish',
	documentation: 'README.md'
});

Package.onUse(function(api) {
	api.versionsFrom('1.2.0.2');
	api.use(['ecmascript', 'mongo', 'tracker', 'underscore'], 'client');
	api.addFiles('reactive-arrayish.js');
	api.export('ReactiveArrayish');
});

Package.onTest(function(api) {
	api.use(['ecmascript', 'mongo', 'tracker', 'underscore', 'convexset:reactive-arrayish'], 'client');
	api.use('tinytest');
	api.addFiles(['tests.js'], 'client');
});