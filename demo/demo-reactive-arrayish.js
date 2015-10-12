/* global GoogleMaps: true */
/* global google: true */
/* global ReactiveArrayish: true */

if (Meteor.isClient) {

	Meteor.startup(function() {
		GoogleMaps.load();
	});

	Template.DemoReactiveArrayish.helpers({
		locations: function() {
			return Template.instance().locations.get({}, {
				label: 1
			});
		},
		haveLocations: function() {
			return Template.DemoReactiveArrayish.__helpers.get("locations")().length > 0;
		},
		mapOptions: function() {
			// Make sure the maps API has loaded
			var instance = Template.instance();
			if (GoogleMaps.loaded()) {
				// Map initialization options
				if (!instance.geocoder) {
					instance.geocoder = new google.maps.Geocoder();
				}
				return {
					center: new google.maps.LatLng(1.354, 103.823),
					zoom: 12
				};
			}
		}
	});

	Template.DemoReactiveArrayish.onCreated(function() {
		var instance = Template.instance();
		instance.locations = new ReactiveArrayish();
		instance.markers = {};
		instance.geocoder = null;
		instance.idx = 0;

		GoogleMaps.ready('locationMap', function(map) {
			var ALL_LETTERS = _.map("ABCDEFGHIJKLMNOPQRSTUVWXYZ", x => x);

			google.maps.event.addListener(map.instance, 'click', function(event) {
				var labels = _.map(instance.locations.getAll_NR(), loc => loc.label);
				var available_labels = ALL_LETTERS.filter(x => labels.indexOf(x) === -1);

				if (available_labels.length > 0) {
					var label = available_labels[0];

					var marker = new google.maps.Marker({
						draggable: true,
						position: new google.maps.LatLng(event.latLng.lat(), event.latLng.lng()),
						map: map.instance,
						label: label
					});
					var thisIndex = instance.idx++;

					var locationObject = {
						label: label,
						address: "~ geocoding ~",
						lat: event.latLng.lat(),
						lng: event.latLng.lng(),
						notes: "",
						idx: thisIndex,
					};
					var id = instance.locations.push(locationObject)[0];
					instance.markers[thisIndex] = marker;

					var doGeocode = function(latlng) {
						instance.geocoder.geocode({
							location: latlng
						}, function(results) {
							if ((!!results) && (results.length > 0)) {
								instance.locations.updateById(id, {
									address: results[0].formatted_address
								});
								console.info("Geolocated Address: " + results[0].formatted_address);
							} else {
								instance.locations.updateById(id, {
									address: "Unable to geocode."
								});
								console.error("Error: Unable to geocode.");
							}
						});
					};

					doGeocode({
						lat: event.latLng.lat(),
						lng: event.latLng.lng()
					});

					google.maps.event.addListener(marker, 'dragend', function(event) {
						instance.locations.updateById(id, {
							lat: event.latLng.lat(),
							lng: event.latLng.lng()
						});
						doGeocode({
							lat: event.latLng.lat(),
							lng: event.latLng.lng()
						});
					});
				} else {
					console.error('Maximum number of locations (' + ALL_LETTERS.length + ') reached.');
				}
			});
		});
	});


	Template.LocationRow.events({
		'click button': function(event, template) {
			var locations = template.parentTemplate().locations;
			var markers = template.parentTemplate().markers;

			locations.removeBySelector({
				idx: template.data.idx
			});
			markers[template.data.idx].setMap(null);
			delete markers[template.data.idx];
		},
		'focusout input.address-input': function(event, template) {
			var address = event.target.value;
			var oldAddress = template.data.address;
			var locations = template.parentTemplate().locations;
			var marker = template.parentTemplate().markers[template.data.idx];

			locations.updateBySelector({
				idx: template.data.idx
			}, {
				address: address
			});

			template.parentTemplate().geocoder.geocode({
				address: address
			}, function(results) {
				if (results.length > 0) {
					var loc = results[0].geometry.location;
					locations.updateBySelector({
						idx: template.data.idx
					}, {
						lat: loc.lat(),
						lng: loc.lng()
					});
					marker.setPosition(new google.maps.LatLng(loc.lat(), loc.lng()));
					console.info("Geolocated Address: " + results[0].formatted_address);
				} else {
					locations.updateBySelector({
						idx: template.data.idx
					}, {
						address: oldAddress
					});
					console.error("Unable to obtain location. Reverting to previous closest address.");
				}
			});
		},
		'change input.notes-input': function(event, template) {
			var locations = template.parentTemplate().locations;
			locations.updateBySelector({
				idx: template.data.idx
			}, {
				notes: event.target.value
			});
		},
		'click a': function(event, template) {
			var marker = template.parentTemplate().markers[template.data.idx];
			var map = marker.getMap();
			var latlng = marker.getPosition();
			map.setCenter(latlng);
		}
	});

}