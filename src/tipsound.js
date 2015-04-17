
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

function note(n, octave) {
    return Math.pow(2, (n - 33 + (12 * (octave || 0))) / 12) * 440;
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
    }

    that.osc_sin = function (freq) {
        return function (t) { return Math.sin(freq(t) / srate * 2 * Math.PI * t); }
    }

    that.osc_saw = function (freq)
    {
        return function (t) { var p = t % (srate / freq(t)); return 1 - 2 * p / freq(t); }
    }

    that.sequence_freq = function (seq, bmp)
    {
        var nt = srate * 60 / (bmp * 4); // 1/4

        return function (t) { var p = t / nt; return note(seq[(p % seq.length).integer()]); }
    }

    return that;
}







var ts = tipsound();
//document.querySelector("#play").addEventListener("click", function () { ts.play(mix(osc_sin(constant(440), constant(44100)), osc_sin(constant(440 * 1.26), constant(44100)), osc_sin(constant(440 * 1.498), constant(44100))), 1.0); }, false);
//document.querySelector("#play").addEventListener("click", function () { ts.play(mix(ts.osc_saw(constant(440)), ts.osc_saw(constant(440*1.26)), ts.osc_saw(constant(440*1.498))), 1.0); }, false);
//document.querySelector("#play").addEventListener("click", function () { ts.play(ts.osc_saw(constant(440 / 2)), 1.0); }, false);
//document.querySelector("#play").addEventListener("click", function () { ts.play(mix(ts.osc_saw(constant(note(25))), ts.osc_saw(constant(note(25+4))), ts.osc_saw(constant(note(25+4+3)))), 1.0); }, false);

document.querySelector("#play").addEventListener("click", function () { ts.play(ts.osc_saw(ts.sequence_freq([5, 25, 5, 25, 4, 16, 13, 4], 120)), 1.0); }, false);
