// Main viewmodel class
define(['knockout-3.3.0', 'model'], function (ko, Model) {
    "use strict";

    return function () { // ViewModel constructor
        var model = new Model();
        this.chord = ko.observable('C G Am Em F C F G');
        this.volume = ko.observable(0.5);
        this.volume.subscribe(model.setGain);   // maybe not good
        this.frequency = ko.observable(880);
        this.frequency.subscribe(model.setBQFFreq);
        this.Q = ko.observable(1);
        this.Q.subscribe(model.setBQFQ);
        
        this.play = function () { model.play(this.volume()); };
        this.playChord = function () { model.playChord(this.chord(), this.volume(), this.frequency(), this.Q()); };
        this.stop = model.stop;
    };
});