// Main viewmodel class
define(['knockout-3.3.0', 'model'], function (ko, model) {
    "use strict";

    return function () { // ViewModel constructor
        this.synth = ko.observable(
            "fg.register(\"asynth\", ts.ModPoly(ts.ModAsynth));\n" +
            "fg.register(\"seq\", ts.ModPolySeq());\n\n" +
    
            "fg.connect(\"seq\", \"asynth\");\n" +
            "fg.connect(\"asynth\", \"destination\");\n\n" +
            
            "fg.module.asynth.parameter.mono.env.attack = 0.0;\n" +
            "fg.module.asynth.parameter.mono.env.decay = 0.4;\n" +
            "fg.module.asynth.parameter.mono.env.sustain = 0.0;\n" +
            "fg.module.asynth.parameter.mono.env.release = 0.0;\n\n" +
            "fg.module.asynth.parameter.mono.bqf.freqScale = 1.6;\n" +
            "fg.module.asynth.parameter.mono.bqf.Q = 0.0001;\n\n" +
    
            "var ca = vm.chord().split(/[\\s|]/).filter(function (s) { return s != \"\"; });\n" +
            "var va = vm.breakValue().split(/[\\s|]/).filter(function (s) { return s != \"\"; });\n" +
            "fg.module.seq.parameter.sequence = ts.voiceToSequence(ca, va, 120);\n\n"
            
//            "fg.module.seq.parameter.sequence = ts.chordToSequenceBroken(ca, ts.simpleVoicing, vm.breakMethodFn[vm.breakMethod()]);\n\n"
        );
        
        //this.chord = ko.observable('C G Am Em F C F G');
        this.chord = ko.observable(
            'A B G#m C#m A B C#7sus4 C#7\n' +
            'A B E E A B E E\n' +
            'A B G# C#m F# F# B Cm6(-5)\n' +
            'C#m C(+5) E/B A#m7(-5) A A A/B B\n'
            );
            
        this.breakValue = ko.observable();
        this.breakKind = ko.observable([
            "[RS] z F z T z",
            "[RS] z T z F z",
            "R z z [RTFS] z z",
        ]);

        this.volume = ko.observable();

        this.playChord = function () {
            model.build(this.synth(), this);
            this.volume.subscribe(model.parameter.asynth.gain.gain);
        
            model.play();
        };
        this.recycle = function () { model.recycle(); };
        this.stop = function() { model.stop(); };

        this.volume(0.5);
    };
});
