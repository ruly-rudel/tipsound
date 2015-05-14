
require(['knockout-3.3.0', 'viewmodel', 'domReady!'], function (ko, ViewModel) {
    ko.applyBindings(new ViewModel());
});