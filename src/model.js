define(function () {	// model
    "use strict";
    var ctx = new AudioContext();
    var osc = null;
    var gain = null;
    var env = null;
    var bqf = null;

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

    //
    // model constructor
    return function () {
        this.playChord = function (c, v, f, q) {
            var ca = c.split(/\s/);
            var seq = chordToSequence(ca, closedVoicing);

            gain = ctx.createGain();
            this.setGain(v);
            gain.connect(ctx.destination);
            
            env = ctx.createGain();
            var attack = 0.001;
            var decay = 0.4;
            var sustain = 0.4;
            var release = 0.2;
            var noteoff = 0.6;
            for (var i = 0; i < seq[0].length; i++) {
                env.gain.setValueAtTime(0, ctx.currentTime + i);    // zero
                env.gain.linearRampToValueAtTime(1, ctx.currentTime + i + attack); // attack
                env.gain.setTargetAtTime(sustain, ctx.currentTime + i + attack, decay); // decay, sustain
                env.gain.setTargetAtTime(0, ctx.currentTime + i + noteoff, release);    // release
            }
            env.connect(gain);
            
            bqf = ctx.createBiquadFilter();
            this.setBQFFreq(f);
            this.setBQFQ(q);
            bqf.connect(env);

            osc = new Array(4);
            for (var j = 0; j < osc.length; j++) {
                osc[j] = ctx.createOscillator();
                osc[j].type = "sawtooth";
                for (var i = 0; i < seq[j].length; i++) {
                    osc[j].frequency.setValueAtTime(seq[j][i] === null ? 0 : seq[j][i], ctx.currentTime + i);
                }
                osc[j].connect(bqf);
            }

            for (var j = 0; j < osc.length; j++) {
                osc[j].start(ctx.currentTime);
                osc[j].stop(ctx.currentTime + seq[j].length);
            }
        };

        this.stop = function () {
            for (var i = 0; i < osc.length; i++) {
                osc[i].disconnect();
            }
            bqf.disconnect();
            gain.disconnect();
            osc = null;
            bqf = null;
            gain = null;
        };
        
        this.setGain = function (g) {
            if (gain)
                gain.gain.value = g * 0.25;
        };
        
        this.setBQFQ = function (q) {
            if(bqf)
                bqf.Q.value = q;
        };
        
        this.setBQFFreq = function (f) {
            if(bqf)
                bqf.frequency.value = f;
        };
    };
});