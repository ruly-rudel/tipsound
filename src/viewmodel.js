// Main viewmodel class
define(['knockout-3.3.0', 'model'], function (ko, model) {
    "use strict";

    return function () { // ViewModel constructor
        var breakMethod = {};

        breakMethod.breakDown3 = function (s) {
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

        breakMethod.breakUp3 = function (s) {
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

        breakMethod.breakUp4 = function (s) {
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


        breakMethod.breakRootToChord = function (s) {
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

        breakMethod.NoBreak = function (s) {
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

        //this.chord = ko.observable('C G Am Em F C F G');
        this.chord = ko.observable(
            'A B G#m C#m A B C#7sus4 C#7\n' +
            'A B E E A B E E\n' +
            'A B G# C#m F# F# B Cm6(-5)\n' +
            'C#m C(+5) E/B A#m7(-5) A A A/B B\n'
            );

        this.volume = ko.observable();
        this.freqscale = ko.observable();
        this.Q = ko.observable();
        this.breakMethod = ko.observable(Object.keys(breakMethod)[0]);
        this.breakMethodKind = Object.keys(breakMethod);

        this.playChord = function () {
            model.playChord(
                this.chord(),
                model.ts.chordToSequenceBroken,
                model.ts.simpleVoicing,
                breakMethod[this.breakMethod()]
                );
        };
        this.recycle = function () { model.recycle(); };

        model.build();
        this.volume.subscribe(model.parameter.gain.gain);
        this.freqscale.subscribe(model.parameter.mono.bqf.freqScale);
        this.Q.subscribe(model.parameter.mono.bqf.Q);

        this.volume(0.5);
        this.freqscale(1.6);
        this.Q(0.0001);
    };
});
