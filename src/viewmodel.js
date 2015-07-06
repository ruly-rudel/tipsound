// Main viewmodel class
define(['knockout-3.3.0', 'model'], function (ko, model) {
    "use strict";

    return function () { // ViewModel constructor
        this.breakMethodFn = {};

        this.breakMethodFn.breakDown3 = function (s) {
            if (s[3] !== null) {
                return [
                    { time: 0, inst: "noteOn", note: s[0] },
                    { time: 0, inst: "noteOn", note: s[3] },
                    { time: 0.33, inst: "noteOn", note: s[2] },
                    { time: 0.66, inst: "noteOn", note: s[1] },
                    { time: 0.99, inst: "noteOff", note: s[0] },
                    { time: 0.99, inst: "noteOff", note: s[1] },
                    { time: 0.99, inst: "noteOff", note: s[2] },
                    { time: 0.99, inst: "noteOff", note: s[3] },
                    { time: 1.00, inst: "dummy", note: 0 }
                ];
            } else {  // 3 chord
                return [
                    { time: 0, inst: "noteOn", note: s[0] },
                    { time: 0.33, inst: "noteOn", note: s[2] },
                    { time: 0.66, inst: "noteOn", note: s[1] },
                    { time: 0.99, inst: "noteOff", note: s[0] },
                    { time: 0.99, inst: "noteOff", note: s[1] },
                    { time: 0.99, inst: "noteOff", note: s[2] },
                    { time: 1.00, inst: "dummy", note: 0 }
                ];
            }
        };

        this.breakMethodFn.breakUp3 = function (s) {
            if (s[3] !== null) {
                return [
                    { time: 0, inst: "noteOn", note: s[0] },
                    { time: 0, inst: "noteOn", note: s[1] },
                    { time: 0.33, inst: "noteOn", note: s[2] },
                    { time: 0.66, inst: "noteOn", note: s[3] },
                    { time: 0.99, inst: "noteOff", note: s[0] },
                    { time: 0.99, inst: "noteOff", note: s[1] },
                    { time: 0.99, inst: "noteOff", note: s[2] },
                    { time: 0.99, inst: "noteOff", note: s[3] },
                    { time: 1.00, inst: "dummy", note: 0 }
                ];
            } else {  // 3 chord
                return [
                    { time: 0, inst: "noteOn", note: s[0] },
                    { time: 0.33, inst: "noteOn", note: s[1] },
                    { time: 0.66, inst: "noteOn", note: s[2] },
                    { time: 0.99, inst: "noteOff", note: s[0] },
                    { time: 0.99, inst: "noteOff", note: s[1] },
                    { time: 0.99, inst: "noteOff", note: s[2] },
                    { time: 1.00, inst: "dummy", note: 0 }
                ];
            }
        };

        this.breakMethodFn.breakUp4 = function (s) {
            if (s[3] !== null) {
                return [
                    { time: 0, inst: "noteOn", note: s[0] },
                    { time: 0.25, inst: "noteOn", note: s[1] },
                    { time: 0.50, inst: "noteOn", note: s[2] },
                    { time: 0.75, inst: "noteOn", note: s[3] },
                    { time: 0.99, inst: "noteOff", note: s[0] },
                    { time: 0.99, inst: "noteOff", note: s[1] },
                    { time: 0.99, inst: "noteOff", note: s[2] },
                    { time: 0.99, inst: "noteOff", note: s[3] },
                    { time: 1.00, inst: "dummy", note: 0 }
                ];
            } else {  // 3 chord
                return [
                    { time: 0, inst: "noteOn", note: s[0] },
                    { time: 0.25, inst: "noteOn", note: s[1] },
                    { time: 0.50, inst: "noteOn", note: s[2] },
                    { time: 0.74, inst: "noteOff", note: s[1] },
                    { time: 0.75, inst: "noteOn", note: s[1] },
                    { time: 0.99, inst: "noteOff", note: s[0] },
                    { time: 0.99, inst: "noteOff", note: s[1] },
                    { time: 0.99, inst: "noteOff", note: s[2] },
                    { time: 1.00, inst: "dummy", note: 0 }
                ];
            }
        };


        this.breakMethodFn.breakRootToChord = function (s) {
            if (s[3] !== null) {
                return [
                    { time: 0, inst: "noteOn", note: s[0] },
                    { time: 0.49, inst: "noteOff", note: s[0] },
                    { time: 0.50, inst: "noteOn", note: s[0] },
                    { time: 0.50, inst: "noteOn", note: s[1] },
                    { time: 0.50, inst: "noteOn", note: s[2] },
                    { time: 0.50, inst: "noteOn", note: s[3] },
                    { time: 0.99, inst: "noteOff", note: s[0] },
                    { time: 0.99, inst: "noteOff", note: s[1] },
                    { time: 0.99, inst: "noteOff", note: s[2] },
                    { time: 1.00, inst: "dummy", note: 0 }
                ];
            } else {  // 3 chord
                return [
                    { time: 0, inst: "noteOn", note: s[0] },
                    { time: 0.49, inst: "noteOff", note: s[0] },
                    { time: 0.50, inst: "noteOn", note: s[0] },
                    { time: 0.50, inst: "noteOn", note: s[1] },
                    { time: 0.50, inst: "noteOn", note: s[2] },
                    { time: 0.99, inst: "noteOff", note: s[0] },
                    { time: 0.99, inst: "noteOff", note: s[1] },
                    { time: 0.99, inst: "noteOff", note: s[2] },
                    { time: 1.00, inst: "dummy", note: 0 }
                ];
            }
        };

        this.breakMethodFn.NoBreak = function (s) {
            if (s[3] !== null) {
                return [
                    { time: 0, inst: "noteOn", note: s[0] },
                    { time: 0, inst: "noteOn", note: s[1] },
                    { time: 0, inst: "noteOn", note: s[2] },
                    { time: 0, inst: "noteOn", note: s[3] },
                    { time: 0.99, inst: "noteOff", note: s[0] },
                    { time: 0.99, inst: "noteOff", note: s[1] },
                    { time: 0.99, inst: "noteOff", note: s[2] },
                    { time: 0.99, inst: "noteOff", note: s[3] },
                    { time: 1.00, inst: "dummy", note: 0 }
                ];
            } else {  // 3 chord
                return [
                    { time: 0, inst: "noteOn", note: s[0] },
                    { time: 0, inst: "noteOn", note: s[1] },
                    { time: 0, inst: "noteOn", note: s[2] },
                    { time: 0.99, inst: "noteOff", note: s[0] },
                    { time: 0.99, inst: "noteOff", note: s[1] },
                    { time: 0.99, inst: "noteOff", note: s[2] },
                    { time: 1.00, inst: "dummy", note: 0 }
                ];
            }
        };
        
        this.synth = ko.observable(
            "local.asynth = ts.ModPoly(ts.ModAsynth);\n\n" +
    
            "local.asynth.parameter.mono.env.attack = 0.0;\n" +
            "local.asynth.parameter.mono.env.decay = 0.4;\n" +
            "local.asynth.parameter.mono.env.sustain = 0.0;\n" +
            "local.asynth.parameter.mono.env.release = 0.0;\n\n" +
            "local.asynth.parameter.mono.bqf.freqScale = 1.6;\n" +
            "local.asynth.parameter.mono.bqf.Q = 0.0001;\n\n" +
    
            "local.asynth.connect(ts.ctx.destination);\n" +
            "that.parameter = local.asynth.parameter;\n\n" +
            
            "local.seq = ts.ModPolySeq();\n" +
            "local.seq.connect(local.asynth);\n"
        );
        
        this.sequence = ko.observable(
            "var ca = vm.chord().split(/[\\s|]/).filter(function (s) { return s != \"\"; });\n" +
            "local.seq.sequence = ts.chordToSequenceBroken(ca, ts.simpleVoicing, vm.breakMethodFn[vm.breakMethod()]);\n" +
            "var t = ts.ctx.currentTime;\n" +
            "local.seq.invoke(t);\n"
        );
        

        //this.chord = ko.observable('C G Am Em F C F G');
        this.chord = ko.observable(
            'A B G#m C#m A B C#7sus4 C#7\n' +
            'A B E E A B E E\n' +
            'A B G# C#m F# F# B Cm6(-5)\n' +
            'C#m C(+5) E/B A#m7(-5) A A A/B B\n'
            );

        this.volume = ko.observable();
        this.breakMethod = ko.observable(Object.keys(this.breakMethodFn)[0]);
        this.breakMethodKind = Object.keys(this.breakMethodFn);

        this.playChord = function () {
            model.build(this.synth());
            this.volume.subscribe(model.parameter.gain.gain);
        
            model.play(this.sequence(), this);
        };
        this.recycle = function () { model.recycle(); };
        this.stop = function() { model.stop(); };

        this.volume(0.5);
    };
});
