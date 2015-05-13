// Main viewmodel class
define(['knockout-3.3.0', 'model'], function(ko, Model) {
    return function() { // ViewModel constructor
        var model = new Model();
        this.chord  = ko.observable('C G Am Em F C F G');
		this.volume = ko.observable(0.2);
        this.volume.subscribe(model.setGain);   // maybe not good
        
        this.play = function() { model.play(this.volume()); };
        this.playChord = function() { model.playChord(this.chord(), this.volume());};
        this.stop = model.stop;
    };
});