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
    
    that.SF2 = function(ar)
    {
        var that = {
            riffHeader: null,
            sfbk: {}
        };
        
        var sfGenerator = [
            "startAddrsOffset",         // 0
            "endAddrsOffset",           // 1
            "startloopAddrsOffset",     // 2    
            "endloopAddrsOffset",       // 3
            "startAddrsCoarseOffset",   // 4
            "modLfoToPitch",            // 5
            "vibLfoToPitch",            // 6
            "modEnvToPitch",            // 7
            "initialFilterFc",          // 8
            "initialFilterQ",           // 9
            "modLfoToFilterFc",         // 10
            "modEnvToFilterFc",         // 11
            "endAddrsCoarseOffset",     // 12
            "modLfoToVolume",           // 13
            "unused1",
            "chorusEffectsSend",        // 15
            "reverbEffectsSend",        // 16
            "pan",                      // 17
            "unused2",
            "unused3",
            "unused4",
            "delayModLFO",              // 21
            "freqModLFO",               // 22
            "delayVibLFO",              // 23
            "freqVibLFO",               // 24
            "delayModEnv",              // 25
            "attackModEnv",             // 26
            "holdModEnv",               // 27
            "decayModEnv",              // 28
            "sustainModEnv",            // 29
            "releaseModEnv",            // 30
            "keynumToModEnvHold",       // 31
            "keynumToModEnvDecay",      // 32
            "delayVolEnv",              // 33
            "attackVolEnv",             // 34
            "holdVolEnv",               // 35
            "decayVolEnv",              // 36
            "sustainVolEnv",            // 37
            "releaseVolEnv",            // 38
            "keynumToVolEnvHold",       // 39
            "keynumToVolEnvDecay",      // 40
            "instrument",               // 41: PGEN Terminator
            "reserved1",
            "keyRange",                 // 43
            "velRange",                 // 44
            "startloopAddrsCoarseOffset",   // 45
            "keynum",                   // 46
            "velocity",                 // 47
            "initialAttenuation",       // 48
            "reserved2",
            "endloopAddrsCoarseOffset", // 50
            "coarseTune",               // 51
            "fineTune",                 // 52
            "sampleID",                 // 53: IGEN Terminator
            "sampleModes",              // 54
            "reserved3",
            "scaleTuning",              // 56
            "exclusiveClass",           // 57
            "overridingRootKey",        // 58
            "unused5",
            "endOper"
        ];
        
        that.parseHeader = function () {
            // read RIFF header
            that.riffHeader = parseHeader();
            that.size = that.riffHeader.length + 8;
            
            // read level1 header
            ar.seek(that.riffHeader.headPosition);
            that.sfbk = {};
            that.sfbk.ID = ar.readStringF(4);
            
            // read level2 header
            that.sfbk.INFO = parseHeader();
            
            // read level3 header
            // 3.1 INFO
            ar.seek(that.sfbk.INFO.headPosition);
            that.sfbk.INFO.ID = ar.readStringF(4);
            that.sfbk.INFO.child = {};
            while(ar.position() < that.sfbk.INFO.headPosition + that.sfbk.INFO.length) {
                var head = parseHeader();
                that.sfbk.INFO.child[head.ID] = head;
            }
            
            // 3.2 sdta
            ar.seek(that.sfbk.INFO.headPosition + that.sfbk.INFO.padLength);
            that.sfbk.sdta = parseHeader();
            
            ar.seek(that.sfbk.sdta.headPosition);            
            that.sfbk.sdta.ID = ar.readStringF(4);
            that.sfbk.sdta.child = {};
            while(ar.position() < that.sfbk.sdta.headPosition + that.sfbk.sdta.length) {
                head = parseHeader();
                that.sfbk.sdta.child[head.ID] = head;
            }
            
            // 3.3 pdta
            ar.seek(that.sfbk.sdta.headPosition + that.sfbk.sdta.padLength);
            that.sfbk.pdta = parseHeader();
            
            ar.seek(that.sfbk.pdta.headPosition);            
            that.sfbk.pdta.ID = ar.readStringF(4);
            that.sfbk.pdta.child = {};
            while(ar.position() < that.sfbk.pdta.headPosition + that.sfbk.pdta.length) {
                head = parseHeader();
                that.sfbk.pdta.child[head.ID] = head;
            }
            
            // read level4 data
            // 4.1 PHDR data
            var phdr = that.sfbk.pdta.child.phdr;
            phdr.data = [];
            ar.seek(phdr.headPosition);
            while(ar.position() < phdr.headPosition + phdr.length) {
                var data = {};
                data.presetName = ar.readStringF(20);
                data.preset = ar.readUInt16();
                data.bank = ar.readUInt16();
                data.presetBagNdx = ar.readUInt16();
                data.library = ar.readUInt32();
                data.genre = ar.readUInt32();
                data.morphology = ar.readUInt32();
                phdr.data.push(data);
            }
            
            // set placeholder
            that.sfbk.pdta.child.pbag.data = [];
            that.sfbk.pdta.child.pgen.data = [];
            that.sfbk.pdta.child.inst.data = [];
            that.sfbk.pdta.child.ibag.data = [];
            that.sfbk.pdta.child.igen.data = [];
            that.sfbk.pdta.child.shdr.data = [];
            
            /*
            // 4.2 PBAG data
            var pbag = that.sfbk.pdta.child.pbag;
            pbag.data = [];
            while(ar.position() < pbag.headPosition + pbag.length) {
                parsePBAG1(ar, pbag, pbag.data.length);
            }
            
            // 4.4 PGEN data
            var pgen = that.sfbk.pdta.child.pgen;
            pgen.data = [];
            while(ar.position() < pgen.headPosition + pgen.length) {
                parsePGEN1(ar, pgen, pgen.data.length);
            }
            
            // 4.5 INST data
            var inst = that.sfbk.pdta.child.inst;
            inst.data = [];
            while(ar.position() < inst.headPosition + inst.length) {
                parseINST1(ar, inst, inst.data.length);
            }
            
            // 4.6 IBAG data
            var ibag = that.sfbk.pdta.child.ibag;
            ibag.data = [];
            while(ar.position() < ibag.headPosition + ibag.length) {
                parseIBAG1(ar, ibag, ibag.data.length);
            }
            
            // 4.8 IGEN data
            var igen = that.sfbk.pdta.child.igen;
            igen.data = [];
            while(ar.position() < igen.headPosition + igen.length) {
                parseIGEN1(ar, igen, igen.data.length);
            }            
                                    
            // 4.9 SHDR data
            var shdr = that.sfbk.pdta.child.shdr;
            shdr.data = [];
            while(ar.position() < shdr.headPosition + shdr.length) {
                parseSHDR1(ar, shdr, shdr.data.length);
            }
            */
        };
        
        that.readPreset = function(n) {
            var phdr = that.sfbk.pdta.child.phdr;
            var pbag = that.sfbk.pdta.child.pbag;
            
            var r = {
                phdr: phdr.data[n]
            }
            
            // PBAGs
            r.pbag = [];
            for(var i = phdr.data[n].presetBagNdx; i < phdr.data[n + 1].presetBagNdx; i++) {
                var pbag0 = parsePBAG1(ar, pbag, i);
                var pbag1 = parsePBAG1(ar, pbag, i + 1);
                r.pbag.push({
                    "pbag": pbag0,
                    "pgen": readPGEN1(pbag0.genNdx, pbag1.genNdx)
                });
                
                r.pbag.push();
            }
            
            return r;
        };
        
        var readPGEN1 = function(b, e) {
            var pgen = that.sfbk.pdta.child.pgen;
            var result = [];
            for(var i = b; i < e; i++) {
                var r = {
                    "pgen": parsePGEN1(ar, pgen, i)
                }
                if(r.pgen.inst == "instrument") {
                    r.inst = readINST1(r.pgen.genAmount);
                }
                
                result.push(r);
            }
            
            return result;
        };
        
        var readINST1 = function(i) {
            var inst = that.sfbk.pdta.child.inst;
            var ibag = that.sfbk.pdta.child.ibag;
            var inst0 = parseINST1(ar, inst, i);
            var inst1 = parseINST1(ar, inst, i + 1);
            
            var r = {
                "inst": inst0
            };
            
            // IBAGs
            r.ibag = [];
            for(var i = inst0.instBagNdx; i < inst1.instBagNdx; i++) {
                var ibag0 = parseIBAG1(ar, ibag, i);
                var ibag1 = parseIBAG1(ar, ibag, i + 1);
                
                r.ibag.push({
                    "ibag": ibag0,
                    "igen": readIGEN1(ibag0.instGenNdx, ibag1.instGenNdx)
                });                
            }
            
            return r;
        }
        
        var readIGEN1 = function(b, e) {
            var igen = that.sfbk.pdta.child.igen;
            var result = [];
            for(var i = b; i < e; i++) {
                var r = {
                    "igen": parseIGEN1(ar, igen, i)
                };
                if(r.igen.inst == "sampleID") {
                    r.shdr = readSHDR1(r.igen.genAmount);
                }
                
                result.push(r);
            }
            
            return result;            
        };
        
        var readSHDR1 = function(i) {
            var shdr = that.sfbk.pdta.child.shdr;
            
            return parseSHDR1(ar, shdr, i);
        };
                
        var parseHeader = function(){
            var h = {};
            h.ID = ar.readStringF(4);
            h.length = ar.readUInt32();
            h.padLength = h.length % 2 == 1 ? h.length + 1 : h.length;
            h.headPosition = ar.position();
            ar.seek(ar.position() + h.padLength);
            
            return h;
        };
        
        var parsePBAG1 = function(ar, root, i) {
            ar.seek(root.headPosition + i * 4);

            var data = {};
            data.genNdx = ar.readUInt16();
            data.modNdx = ar.readUInt16();
            
            root.data[i] = data;
                
            return data;
        };
               
        var parsePGEN1 = function(ar, root, i) {
            ar.seek(root.headPosition + i * 4);

            var data = {};
            data.genOper   = ar.readUInt16();
            data.inst      = sfGenerator[data.genOper];
            if(data.inst == 'keyRange' ||
               data.inst == 'velRange' ||
               data.inst == 'keynum' ||
               data.inst == 'velocity') {                   
                data.genAmount = {};
                data.genAmount.lo = ar.readUInt8();
                data.genAmount.hi = ar.readUInt8();                
            } else {
                data.genAmount = ar.readUInt16();
            }
            
            root.data[i] = data;
                
            return data;
        };

        var parseINST1 = function(ar, root, i) {
            ar.seek(root.headPosition + i * 22);

            var data = {};
            data.instName = ar.readStringF(20);
            data.instBagNdx = ar.readUInt16();
            
            root.data.push(data);
                
            return data;
        };
        
        var parseIBAG1 = function(ar, root, i) {
            ar.seek(root.headPosition + i * 4);

            var data = {};
            data.instGenNdx = ar.readUInt16();
            data.instModNdx = ar.readUInt16();
            
            root.data.push(data);
                
            return data;
        };
                
        var parseIGEN1 = function(ar, root, i) {
            ar.seek(root.headPosition + i * 4);
            
            var data = {};
            data.genOper   = ar.readUInt16();
            data.inst      = sfGenerator[data.genOper];
            if(data.inst == 'keyRange' ||
               data.inst == 'velRange' ||
               data.inst == 'keynum' ||
               data.inst == 'velocity') {                   
                data.genAmount = {};
                data.genAmount.lo = ar.readUInt8();
                data.genAmount.hi = ar.readUInt8();                
            } else {
                data.genAmount = ar.readUInt16();
            }
            
            root.data.push(data);
                
            return data;
        };
        
        var parseSHDR1 = function(ar, root, i) {
            ar.seek(root.headPosition + i * 46);
            
            var data = {};
            data.sampleName = ar.readStringF(20);
            data.start = ar.readUInt32();
            data.end = ar.readUInt32();
            data.startloop = ar.readUInt32();
            data.endloop = ar.readUInt32();
            data.sampleRate = ar.readUInt32();
            data.originalPitch = ar.readUInt8();
            data.pitchCorrection = ar.readInt8();
            data.sampleLink = ar.readUInt16();
            data.sampleType = ar.readUInt16();
            
            root.data.push(data);
                
            return data;
        };
        
        return that;
    }
    
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