define(function () {	// model
    "use strict";
    var ctx = new AudioContext();
    var asynth = null;

    var chordDegree = {
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

    //
    // local functions
    
    // 1. utility functions
    var map = Array.prototype.map;

    function mapcar(fn, lists) // ad-hock: assume all list lengths are the same. maybe fixed after.
    {
        var r = [];
        for (var i = 0; i < lists[0].length; i++) {
            var tr = [];
            for (var j = 0; j < lists.length; j++) {
                tr.push(lists[j][i]);
            }
            r.push(fn.apply(null, tr));
        }

        return r;
    }

    function compose(f, g) {
        return function () {
            return f.call(this, g.apply(this, arguments));
        };
    }

    Function.prototype.method = function (name, func) {
        if (!this.prototype[name]) {
            this.prototype[name] = func;
            return this;
        } else {
            throw new Error("method error.");
        }
    };

    Number.method('integer', function () {
        return Math[this < 0 ? 'ceil' : 'floor'](this);
    });
    
    // 3. specific functions
    var parseChord = function (chord) {
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

    var noteToFreq = function (n) {
        return Math.pow(2,(n - 33) / 12) * 440;
    };

    var closedVoicing = function (chord) {
        var root = chordDegree[chord.root];
        return chord.offset.map(function (x) {
            if (x === undefined) {
                return null;
            } else {
                var cd = chordDegree[x].integer() + 33 + root;
                if (cd > 35) {
                    cd -= 12;
                }
                return noteToFreq(cd);
            }
        });
    };

    var chordToSequence = function (chords, voicing) {
        return mapcar(function () { return arguments; }, map.call(chords, compose(voicing, parseChord)));
    };

    function ModEnv() {
        var that = {};
        that.input = ctx.createGain();
        that.attack = 0;
        that.decay = 0;
        that.sustain = 1;
        that.release = 0;

        that.connect = function (dist) { that.input.connect(dist); };
        that.start = function (t) {
            that.input.gain.setValueAtTime(0, t);    // zero
            that.input.gain.linearRampToValueAtTime(1, t + that.attack); // attack
            that.input.gain.setTargetAtTime(that.sustain, t + that.attack, that.decay); // decay, sustain
            
            return that;
        };
        that.stop = function (t) {
            that.input.gain.setTargetAtTime(0, t, that.release);    // release 
            
            return that;
        };

        return that;
    }

    function ModAsynth1() {
        var that = {};
        that.bqf = ctx.createBiquadFilter();
        that.osc = {
            type: "sawtooth",
            frequency: 440
        };
        that.bqfFreqScale = 2;
        that.env = ModEnv();
        
        var osc = null;

        that.bqf.connect(that.env.input);

        that.connect = function (dist) { that.env.connect(dist); };
        that.start = function (t) {
            osc = ctx.createOscillator();
            osc.type = that.osc.type;
            osc.frequency.value = that.osc.frequency;
            osc.connect(that.bqf);
            that.bqf.frequency.setValueAtTime(that.osc.frequency * that.bqfFreqScale, t);
            osc.start(t);
            that.env.start(t);
            return that;
        };
        that.stop = function (t) {
            osc.stop(t + that.env.release * 1.5);
            that.env.stop(t);
            osc = null;
            return that;
        };

        return that;
    };

    function ModAsynth(numvoice) {
        var that = {};
        that.gain = ctx.createGain();
        that.voice = new Array(numvoice);

        for (var i = 0; i < numvoice; i++) {
            that.voice[i] = ModAsynth1();
            that.voice[i].connect(that.gain);
        }

        that.connect = function (dist) { that.gain.connect(dist); };
        
        return that;
    }

    //
    // model constructor
    return function () {
        this.build = function (v, f, q) {
            asynth = ModAsynth(32);
            asynth.gain.gain.value = v;
            asynth.connect(ctx.destination);

            for (var i = 0; i < asynth.voice.length; i++) {
                asynth.voice[i].bqfFreqScale = f;
                asynth.voice[i].bqf.Q.value = q;

                asynth.voice[i].env.attack = 0.0;
                asynth.voice[i].env.decay = 0.4;
                asynth.voice[i].env.sustain = 0.0;
                asynth.voice[i].env.release = 0.0;
            }
        };

        this.play = function (voice, note) {
            asynth.voice[voice].osc.frequency = note;
            asynth.voice[voice].start(ctx.currentTime);
        }
        this.stop = function (voice) {
            asynth.voice[voice].stop(ctx.currentTime);
        };


        this.playChord = function (c) {
            var ca = c.split(/\s/);
            var seq = chordToSequence(ca, closedVoicing);
            var noteOff = 2.0;

            var current = 0;
            for (var j = 0; j < seq.length; j++) {
                for (var i = 0; i < seq[j].length; i++) {
                    if (seq[j][i] !== null) {
                        asynth.voice[current].osc.frequency = seq[j][i];
                        asynth.voice[current].start(ctx.currentTime + i);
                        asynth.voice[current].stop(ctx.currentTime + i + noteOff);
                        current++;
                        if(current >= asynth.voice.length) current = 0;
                    }
                }
            }
        };


        this.clear = function () {
            /*
            for (var i = 0; i < osc.length; i++) {
                osc[i].disconnect();
            }
            bqf.disconnect();
            gain.disconnect();
            osc = null;
            bqf = null;
            gain = null;
            */
        };

        this.setGain = function (g) {
            if (asynth)
                asynth.gain.gain.value = g;
        };

        this.setBQFQ = function (q) {
            if (asynth) {
                for (var i = 0; i < asynth.voice.length; i++) {
                    asynth.voice[i].bqf.Q.value = q;
                }
            }
        };

        this.setBQFFreq = function (f) {
            if (asynth) {
                for (var i = 0; i < asynth.voice.length; i++) {
                    asynth.voice[i].bqf.frequency.value = f;
                }
            }
        };
        
        this.setBQFFreqScale = function (f) {
            if (asynth) {
                for (var i = 0; i < asynth.voice.length; i++) {
                    asynth.voice[i].bqfFreqScale = f;
                }
            }
        };

    };
});
