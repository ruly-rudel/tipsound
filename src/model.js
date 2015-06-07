define(['tipsound'], function (ts) {	// model
    "use strict";
    var that = {};
    that.ts = ts;

    var asynth = null;
    var kick = null;
    var seq = null;

    that.build = function () {
        asynth = ts.ModPoly(ts.ModAsynth);

        asynth.parameter.mono.env.attack = 0.0;
        asynth.parameter.mono.env.decay = 0.4;
        asynth.parameter.mono.env.sustain = 0.0;
        asynth.parameter.mono.env.release = 0.0;

        asynth.connect(ts.ctx.destination);
        that.parameter = asynth.parameter;
        
        seq = ts.ModPolySeq();
        seq.connect(asynth);

        kick = ts.ModPoly(ts.ModBuffer);
        kick.parameter.mono.buffer = ts.ctx.createBuffer(1, ts.ctx.sampleRate * 1, ts.ctx.sampleRate);

        var channel = kick.parameter.mono.buffer.getChannelData(0);
        var x = 48;
        var y = 50;
        var z = 8;
        for (var i = 0; i < channel.length; i++) {
            channel[i] = Math.sin(x * (Math.exp(-i / ts.ctx.sampleRate * y))) * Math.exp(-i / ts.ctx.sampleRate * z);
        }
        kick.connect(ts.ctx.destination);
    };

    that.play = function (abc) {
        var seq = ts.abcToSequence(abc);
        var an = {};
        for (var i = 0; i < seq.length; i++) {
            switch (seq[i].inst) {
                case "noteOn":
                    an[seq[i].note] = asynth.start(ts.ctx.currentTime + seq[i].time, seq[i].note);
                    break;
                case "noteOff":
                    an[seq[i].note].stop(ts.ctx.currentTime + seq[i].time);
                    an[seq[i].note] = null;
                    break;
                default:
                    throw new Error();
            }
        }
    };

    that.playChord = function (c, c2s, voice, br) {
        var ca = c.split(/[\s|]/).filter(function (s) { return s != ""; });
        seq.sequence = c2s(ca, voice, br);
        var t = ts.ctx.currentTime;
        seq.invoke(t);
        /*
        var max = Math.max.apply(null, seq.sequence.map(function(x) { return x.time; }));
        for(var i = 0; i < max; i += 0.0015) {
            seq.enque(t + i);
        }
        */
        /*
        var kickseq = ts.chordToKick(ca);

        var kn = {};
        for (i = 0; i < kickseq.length; i++) {
            switch (kickseq[i].inst) {
                case "noteOn":
                    kn[kickseq[i].note] = kick.start(ts.ctx.currentTime + kickseq[i].time);
                    break;
                case "noteOff":
                    kn[kickseq[i].note].stop(ts.ctx.currentTime + kickseq[i].time);
                    kn[kickseq[i].note] = null;
                    break;
                default:
                    throw new Error();
            }
        }
        */
    };
    

    that.recycle = function () {
        asynth.recycle(ts.ctx.currentTime);
    };

    return that;
});
