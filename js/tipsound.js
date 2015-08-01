define(['js/util'], function (util) {
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

    ts.parseVoicing = function (voice) {
        var st = 0; // state
        var pos = 0;

        var result = {
            notes: [],
            length: {       // default 1/8
                nume: 1,
                deno: 1
            }
        };

        while (pos < voice.length) {
            switch (st) {
                case 0:     // skip space
                    if(voice[pos] != " " && voice[pos] != "\t") {
                        st = 1;
                    } else {
                        pos++;
                    }
                    break;

                case 1:   // single or multiple voice
                    if (voice[pos] == "[") {    // multiple voice                        
                        st = 3;
                        pos++;   // skip [
                    } else {                    // single voice
                        st = 2;
                    }
                    break;

                case 2: // single voice
                    switch(voice[pos++]) {
                        case 'R':   // root
                            result.notes.push(0);
                            break;
                            
                        case 'T':   // third
                            result.notes.push(1);
                            break;
                            
                        case 'F':   // fifth
                            result.notes.push(2);
                            break;
                            
                        case 'S':   // seventh
                            result.notes.push(3);
                            break;
                            
                        case 'z':   // rest
                            result.notes.push(-1);
                            break;
                            
                        default:
                            throw new Error("parse error.");
                    }
                    st = 4;
                    break;
                    
                case 3: // multiple voicing 1: check single
                    switch(voice[pos++]) {
                        case 'R':   // root
                            result.notes.push(0);
                            break;
                            
                        case 'T':   // third
                            result.notes.push(1);
                            break;
                            
                        case 'F':   // fifth
                            result.notes.push(2);
                            break;
                            
                        case 'S':   // seventh
                            result.notes.push(3);
                            break;
                            
                        case 'z':   // rest
                            result.notes.push(-1);
                            break;
                            
                        case ']':   // end of voice
                            st = 4;
                            break;
                            
                        default:
                            throw new Error("parse error.");
                    }
                    break;
                
                case 4: // length :initialize
                    result.length.nume = 0;
                    st = 5;
                    break;                    
                    
                case 5: // length :nume
                    if(voice[pos] == "/") {
                        st = 6;
                    } else {
                        result.length.nume = result.length.nume * 10 + Number(voice[pos]);
                    }
                    pos++;
                    break;
                
                case 6: // length :initialize
                    result.length.deno = 0;
                    st = 7;
                    break;                    
                
                case 7: // length :deno
                    result.length.deno = result.length.deno * 10 + Number(voice[pos++]);
                    break;
                    
                default:
                    throw new Error("parser internal error.");
            }
        }

        result.length.deno *= 8;    // default 1/8
        return result;
    };



    ts.tabDegree = [18, 23, 28, 33, 37, 42];

    ts.parseTab = function (tab) {
        return util.mapcar(function (a, b) { return b == null ? null : b + a; }, [ts.tabDegree, tab]);
    };

    ts.noteToFreq = function (n) {
        return Math.pow(2,(n - 69) / 12) * 440;
    };

    ts.simpleVoicing = function (chord) {
        var root = ts.chordDegree[chord.root];
        var voice = chord.offset.map(function (x) {
            if (x === undefined) {
                return null;
            } else {
                var cd = ts.chordDegree[x].integer() + 69 - 12 + root;
                return cd;
            }
        });
        if (chord.onchord !== undefined) {
            var on = ts.chordDegree[chord.onchord].integer() + 69 - 12;
            if (on > root) { on -= 12; }
            voice.unshift(on);
        }

        return voice;
    };
    
    var chordToSequence1 = function(chord, voice, offset, meter) {
        var notelen = 240 * voice.length.nume / (voice.length.deno * meter);
        var seq = [];
        voice.notes.map(function(n) { if(n >= 0 && chord[n] !== null) seq.push({ time: offset, inst: "noteOn",  note: chord[n]}); });
        voice.notes.map(function(n) { if(n >= 0 && chord[n] !== null) seq.push({ time: offset + notelen, inst: "noteOff",  note: chord[n]}); });
        return { sequence: seq, length: notelen};
    }

    ts.chordToSequence = function(chords, voices, meter)
    {
        var c = util.map.call(chords, util.compose(ts.simpleVoicing, ts.parseChord));
        var v = util.map.call(voices, ts.parseVoicing);

        var seq = [];
        var t = 0;
        for (var j = 0; j < c.length; j++) {
            for(var i = 0; i < v.length; i++) {
                var s = chordToSequence1(c[j], v[i], t, meter);
                t += s.length;
                seq = seq.concat(s.sequence);
            }
        }

//        seq.sort(function (a, b) { return a.time - b.time; });
        return seq;
    }

    ts.chordToKick = function (chords) {
        var seq = [];
        for (var j = 0; j < chords.length; j++) {
            seq.push({ time: j, inst: "noteOn", note: "kick" });
            seq.push({ time: j + 0.99, inst: "noteOff", note: "kick" });
        }

        return seq;
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
            gain: 1,
            attack: 0.01,   // ad-hock value for noise elimination
            decay: 0,
            sustain: 1,
            release: 0.01   // ad-hock value for noise eliminatino
        };

        that.connect = function (dist) { that.input.connect(dist); };
        that.start = function (t) {
            if(that.parameter.attack == 0) {
                if(that.parameter.decay == 0) {
                    that.input.gain.setValueAtTime(that.parameter.sustain * that.parameter.gain, t);
                } else {
                    that.input.gain.setValueAtTime(that.parameter.gain, t);
                    that.input.gain.setTargetAtTime(that.parameter.sustain * that.parameter.gain, t, that.parameter.decay / 10); // decay, sustain, ad-hock /10
//                    that.input.gain.linearRampToValueAtTime(that.parameter.sustain * that.parameter.gain, t + that.parameter.decay); // decay, sustain, ad-hock /10
                }
            } else {
                that.input.gain.setValueAtTime(0, t);    // zero
                if(that.parameter.decay == 0) {
                    that.input.gain.linearRampToValueAtTime(that.parameter.sustain * that.parameter.gain, t + that.parameter.attack); // decay
                } else {
                    that.input.gain.linearRampToValueAtTime(that.parameter.gain, t + that.parameter.attack); // attack
                    that.input.gain.setTargetAtTime(that.parameter.sustain * that.parameter.gain, t + that.parameter.attack, that.parameter.decay / 10); // decay, sustain, ad-hock /10
//                    that.input.gain.linearRampToValueAtTime(that.parameter.sustain * that.parameter.gain, t + that.parameter.attack + that.parameter.decay); // decay, sustain, ad-hock /10
                }
            }
            
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
            frequency: 20000,
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
        that.input = that;

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
            buffer: null,
            playbackRate: 1,
            detune: 0,
            loop: false,
            loopStart: 0,
            loopEnd: 0
        };

        var b = ts.ctx.createBufferSource();

        that.connect = function (dist) { b.connect(dist); };

        that.start = function (t) {
            b.buffer = that.parameter.buffer;
            b.playbackRate.setValueAtTime(that.parameter.playbackRate, t);
            b.detune.setValueAtTime(that.parameter.detune, t);
            b.loop = that.parameter.loop;
            b.loopStart = that.parameter.loopStart;
            b.loopEnd = that.parameter.loopEnd;
            
            b.start(t);

            return that;
        };
        that.stop = function (t) {
            b.stop(t);
            return that;
        };

        return that;
    };
    
    ts.ModWavOsc = function () {
        var that = {};

        var osc = ts.ModBuffer();
        var bqf = ts.ModBqf();
        var env = ts.ModEnv();
        var run = false;
        
        // parameter prototype
        that.parameter = {
            osc: osc.parameter,
            bqf: bqf.parameter,
            env: env.parameter
        };

        bqf.connect(env.input);
        osc.connect(bqf.input);

        that.connect = function (dist) { env.connect(dist); };
        that.start = function (t) {
            // bind parameters
            osc.parameter = that.parameter.osc;
            bqf.parameter = that.parameter.bqf;
            env.parameter = that.parameter.env;

            osc.start(t);
            bqf.start(t);
            env.start(t);
            run = true;
            return that;
        };
        that.stop = function (t) {
            if(run) {
                osc.stop(t + that.parameter.env.release * 10);     // ad-hock scale factor *10
                env.stop(t);                
            }
            return that;
        };

        return that;
    };
    
    ts.ModSF2 = function (gens, bufs) {
        var that = {};

        var wavoscs = [];
        for(var i = 0; i < gens.length; i++) {
            wavoscs.push(ts.ModWavOsc());
        }
        
        // parameter prototype
        that.parameter = {};

        that.connect = function (dist) { wavoscs.forEach(function (w) { w.connect(dist); }); };

        that.start = function(t, note) {
            for(var i = 0; i < gens.length; i++ ) {
                start1(wavoscs[i], gens[i], bufs[i], gens[i].shdr, t, note);
            }
            
            return that;
        }
                
        var start1 = function (wavosc, gen, buf, shdr, t, note) {
            var vel = 60;
            if(note >= gen.keyRange.lo && note <= gen.keyRange.hi &&
               vel >= gen.velRange.lo && vel <= gen.velRange.hi) {
                   
                var rootKey = shdr.originalPitch;
                var tune = 0;
                   
                for(var g in gen) {
                    var v = gen[g];
                    switch(g) {
                        case 'coarseTune':
                            tune += v;
                            break;
                            
                        case 'fineTune':
                            tune += v / 1200;
                            break;
                            
                        case 'initialAttenuation':
                            wavosc.parameter.env.gain = Math.pow(10, -v / 200);
                            break;
                            
                        case 'delayVolEnv':
                            t += Math.pow(2, v / 1200);
                            break;
                            
                        case 'attackVolEnv':
                            wavosc.parameter.env.attack = Math.pow(2, v / 1200);
                            break;
                            
                        case 'decayVolEnv':
                            wavosc.parameter.env.decay = Math.pow(2, v / 1200);
                            break;
                            
                        case 'sustainVolEnv':
                            wavosc.parameter.env.sustain = Math.pow(10, -v / 200);
                            break;
                            
                        case 'releaseVolEnv':
                            wavosc.parameter.env.release = Math.pow(2, v / 1200) / 10;
                            break;                            
                            
                        case 'overridingRootKey':
                            rootKey = v;
                            break;
                            
                        case 'initialFilterFc':
                            wavosc.parameter.bqf.frequency = Math.pow(2, (v - 13500) / 1200) * 20000;
                            break;
                            
                        default:
                            break;
                    }
                }
                   
                // bind parameters
                wavosc.parameter.osc.buffer = buf;
                wavosc.parameter.osc.loopStart = shdr.startloop / shdr.sampleRate;
                wavosc.parameter.osc.loopEnd = shdr.endloop / shdr.sampleRate;
                wavosc.parameter.osc.loop = gen.sampleModes == 1 ? true : false;
                wavosc.parameter.osc.playbackRate = Math.pow(2,(note - rootKey) / 12 + tune);
                
                console.log(JSON.stringify(wavosc.parameter.env, null, 4));
                
                wavosc.start(t);                
            }
            
            return that;
        };
        
        that.stop = function (t) {
            wavoscs.forEach(function(w) { w.stop(t); });
            return that;
        };
        that.dispose = function(t) {
            
        }

        return that;
    };
    
    ts.ModSF2.prepareBuffer = function(gens) {
        var bufs = [];
        gens.forEach(function(gen) {
            var buf = ts.ctx.createBuffer(1, gen.shdr.end, gen.shdr.sampleRate);
            buf.copyToChannel(gen.shdr.sample, 0);
            bufs.push(buf);
        });
        
        return bufs;
    };
    
    
    
    ts.ModPolySeq = function() {
        var that = {};
        that.parameter = {
            sequence: null,
            delta: 0.2
        };
        
        var modPoly = null;
        var begin = 0;
        var seq = null;
        var an = {};
        
        that.connect = function(dist) { modPoly = dist; };
        
        that.init = function(t) {
            begin = t;
            seq = [].concat(that.parameter.sequence);
        };
        
        that.enque = function(t) {
            while(seq !== null && seq.length > 0 && (seq[0].time + begin) < t + that.parameter.delta) {
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
            if(dst == "destination") {
                fg.module[src].connect(ts.ctx.destination);
            } else {
                fg.module[src].connect(fg.module[dst].input);
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
                for(var v in fg.module) {
                    if(fg.module[v]["init"] !== undefined) {
                        fg.module[v].parameter.delta = fg.delta;
                        fg.module[v].init(t);
                    }
                }
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
            
            var v;
            for(v in fg.module) {
                if(fg.module[v]["recycle"] !== undefined) fg.module[v].recycle(t);
            }
            
            dispatch();
            if(!isrun) return ;

            for(v in fg.module) {
                if(fg.module[v]["enque"] !== undefined) fg.module[v].enque(t);
            }
            
            var r = util.reduce.call(
                        util.hmap(function(v) { return v["rest"] !== undefined ? v.rest() > 0 : false; }, fg.module),
                        function(p, c) { return p || c; }
                    );
            if(r) {
                setTimeout(enque, 10);
            } else {
                isrun = false;
            }
        };
        
        return fg;
    };

    return ts;
});
