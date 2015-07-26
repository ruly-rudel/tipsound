require(['knockout-3.3.0', 'tipsound', 'util', 'sf2', 'domReady!'], function (ko, ts, util, SF2) {
	// view model
	var self = {
			//code: ko.observable("return ts.parseChord('C');"),
			code: ko.observable(
				"_.XB('http://gauzau.s30.xrea.com/A320U.sf2', function(r) {\n" +
//				"    var ar = util.ArrayReader(r);\n" +
				"    var sf2 = SF2.createFromArrayBuffer(r);\n" +
				"    sf2.parseHeader();\n" +
//				"    console.log(JSON.stringify(sf2.riffHeader, null, 4));\n" +
//				"    console.log(JSON.stringify(sf2.sfbk, null, 4));\n" +
				"    console.log(JSON.stringify(sf2.readPreset(0), null, 4));\n" +
				"});\n" +
				"return 'finish';\n"
				/*
				"fg = ts.FilterGraph();\n" +
	            "fg.register(\"asynth\", ts.ModPoly(ts.ModAsynth));\n" +
	            "fg.register(\"seq\", ts.ModPolySeq());\n\n" +
	    
	            "fg.connect(\"seq\", \"asynth\");\n" +
	            "fg.connect(\"asynth\", \"destination\");\n\n" +
	            
	            "fg.module.asynth.parameter.mono.env.attack = 0.0;\n" +
	            "fg.module.asynth.parameter.mono.env.decay = 0.4;\n" +
	            "fg.module.asynth.parameter.mono.env.sustain = 0.0;\n" +
	            "fg.module.asynth.parameter.mono.env.release = 0.0;\n\n" +
	            "fg.module.asynth.parameter.mono.bqf.freqScale = 1.6;\n" +
	            "fg.module.asynth.parameter.mono.bqf.Q = 0.0001;\n\n" +
	    
				'fg.module.seq.parameter.sequence = ts.chordToSequence(["C", "G"], ["R3", "z", "[RTFS]3", "z"], 120);\n' +
				"return fg.invoke(ts.ctx.currentTime);"
				*/
			),
			result: ko.observable(),
			exec: function() { self.result(JSON.stringify((new Function("ts", "util", "SF2", "self", self.code()))(ts, util, SF2, self), null, 4)); }
	};
	
    ko.applyBindings(self);
});