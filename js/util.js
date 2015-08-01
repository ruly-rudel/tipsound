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
    
    that.ArrayReader = function(ab) {
        var that = {};
        var b = new Uint8Array(ab);
        var pos = 0;
        
        that.readStringF = function(n)
        {
            var buf = [];
            var term = false;
            for(var i = 0; i < n; i++) {
                var val = b[pos++]
                if(val == 0 || val == 4) {
                    term = true;
                }
                if(!term) {
                    buf.push(val);
                }
            }
            return String.fromCharCode.apply(null, buf);
        }
        
        that.readInt8 = function()
        {
            var i = readInt(1);
            if(i > 127) {
                return i - 256;
            } else {
                return i;
            }
        }

        that.readUInt8 = function()
        {
            return readInt(1);
        }
        
        that.readInt16 = function()
        {
            var i = readInt(2);
            if(i > 32767) {
                return i - 65536;
            } else {
                return i;
            }
        }
        
        that.readUInt16 = function()
        {
            return readInt(2);
        }
                
        that.readUInt32 = function()
        {
            return readInt(4);
        }
        
        that.seek = function(n) {
            pos = n;
            return pos;
        }
        
        that.position = function() { return pos; }
        
        that.subarray = function(be, en) { return b.subarray(be, en); }
        
        var readInt = function(n)
        {
            var result = 0;
            for(var i = 0; i < n; i++) {
                //result = result * 32 + b[pos++];  // in big endian
                result += b[pos++] * Math.pow(256, i);
            }
            return result;
        }
        
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