
"use strict";

var map = Array.prototype.map;
var reduce = Array.prototype.reduce;

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

function compose(f,g) {
    return function() {
        return f.call(this, g.apply(this, arguments));
    };
}


function inherit(p) {
    if (p == null) throw new TypeError();

    if (Object.create)
        return Object.create(p);

    var t = typeof p;
    if (t !== "object" && t !== "function") throw new TypeError();

    function F() { };
    F.prototype = p;
    return new F();
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

/*
String.method('trim', function () {
    return this.replace(/^\s+|\s+$/g, '');
});
*/

Function.method('curry', function () {
    var slice = Array.prototype.slice,
    args = slice.apply(arguments),
    that = this;
    return function () {
        return that.apply(null, args.concat(slice.apply(arguments)));
    };
});

var memoizer = function (memo, fundamental) {
    var shell = function (n) {
        var result = memo[n];
        if (typeof result !== 'number') {
            result = fundamental(shell, n);
            memo[n] = result;
        }
        return result;
    };
    return shell;
};

var chordDegree = {
    perfect1: 0,
    minor2:   1,
    major2:   2,
    minor3:   3,
    major3:   4,
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

var parseChord = function(chord)
{
    var st = 0; // state
    var pos = 0;

    var root;
    var third = "major3";   // ad-hock: to be fixed
    var fifth = "perfect5"; // ad-hock: to be fixed
    var seventh;

    while(pos < chord.length)
    {
        switch(st)
        {
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
                } else if(chord[pos] == "-") { // dim
                    pos++;
                    st = 11;
                } else {    // 7th
                    throw new Error("7th, 9th is not implemented yet.");
                }
                break;
            case 10: // aug
                if(chord[pos] == "5") { // aug5
                    pos++;
                    fifth = "aug5";
                    st = 12;  // ")"
                } else {    // maybe aug7
                    fifth = "perfect5";
                    st = 12;  // ")"
                }
                break;
            case 11: // dim
                if(chord[pos] == "5") { // dim7
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
                if(chord[pos] == ")") {
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
}


function constant(v)
{
    return function (t) { return v; }
}

function gain(gf, of)
{
    return function (t) { return i * gf(t) + of(t); }
}



function mix() {
    var oargs = arguments;

    if (oargs.length > 1) {
        var v = reduce.call(
                    oargs,
                    function (x, y) {
                        return function () {
                            return x.apply(this, arguments) + y.apply(this, arguments);
                        };
                    });
        v = compose(function (x) { return x / oargs.length; }, v);
        return v;
    }
    else {
        return oargs[0];
    }
}

function root()
{
    return arguments[0];
}

function note(n) {
    return Math.pow(2, (n - 33) / 12) * 440;
}

var tipsound = function(srate)
{
    // private values
    var that = {};

    srate = srate || 44100;

    try {
        that.context = new AudioContext();
    }
    catch(e)
    {
        console.log(e);
    }
    that.context.samplingRate = srate;

    that.play = function (seq, len) {
        var buffer = this.context.createBuffer(1, srate * len, srate);
        var channel = buffer.getChannelData(0);

        for (var i = 0; i < channel.length; i++) {
            channel[i] = seq.call(this, i);
        }

        var src = this.context.createBufferSource();
        src.buffer = buffer;

        src.connect(this.context.destination);

        src.start(this.context.currentTime);

        return that;
    };

    that.osc_sin = function (freq) {
        return function (t) { return Math.sin(freq(t) / srate * 2 * Math.PI * t); }
    };

    that.osc_saw = function (freq)
    {
        return function (t) { if (freq(t) == null) { return 0; }  else { var p = t % (srate / freq(t)); return 1 - 2 * p / freq(t); } }
    };

    that.sequence_freq = function (seq, bpm)
    {
        var nt = srate * 60 / bpm;

        return function (t) { var p = t / nt; return seq[(p % seq.length).integer()]; }
    };

    that.chordToNote = function(chord)
    {
        var root = chordDegree[chord.root];
        return chord.offset.map(function (x) { return x === undefined ? null : note(chordDegree[x].integer() + 33 + root); });
    };

    that.closedVoicing = function (chord) {
        var root = chordDegree[chord.root];
        return chord.offset.map(function (x) {
            if (x === undefined) {
                return null;
            } else {
                var cd = chordDegree[x].integer() + 33 + root;
                if (cd > 35) {
                    cd -= 12;
                }
                return note(cd);
            }
        });
    };


    that.chordToSequence = function(chords, voicing)
    {
        return mapcar(function() { return arguments; }, map.call(chords, compose(voicing, parseChord)));
    };

    that.buildSynth = function(seq, bpm)
    {
        return mix.apply(that, seq.map(function (x) { return that.osc_saw(that.sequence_freq(x, bpm)); }))
    };

    that.playChord = function(c)
    {
        var ca = c.split(/\s/);
        // in 60bmp
        return that.play(that.buildSynth(that.chordToSequence(ca, that.closedVoicing), 60), ca.length);
    };

    return that;
};


var ts = tipsound();

//document.querySelector("#play").addEventListener("click", function () { ts.playChord(document.getElementById("chord").value); }, false);
