// Main viewmodel class
define(['knockout-3.3.0', 'model'], function (ko, Model) {
    "use strict";
    var model = new Model();

    return function () { // ViewModel constructor
        this.chord = ko.observable('C G Am Em F C F G');
        this.volume = ko.observable(0.5);
        this.volume.subscribe(model.setGain);   // maybe not good
        this.frequency = ko.observable(880);
        this.frequency.subscribe(model.setBQFFreq);
        this.Q = ko.observable(1);
        this.Q.subscribe(model.setBQFQ);
        
        this.test = ko.observable({hoge: "fuga", hige: "hare"});
        //this.test = ko.observable([{hoge: "fuga", hige: "hare"}, {hoge: "fuga2", hige: "hare2"}]);
        
        this.playChord = function () { model.playChord(this.chord()); };
        this.stop = model.stop;

        model.build(this.volume(), this.frequency(), this.Q());
    };
});
