require(['knockout-3.3.0', 'tipsound', 'domReady!'], function (ko, ts) {
	// view model
	var self = {
			//code: ko.observable("return ts.parseChord('C');"),
			code: ko.observable(
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
	    
				'fg.module.seq.parameter.sequence = ts.voiceToSequence(["C", "G"], ["R", "z", "[RTFS]", "z"], 120);\n' +
				"return fg.invoke(ts.ctx.currentTime);"
			),
			result: ko.observable(),
			exec: function() { self.result(JSON.stringify((new Function("ts", "self", self.code()))(ts, self), null, 4)); }
	};
	
    ko.applyBindings(self);
});