define(function() {	// model
    var ctx = new AudioContext();
    var osc = null;
    var gain = null;

	return function() {
		this.play = function(v)
        {
            osc = ctx.createOscillator();
            gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            this.setGain(v);
            osc.start(ctx.currentTime);
        };
        this.stop = function()
        {
            osc.disconnect();
            gain.disconnect();
            osc = null;
            gain = null;
        };
        this.setGain = function(g)
        {
            if(gain)
                gain.gain.value = g; 
        };
	};
});