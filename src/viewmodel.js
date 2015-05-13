// Main viewmodel class
define(['knockout-3.3.0', 'model'], function(ko, Model) {
    return function() { // ViewModel constructor
        var model = new Model();
		this.volume = ko.observable(1.0);
        this.volume.subscribe(model.setGain);   // maybe not good
        
        this.play = function() { model.play(this.volume()); };
        this.stop = model.stop;
    };
});