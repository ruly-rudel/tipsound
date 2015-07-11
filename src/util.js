define(function () {
    "use strict";
    
    // utility functions
    var that = {};

    that.map = Array.prototype.map;
    that.reduce = Array.prototype.reduce;

    that.mapcar = function (fn, lists) // ad-hock: assume all list lengths are the same. maybe fixed after.
    {
        var r = [];
        for (var i = 0; i < lists[0].length; i++) {
            var tr = [];
            for (var j = 0; j < lists.length; j++) {
                tr.push(lists[j][i]);
            }
            r.push(fn.apply(null, tr));
        }

        return r;
    };
    
    that.hreduce = function (fn, list)
    {
        var sum = undefined;
        for(var key in list) {
            if(sum === undefined) {
                sum = list[key];
            } else {
                sum = fn(sum, list[key]);
            }
        }
        
        return sum;
    };
    
    that.hmap = function (fn, list)
    {
        var r = [];
        for(var key in list) {
            r.push(fn(list[key], key));
        }
        
        return r;
    };

    that.compose = function (f, g) {
        return function () {
            return f.call(this, g.apply(this, arguments));
        };
    };
    
    that.Observable = function (v) {
        var subscriber = [];
        var value = v;

        var that = function () {
            if (arguments.length == 1) {  // update
                value = arguments[0];
                subscriber.map(function (s) { if(s) s(value); });
            }

            return value;
        };

        that.subscribe = function (callback) {
            subscriber.push(callback);

            return {
                dispose: function() {
                    subscriber[subscriber.indexOf(callback)] = null;    // ad-hock: must be removed from array
                }
            };
        };

        return that;
    };
    
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

    return that;
});