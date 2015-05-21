// Main viewmodel class
define(['knockout-3.3.0', 'model'], function (ko, model) {
    "use strict";

    return function () { // ViewModel constructor
        this.chord = ko.observable('C G Am Em F C F G');
        this.volume = ko.observable();
        this.freqscale = ko.observable();
        this.Q = ko.observable();
        
        this.test = ko.observable({hoge: "fuga", hige: "hare"});
        //this.test = ko.observable([{hoge: "fuga", hige: "hare"}, {hoge: "fuga2", hige: "hare2"}]);
        
        this.playChord = function () { model.playChord(this.chord()); };
        this.recycle = function() { model.recycle(); };

        model.build();
        this.volume.subscribe(model.parameter.gain.gain);
        this.freqscale.subscribe(model.parameter.mono.bqf.freqScale);
        this.Q.subscribe(model.parameter.mono.bqf.Q);
        
        this.volume(0.5);
        this.freqscale(1.6);
        this.Q(0.0001);
    };
});
