// Main viewmodel class
define(['knockout-3.3.0', 'model'], function (ko, Model) {
    "use strict";
    var model = new Model();

    return function () { // ViewModel constructor
        this.chord = ko.observable('C G Am Em F C F G');
        this.volume = ko.observable(0.5);
        this.volume.subscribe(model.setGain);   // maybe not good
        this.freqscale = ko.observable(1.6);
        this.freqscale.subscribe(model.setBQFFreqScale);
        this.Q = ko.observable(0.0001);
        this.Q.subscribe(model.setBQFQ);
        
        this.test = ko.observable({hoge: "fuga", hige: "hare"});
        //this.test = ko.observable([{hoge: "fuga", hige: "hare"}, {hoge: "fuga2", hige: "hare2"}]);
        
        this.playChord = function () { model.playChord(this.chord()); };
        this.stop = function() { model.stop(0); };

        model.build(this.volume(), this.freqscale(), this.Q());
    };
});
