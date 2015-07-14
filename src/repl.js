require(['knockout-3.3.0', 'tipsound', 'domReady!'], function (ko, ts) {
	// view model
	var self = {
			code: ko.observable("return ts.parseChord('C');"),
			result: ko.observable(),
			exec: function() { self.result(JSON.stringify((new Function("ts", "self", self.code()))(ts, self), null, 4)); }
	};
	
    ko.applyBindings(self);
});