
"use strict"

var map = Array.prototype.map;
var reduce = Array.prototype.reduce;

function compose(f,g) {
    return function() {
        return f.call(this, g.apply(this, arguments));
    };
}

function inherit(p) {
    if (p == null) throw TypeError();

    if (Object.create)
        return Object.create(p);

    var t = typeof p;
    if (t !== "object" && t !== "function") throw TypeError();

    function f() { };
    f.prototype = p;
    return new f();
}

/*
function monotone(freq, sec)
{
    var tone = function (t, srate) { return Math.sin(freq / srate * Math.PI * t); }
    tone.dulation = sec;    // in second

    return tone;
}

function mix()
{
    var oargs = arguments;

    if (oargs.length > 1) {
        var v = reduce.call(
                    oargs,
                    function (x, y) {
                        return function () {
                            return x.apply(this, arguments) + y.apply(this, arguments);
                        };
                    });
        v = compose(function (x) { return x / oargs.length; } , v);
        v.dulation = oargs[0].dulation; // to be fixed(MAX of oargs[*].dulation)
        return v;
    }
    else
    {
        return oargs[0];
    }
}
*/

function constant(v)
{
    return function (t) { return v; }
}

function osc_sin(freq, srate)
{
   return function (t) { return Math.sin(freq(t, srate) / srate * 2 * Math.PI * t); }
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

function note(n, octave) {
    return Math.pow(2, (n - 33 + (12 * (octave || 0))) / 12) * 440;
}

function TipSound(srate)
{
    try {
        this.context = new AudioContext();
    }
    catch(e)
    {
        console.log(e);
    }

    this.context.samplingRate = srate ? srate : 44100;

    this.play = function (seq, len) {
        var buffer = this.context.createBuffer(1, this.context.samplingRate * len, this.context.samplingRate);
        var channel = buffer.getChannelData(0);

        for (var i = 0; i < channel.length; i++) {
            channel[i] = seq.call(this, i);
        }

        var src = this.context.createBufferSource();
        src.buffer = buffer;

        src.connect(this.context.destination);

        src.start(this.context.currentTime);
    }

    this.osc_sin = function (freq) {
        return function (t) { return Math.sin(freq(t) / this.context.samplingRate * 2 * Math.PI * t); }
    }

    this.osc_saw = function (freq)
    {
        return function (t) { var p = t % (this.context.samplingRate / freq(t)); return 1 - 2 * p / freq(t); }
    }

    this.sequence_freq = function (seq, bmp)
    {
        var nt = this.context.samplingRate * 60 / (bmp * 4); // 1/4

        return function (t) { var p = t / nt; return note(seq[(p % seq.length).toFixed(0)]); }
    }
}







var ts = new TipSound();
//document.querySelector("#play").addEventListener("click", function () { ts.play(mix(osc_sin(constant(440), constant(44100)), osc_sin(constant(440 * 1.26), constant(44100)), osc_sin(constant(440 * 1.498), constant(44100))), 1.0); }, false);
//document.querySelector("#play").addEventListener("click", function () { ts.play(mix(ts.osc_saw(constant(440)), ts.osc_saw(constant(440*1.26)), ts.osc_saw(constant(440*1.498))), 1.0); }, false);
//document.querySelector("#play").addEventListener("click", function () { ts.play(ts.osc_saw(constant(440 / 2)), 1.0); }, false);
//document.querySelector("#play").addEventListener("click", function () { ts.play(mix(ts.osc_saw(constant(note(25))), ts.osc_saw(constant(note(25+4))), ts.osc_saw(constant(note(25+4+3)))), 1.0); }, false);

document.querySelector("#play").addEventListener("click", function () { ts.play(ts.osc_saw(ts.sequence_freq([5, 25, 5, 25, 4, 16, 13, 4], 120)), 1.0); }, false);
