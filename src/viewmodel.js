// Main viewmodel class
define(['knockout-3.3.0'], function(ko) {
    return function viewmodel() {
        var ctx = new AudioContext();
        var osc = null;
        var gain = null;


		this.volume = ko.observable(1.0);
        this.volume.subscribe(function(v) { if(gain) gain.gain.value = v; });   // maybe not good
        
        this.play = function()
        {
            osc = ctx.createOscillator();
            gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            gain.gain.value = this.volume();
            osc.start(ctx.currentTime);
        };
        this.stop = function()
        {
            osc.disconnect();
            gain.disconnect();
            osc = null;
            gain = null;
        };
    };
});