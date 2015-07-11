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

        Cb: -10,
        C: -9,
        Cs: -8,

        Db: -8,
        D: -7,
        Ds: -6,

        Eb: -6,
        E: -5,

        Fb: -5,
        F: -4,
        Fs: -3,

        Gb: -3,
        G: -2,
        Gs: -1,

        Ab: -1,
        A: 0,
        As: 1,

        Bb: 1,
        B: 2,
        Bs: 3
    };


    ts.parseChord = function (chord) {
        var st = 0; // state
        var pos = 0;

        var root;
        var third = "major3";   // ad-hock: to be fixed
        var fifth = "perfect5"; // ad-hock: to be fixed
        var seventh;
        var onchord;

        while (pos < chord.length) {
            switch (st) {
                case 0:     // root note
                    root = chord[pos++];
                    st = 0.5; // to sharp/flat
                    break;

                case 0.5:   // sharp/flat
                    if (chord[pos] == "#") {
                        root = root + "s";
                        pos++;
                    } else if (chord[pos] == "b") {
                        root = root + "b";
                        pos++;
                    }
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
                        fifth = "perfect5";
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
                    if (chord[pos] == "/") {
                        pos++;
                        st = 14;    // on code check
                    } else {
                        throw new Error("parse error.");
                    }
                    break;
                case 14:
                    onchord = chord[pos++];
                    st = 15;
                    break;
                case 15:
                    if (chord[pos] == "#") {
                        onchord = onchord + "s";
                        pos++;
                    } else if (chord[pos] == "b") {
                        onchord = onchord + "b";
                        pos++;
                    }
                    st = -1; // to error: must be reached.
                    break;

                default:
                    throw new Error("parser internal error.");
                    break;

            }
        }

        return { "root": root, "onchord": onchord, offset: ["perfect1", third, fifth, seventh] };
    };

    ts.tabDegree = [18, 23, 28, 33, 37, 42];

    ts.parseTab = function (tab) {
        return util.mapcar(function (a, b) { return b == null ? null : b + a; }, [ts.tabDegree, tab]);
    };

    ts.noteToFreq = function (n) {
        return Math.pow(2,(n - 33) / 12) * 440;
    };

    ts.simpleVoicing = function (chord) {
        var root = ts.chordDegree[chord.root];
        var voice = chord.offset.map(function (x) {
            if (x === undefined) {
                return null;
            } else {
                var cd = ts.chordDegree[x].integer() + 33 - 12 + root;
                return cd;
            }
        });
        if (chord.onchord !== undefined) {
            var on = ts.chordDegree[chord.onchord].integer() + 33 - 12;
            if (on > root) { on -= 12; }
            voice.unshift(on);
        }

        return voice;
    };

    /*
    ts.closedVoicing = function (chord) {
        var root = ts.chordDegree[chord.root];
        return chord.offset.map(function (x) {
            if (x === undefined) {
                return null;
            } else {
                var cd = ts.chordDegree[x].integer() + 33 - 12 + root;
                if (cd > 35 - 12) {
                    cd -= 12;
                }
                return cd;
            }
        });
    };
    */

    ts.chordToKick = function (chords) {
        var seq = [];
        for (var j = 0; j < chords.length; j++) {
            seq.push({ time: j, inst: "noteOn", note: "kick" });
            seq.push({ time: j + 0.99, inst: "noteOff", note: "kick" });
        }

        return seq;
    };

    ts.chordToSequence = function (chords, voicing) {
        var c = util.map.call(chords, util.compose(voicing, ts.parseChord));

        var seq = [];
        for (var j = 0; j < c.length; j++) {
            for (var i = 0; i < c[j].length; i++) {
                if (c[j][i] !== null) {
                    seq.push({ time: j, inst: "noteOn", note: c[j][i] });
                    seq.push({ time: j + 0.99, inst: "noteOff", note: c[j][i] });
                }
            }
        }

        seq.sort(function (a, b) { return a.time - b.time; });
        return seq;
    };

    ts.chordToSequenceBroken = function (chords, voicing, br) {
        var c = util.map.call(chords, util.compose(voicing, ts.parseChord));

        var seq = [];
        var t = 0;
        for (var j = 0; j < c.length; j++) {
            var bc = br(c[j]);
            for (var i = 0; i < bc.length; i++) {
                if (bc[i].inst != "dummy")
                    seq.push({ time: t + bc[i].time, inst: bc[i].inst, note: bc[i].note });
            }
            t = t + bc[bc.length - 1].time;
        }

        seq.sort(function (a, b) { return a.time - b.time; });
        return seq;
    };
    
    ts.abcToSequence = function () {
        var meter = {
            num: 4,
            dino: 4
        };
        var length = 1/8;
        var tempo = 100;
        var key = "C";
        
        return function(abc) {
            
        };
    }();

    ts.tabToSequence = function (tabs) {
        var t = util.map.call(tabs, ts.parseTab);

    };

    //
    // AudioNode Modules
    ts.ModOsc = function () {
        var that = {};
        var subscriber = [];

        that.input = ts.ctx.createOscillator();
        that.parameter = {
            type: "sawtooth"
        };

        that.connect = function (dist) { that.input.connect(dist); };
        that.start = function (t, note) {
            that.dispose();     // hmm... is good or not???
            that.input.type = that.parameter.type;
            that.input.frequency.setValueAtTime(ts.noteToFreq(note), t);
            that.input.start(t);

            return that;
        };
        that.stop = function (t) {
            that.input.stop(t);

            return that;
        };
        that.dispose = function (t) {
            subscriber.map(function (x) { x.dispose(); });
            subscriber = [];
        };

        return that;
    };

    ts.ModGain = function () {
        var that = {};
        var subscriber = [];

        that.input = ts.ctx.createGain();
        that.parameter = {
            gain: util.Observable(1)
        };
        subscriber.push(that.parameter.gain.subscribe(function (v) { that.input.gain.value = v; }));

        that.connect = function (dist) { that.input.connect(dist); };
        that.dispose = function (t) {
            subscriber.map(function (x) { x.dispose(); });
            subscriber = [];
        };

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
        var subscriber = [];

        that.input = ts.ctx.createBiquadFilter();
        that.parameter = {
            frequency: 880,
            Q: 0.0001
        };

        that.connect = function (dist) { that.input.connect(dist); };
        that.start = function (t) {

            that.input.frequency.setValueAtTime(that.parameter.frequency, t);
            that.input.Q.setValueAtTime(that.parameter.Q, t);
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
        var subscriber = [];

        var osc = ts.ModOsc();
        var bqf = ts.ModBqf();
        var env = ts.ModEnv();

        // parameter prototype
        that.parameter = {
            osc: osc.parameter,
            bqf: bqf.parameter,
            env: env.parameter
        };
        that.parameter.bqf.freqScale = 2;

        bqf.connect(env.input);
        osc.connect(bqf.input);

        that.connect = function (dist) { env.connect(dist); };
        that.start = function (t, note) {
            // bind parameters
            osc.parameter = that.parameter.osc;
            bqf.parameter = that.parameter.bqf;
            env.parameter = that.parameter.env;

            var frequency = ts.noteToFreq(note);
            bqf.parameter.frequency = frequency * that.parameter.bqf.freqScale;

            osc.start(t, note);
            bqf.start(t);
            env.start(t);
            return that;
        };
        that.stop = function (t) {
            osc.stop(t + that.parameter.env.release * 4);     // ad-hock scale factor *4
            env.stop(t);
            return that;
        };
        that.dispose = function () {
            subscriber.map(function (x) { x.dispose(); });
            subscriber = [];
        };

        return that;
    };

    ts.ModPoly = function (m) {
        var that = {};
        var objq = [];
        var gain = ts.ModGain();
        that.parameter = {
            gain: gain.parameter,
            mono: m().parameter
        };

        that.connect = function (dist) { gain.connect(dist); };

        that.start = function (t, note) {
            var v = m();
            v.connect(gain.input);
            v.parameter = that.parameter.mono;

            var q = v.start(t, note);
            objq.push({ time: t, obj: q });
            return q;
        };
        that.recycle = function (t) {
            while (objq.length !== 0 && objq[0].time < t) {  // is bug: time is not the end of the note.
                objq[0].obj.dispose();
                objq.shift();
            }
        };

        return that;
    };

    ts.ModBuffer = function () {
        var that = {};
        that.parameter = {
            buffer: null
        };

        var b = ts.ctx.createBufferSource();

        that.connect = function (dist) { b.connect(dist); };

        that.start = function (t) {
            b.buffer = that.parameter.buffer;
            b.start(t);

            return that;
        };
        that.stop = function (t) {
            b.stop(t);
            return that;
        };

        return that;
    };
    
    ts.ModPolySeq = function() {
        var that = {};
        that.sequence = null;
        that.delta = 0.1;
        
        var modPoly = null;
        var begin = 0;
        var seq = null;
        var an = {};
        
        that.connect = function(dist) { modPoly = dist; };
        
        that.init = function(t) {
            begin = t;
            seq = [].concat(that.sequence);
        };
        
        that.enque = function(t) {
            while(seq !== null && seq.length > 0 && (seq[0].time + begin) < t + that.delta) {
                console.log("time: " + t);
                switch (seq[0].inst) {
                    case "noteOn":
                        console.log(" noteOn: " + seq[0].note + " at " + (seq[0].time + begin));
                        an[seq[0].note] = modPoly.start(begin + seq[0].time, seq[0].note);
                        break;
                    case "noteOff":
                        an[seq[0].note].stop(begin + seq[0].time);
                        an[seq[0].note] = null;
                        break;
                    default:
                        throw new Error();
                }
                seq.shift();
            }
        };
        
        that.rest = function() { return seq.length; };
        
        return that;
    };

    ts.ModBuilder = function (arg) {
        var that = {};
        var subscriber = [];
        var mod = {};

        // create AudioNodes or Modules
        arg.map(function (t) { mod[t.name] = t.fn(); });
        var first = mod[arg[0].name];
        var last = mod[arg[arg.length - 1].name];
        that.input = first.input;

        // create parameter
        that.parameter = {};
        arg.map(function (t) { that.parameter[t.name] = mod[t.name].parameter; });

        that.connect = function (dist) { last.connect(dist); };

        that.dispose = function () {
            subscriber.map(function (x) { x.dispose(); });
            subscriber = [];
        };
    };
    
    ts.FilterGraph = function() {
        var fg = {};
        fg.module = {};
        
        fg.register = function(name, mod) {
            fg.module[name] = mod;
        };
        
        fg.connect = function(src, dst) {
            if(dst == "distination") {
                fg.module[src].connect(ts.ctx.destination);
            } else {
                fg.module[src].connect(fg.module[dst]);
            }
        };
        
        fg.release = function (){
            fg.module = {};
        };

        fg.delta = 0.1;
        
        var cmd = [];
        var isrun = false;
        
        fg.invoke = function(t) {
            if(!isrun) {
                fg.module.seq.init(t);
                isrun = true;
                enque(ts.ctx.currentTime);                
            }
        };
        
        fg.post = function(x) {
            cmd.push(x);
            if(!isrun) {
                dispatch();
            }
        };
        
        var dispatch = function() {
            while(cmd.length > 0) {
                var c = cmd.shift();
                switch(c.inst) {
                    case 'stop':
                        isrun = false;
                        return;
                    default:
                        break;                        
                }
            }            
        };
        
        var enque = function() {
            var t = ts.ctx.currentTime;
            fg.module.asynth.recycle(t);
            
            dispatch();
            if(!isrun) return ;
            
            fg.module.seq.enque(t);
            if(fg.module.seq.rest() > 0) {
                setTimeout(enque, 10);
            } else {
                isrun = false;
            }            
        };
        
        return fg;
    };



    return ts;
});
