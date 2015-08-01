require.config({
	baseUrl: "."
});

require(['lib/knockout-3.3.0', 'sample/chord/viewmodel', 'js/domReady!'], function (ko, ViewModel) {
    ko.applyBindings(new ViewModel());
});