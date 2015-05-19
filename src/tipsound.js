define(['util'], function (util) {
    "use strict";

    var ts = {};
    ts.ctx = new AudioContext();

    // utility functions
    ts.chordDegree = {
        perfect1: 0,
        minor2: 1,
        major2: 2,
        minor3: 3,
        major3: 4,
        perfect4: 5,
        aug4: 6,
        dim5: 6,
        perfect5: 7,
        aug5: 8,
        minor6: 8,
        major6: 9,
        minor7: 10,
        major7: 11,
        C: -9,
        D: -7,
        E: -5,
        F: -4,
        G: -2,
        A: 0,
        B: 2
    };


    ts.parseChord = function (chord) {
        var st = 0; // state
        var pos = 0;

        var root;
        var third = "major3";   // ad-hock: to be fixed
        var fifth = "perfect5"; // ad-hock: to be fixed
        var seventh;

        while (pos < chord.length) {
            switch (st) {
                case 0:     // root note
                    root = chord[pos++];
                    st = 1; // to 3rd
                    break;

                case 1: // 3rd
                    if (chord[pos] == "m") {    // minor
                        pos++;
                        third = "minor3";
                    } else {
                        third = "major3";
                    }
                    st = 2; // to 7th
                    break;
                case 2: // 7th
                    if (chord[pos] == "M") {    // maybe major 7th
                        pos++;
                        st = 3; // check if it is major 7th
                    } else if (chord[pos] == "7") {  // minor 7th
                        pos++;
                        seventh = "minor7";
                        st = 4; // check sus4
                    } else if (chord[pos] == "6") {  // major 6th
                        pos++;
                        seventh = "major6";
                        st = 4; // check sus4
                    } else {
                        st = 4; // check sus4
                    }
                    break;
                case 3: // major 7th
                    if (chord[pos] == "7") {    // major 7th
                        pos++;
                        seventh = "major7";
                    } else {
                        throw new Error("parse error.");
                    }
                    st = 4;     // check sus4
                    break;
                case 4: // sus4-1:s
                    if (chord[pos] == "s") {
                        pos++;
                        st = 5;     // sus4-2:u
                    } else {
                        st = 8;     // 5th
                    }
                    break;
                case 5: // sus4-2:u
                    if (chord[pos] == "u") {
                        pos++;
                        st = 6;
                    } else {
                        throw new Error("parse error.");
                    }
                    break;
                case 6: // sus4-2:s
                    if (chord[pos] == "s") {
                        pos++;
                        st = 7;
                    } else {
                        throw new Error("parse error.");
                    }
                    break;
                case 7: // sus4-2:4
                    if (chord[pos] == "4") {
                        pos++;
                        third = "perfect4";
                        st = 8;
                    } else {
                        throw new Error("parse error.");
                    }
                    break;
                case 8: // 5th
                    if (chord[pos] == "(") {    // 5th, 9th, 11th exists
                        pos++;
                        st = 9;
                    } else {
                        fifth = "perfetc5";
                        st = 13;                // on-code
                    }
                    break;
                case 9: // aug or dim
                    if (chord[pos] == "+") {    // aug
                        pos++;
                        st = 10;
                    } else if (chord[pos] == "-") { // dim
                        pos++;
                        st = 11;
                    } else {    // 7th
                        throw new Error("7th, 9th is not implemented yet.");
                    }
                    break;
                case 10: // aug
                    if (chord[pos] == "5") { // aug5
                        pos++;
                        fifth = "aug5";
                        st = 12;  // ")"
                    } else {    // maybe aug7
                        fifth = "perfect5";
                        st = 12;  // ")"
                    }
                    break;
                case 11: // dim
                    if (chord[pos] == "5") { // dim7
                        pos++;
                        fifth = "dim5";
                        st = 12;  // 7th
                    } else {
                        throw new Error("7th, 9th is not implemented yet.");
                        fifth = "perfect5";
                        st = 12;
                    }
                    break;
                case 12: // ")"
                    if (chord[pos] == ")") {
                        pos++;
                        st = 13;
                    } else {
                        throw new Error("parse error");
                    }
                    break;
                case 13: // on-code
                    throw new Error("on-code is not implemented yet.");
                    break;
                default:
                    throw new Error("parser internal error.");
                    break;

            }
        }

        return { "root": root, offset: ["perfect1", third, fifth, seventh] };
    };

    ts.noteToFreq = function (n) {
        return Math.pow(2,(n - 33) / 12) * 440;
    };

    ts.closedVoicing = function (chord) {
        var root = ts.chordDegree[chord.root];
        return chord.offset.map(function (x) {
            if (x === undefined) {
                return null;
            } else {
                var cd = ts.chordDegree[x].integer() + 33 + root;
                if (cd > 35) {
                    cd -= 12;
                }
                return ts.noteToFreq(cd);
            }
        });
    };

    ts.chordToSequence = function (chords, voicing) {
        return util.mapcar(function () { return arguments; }, util.map.call(chords, util.compose(voicing, ts.parseChord)));
    };
    

    //
    // AudioNode Modules
    ts.ModOsc = function () {
        var that = {};
        that.input = ts.ctx.createOscillator();
        that.parameter = {
            type: "sawtooth",
            frequency: 440
        };

        that.connect = function (dist) { that.input.connect(dist); };
        that.start = function (t) {
            that.input.type = that.parameter.type;
            that.input.frequency.setValueAtTime(that.parameter.frequency, t);
            that.input.start(t);

            return that;
        };
        that.stop = function (t) {
            that.input.stop(t);

            return that;
        };

        return that;
    };

    ts.ModGain = function () {
        var that = {};
        that.input = ts.ctx.createGain();
        that.parameter = {
            gain: util.Observable(1)
        };
        that.parameter.gain.subscribe(function (v) { that.input.gain.value = v; });

        that.connect = function (dist) { that.input.connect(dist); };

        return that;
    };

    ts.ModEnv = function () {
        var that = {};
        that.input = ts.ctx.createGain();
        that.parameter = {
            attack: 0,
            decay: 0,
            sustain: 1,
            release: 0
        };

        that.connect = function (dist) { that.input.connect(dist); };
        that.start = function (t) {
            that.input.gain.setValueAtTime(0, t);    // zero
            that.input.gain.linearRampToValueAtTime(1, t + that.parameter.attack); // attack
            that.input.gain.setTargetAtTime(that.parameter.sustain, t + that.parameter.attack, that.parameter.decay); // decay, sustain
            
            return that;
        };
        that.stop = function (t) {
            that.input.gain.setTargetAtTime(0, t, that.parameter.release);    // release 
            
            return that;
        };

        return that;
    };

    ts.ModBqf = function () {
        var that = {};
        that.input = ts.ctx.createBiquadFilter();
        that.parameter = {
            frequency: util.Observable(880),
            Q: util.Observable(0.0001)
        };

        var subscriber = [];

        that.connect = function (dist) { that.input.connect(dist); };
        that.start = function (t) {
            subscriber.push(that.parameter.frequency.subscribe(function (v) { that.input.frequency.setValueAtTime(v, t); }));
            subscriber.push(that.parameter.Q.subscribe(function (v) { that.input.Q.setValueAtTime(v, t); }));

            that.input.frequency.setValueAtTime(that.parameter.frequency(), t);
            that.input.Q.setValueAtTime(that.parameter.Q(), t);
            return that;
        };

        that.dispose = function () {
            subscriber.map(function (x) { x.dispose(); });
            subscriber = [];
        };

        return that;
    };

    ts.ModAsynth = function () {
        var that = {};
        that.parameter = {
            osc: ts.ModOsc().parameter,
            bqf: {
                freqScale: util.Observable(2),
                Q: util.Observable(0.0001)
            },
            env: ts.ModEnv().parameter
        };
        var bqf = ts.ModBqf();
        var env = ts.ModEnv();
        var osc = null;

        bqf.connect(env.input);

        that.connect = function (dist) { env.connect(dist); };
        that.start = function (t) {
            osc = ts.ModOsc();
            osc.parameter = that.parameter.osc;
            osc.connect(bqf.input);

            var frequency = that.parameter.osc.frequency;
            bqf.parameter.frequency = util.Observable(frequency * that.parameter.bqf.freqScale());
            that.parameter.bqf.freqScale.subscribe(function (v) { bqf.parameter.frequency(frequency * v); });
            bqf.parameter.Q = that.parameter.bqf.Q;

            env.parameter = that.parameter.env;

            osc.start(t);
            bqf.start(t);
            env.start(t);
            return that;
        };
        that.stop = function (t) {
            osc.onended = function () { console.log("onended"); bqf.dispose(); };
            osc.stop(t + that.parameter.env.release * 4);     // ad-hock scale factor *4
            env.stop(t);
            return that;
        };

        return that;
    };

    ts.ModPoly = function (m) {
        var that = {};
        var gain = ts.ModGain();
        that.parameter = {
            gain: gain.parameter,
            mono: m().parameter
        };

        that.connect = function (dist) { gain.connect(dist); };

        that.start = function (t) {
            var v = m();
            v.connect(gain.input);
            v.parameter = that.parameter.mono;

            return v.start(t);
        };

        return that;
    };

    return ts;
});