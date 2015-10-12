Package.describe({
	name: 'convexset:reactive-arrayish',
	version: '0.1.0',
	summary: 'An array-like reactive collection that plays well with Blaze (i.e.: #each)',
	git: 'https://github.com/convexset/meteor-reactive-arrayish',
	documentation: 'README.md'
});

Package.onUse(function(api) {
	api.versionsFrom('1.2.0.2');
	api.use(['ecmascript', 'mongo', 'tracker', 'underscore'], 'client');
	api.addFiles(['reactive-arrayish.js'], 'client');
	api.export(['ReactiveArrayish'], 'client');
});

Package.onTest(function(api) {
	api.use('tinytest');
	api.use(['ecmascript', 'mongo', 'tracker', 'underscore', 'convexset:reactive-arrayish'], 'client');
	api.addFiles(['tests.js'], 'client');
});