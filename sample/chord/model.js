define(['js/tipsound'], function (ts) {	// model
    "use strict";
    var that = {};
    that.ts = ts;
    
    var fg = ts.FilterGraph();

    that.build = function (code, vm) {
        (new Function("ts", "fg", "vm", code))(ts, fg, vm);
        that.parameter = {};
        for(var key in fg.module) {
            that.parameter[key] = fg.module[key].parameter;
        }
        /*
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
        */
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

    that.play = function () {
        fg.invoke(ts.ctx.currentTime);
    };

    that.stop = function() {
        fg.post({ inst: "stop" });
    };

    return that;
});
