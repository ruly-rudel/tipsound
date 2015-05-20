define(['tipsound'], function (ts) {	// model
    "use strict";
    var that = {};
    
    var asynth = null;

    that.build = function () {
        asynth = ts.ModPoly(ts.ModAsynth);

        asynth.parameter.mono.env.attack = 0.0;
        asynth.parameter.mono.env.decay = 0.4;
        asynth.parameter.mono.env.sustain = 0.0;
        asynth.parameter.mono.env.release = 0.0;

        asynth.connect(ts.ctx.destination);
        that.parameter = asynth.parameter;
    };

    that.play = function (note) {
        asynth.parameter.mono.osc.frequency(note);
        return asynth.start(ts.ctx.currentTime);
    };

    that.playChord = function (c) {
        var ca = c.split(/\s/);
        var seq = ts.chordToSequence(ca, ts.closedVoicing);
        var noteOff = 2.0;

        for (var j = 0; j < seq.length; j++) {
            for (var i = 0; i < seq[j].length; i++) {
                if (seq[j][i] !== null) {
                    asynth.parameter.mono.osc.frequency(seq[j][i]);
                    asynth.start(ts.ctx.currentTime + i)
                        .stop(ts.ctx.currentTime + i + noteOff);
                }
            }
        }
    };
    
    return that;
});
