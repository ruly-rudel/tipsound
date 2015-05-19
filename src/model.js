define(['tipsound'], function (ts) {	// model
    "use strict";
    var asynth = null;

    //
    // model constructor
    return function () {
        this.build = function (v, f, q) {
            asynth = ts.ModAsynth();
            
            asynth.parameter.gain(v);
            
            asynth.parameter.asynth1.env.attack = 0.0;
            asynth.parameter.asynth1.env.decay = 0.4;
            asynth.parameter.asynth1.env.sustain = 0.0;
            asynth.parameter.asynth1.env.release = 0.0;
            
            asynth.parameter.asynth1.bqf.freqScale(f);
            asynth.parameter.asynth1.bqf.Q(q);

            asynth.connect(ts.ctx.destination);
            this.parameter = asynth.parameter;
        };

        this.play = function (note) {
            return asynth.start(ts.ctx.currentTime, note);
        };

        this.playChord = function (c) {
            var ca = c.split(/\s/);
            var seq = ts.chordToSequence(ca, ts.closedVoicing);
            var noteOff = 2.0;

            for (var j = 0; j < seq.length; j++) {
                for (var i = 0; i < seq[j].length; i++) {
                    if (seq[j][i] !== null) {
                        asynth.start(ts.ctx.currentTime + i, seq[j][i])
                              .stop(ts.ctx.currentTime + i + noteOff);
                    }
                }
            }
        };

    };
});
