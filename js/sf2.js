define(['js/util'], function (util) {
    "use strict";

    var sf2 = {};
    
    sf2.createFromArrayBuffer = function(ab) {
        var that = {
            riffHeader: null,
            sfbk: {}
        };
        
        var ar = util.ArrayReader(ab);
        
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
            that.sfbk.pdta.child.pmod.data = [];
            that.sfbk.pdta.child.inst.data = [];
            that.sfbk.pdta.child.ibag.data = [];
            that.sfbk.pdta.child.igen.data = [];
            that.sfbk.pdta.child.imod.data = [];
            that.sfbk.pdta.child.shdr.data = [];
        };
        
        that.readPreset = function(n) {
            var phdr = that.sfbk.pdta.child.phdr;
            var pbag = that.sfbk.pdta.child.pbag;
            
            var r = {
                presetName: phdr.data[n].presetName,
                preset: phdr.data[n].preset,
                bank: phdr.data[n].bank,
                gen: [],
                mod: []
            }
            
            // PBAGs
            var pgen_global = {
                keyRange: { lo: 0, hi: 127 },
                velRange: { lo: 1, hi: 127 }                
            };
            var pmod_global = [];
            for(var i = phdr.data[n].presetBagNdx; i < phdr.data[n + 1].presetBagNdx; i++) {
                var pbag0 = parsePBAG1(ar, pbag, i);
                var pbag1 = parsePBAG1(ar, pbag, i + 1);
                var pmod = readPMOD1(pbag0.modNdx, pbag1.modNdx, pmod_global);
                var pmod_local = Array.prototype.concat(pmod_global, pmod);
                var pgen = readPGEN1(pbag0.genNdx, pbag1.genNdx, pgen_global, pmod_local);
                if(pgen["instrument"] === undefined) {
                    pgen_global = pgen;
                    pmod_global = pmod;
                } else {
                    r.gen = Array.prototype.concat(r.gen, pgen.instrument.ibag.igen);
                    r.mod = Array.prototype.concat(r.mod, pgen.instrument.ibag.imod);
                }
//                r.mod.push(readPMOD1(pbag0.modNdx, pbag1.modNdx));
            }
            
            return r;
        };
        
        that.enumPresets = function() {
            var p = [];
            var phdr = that.sfbk.pdta.child.phdr;
            phdr.data.forEach(function(ph) { p.push(ph.presetName); });
            
            return p;
        };
        
        that.readSDTA = function(pos) {
            ar.seek(that.sfbk.sdta.child.smpl.headPosition + pos * 2);
            return ar.readInt16() / 32768;
        }
        
        that.readSDTAChunk = function(b, e) {
            return new Int16Array(new Uint8Array(ar.subarray(
                that.sfbk.sdta.child.smpl.headPosition + b * 2,
                that.sfbk.sdta.child.smpl.headPosition + e * 2                
            )).buffer);
        }
        
        var readPGEN1 = function(b, e, g, gm) {
            var pgen = that.sfbk.pdta.child.pgen;
            var global = _.O(g, true);
            var global_m = _.O(gm, true);
            var result = _.O(g, true);
            if(b != e) {
                for(var i = b; i < e; i++) {
                    var r = parsePGEN1(ar, pgen, i);
                    if(r.inst == "instrument") {
                        global = _.O(result, true);
                        result[r.inst] = readINST1(r.genAmount, global, global_m);
                    } else {
                        result[r.inst] = r.genAmount;
                    }                    
                }                
            }
            
            return result;
        };
        
        var readPMOD1 = function(b, e, g) {
            var pmod = that.sfbk.pdta.child.pmod;
            var result = _.O(g, true);
            if(b != e) {
                for(var i = b; i < e; i++) {
                    result.push(parseMOD1(ar, pmod, i));
                }                
            }
            
            return result;
        };
        
        var readINST1 = function(i, g, gm) {
            var inst = that.sfbk.pdta.child.inst;
            var ibag = that.sfbk.pdta.child.ibag;
            var inst0 = parseINST1(ar, inst, i);
            var inst1 = parseINST1(ar, inst, i + 1);
            
            var r = {
                "instName": inst0.instName
            };
            var global = _.O(g, true);
            var global_m = _.O(gm, true);
            
            // IBAGs
            r.ibag = {
                igen: [],
                imod: []
            };
            for(var i = inst0.instBagNdx; i < inst1.instBagNdx; i++) {
                var ibag0 = parseIBAG1(ar, ibag, i);
                var ibag1 = parseIBAG1(ar, ibag, i + 1);
                
                var igen = readIGEN1(ibag0.instGenNdx, ibag1.instGenNdx, global);
                var imod = readIMOD1(ibag0.instModNdx, ibag1.instModNdx, global_m);
                if(igen["sampleID"] === undefined) {    // global parameter
                    global = igen;
                    global_m = imod;
                } else {
                    r.ibag.igen.push(igen);
                    r.ibag.imod.push(imod);
                }
            }
            
            return r;
        }
                
        var readIGEN1 = function(b, e, g) {
            var igen = that.sfbk.pdta.child.igen;
            var result = _.O(g, true);
            for(var i = b; i < e; i++) {
                var r = parseIGEN1(ar, igen, i);
                result[r.inst] = r.genAmount;
                if(r.inst == "sampleID") {
                    result.shdr = readSHDR1(r.genAmount);
                }
            }
            
            return result;
        };
        
        var readIMOD1 = function(b, e, g) {
            var imod = that.sfbk.pdta.child.imod;
            var result = _.O(g, true);
            if(b != e) {
                for(var i = b; i < e; i++) {
                    result.push(parseMOD1(ar, imod, i));
                }                
            }
            
            return result;
        };
        
        var readSHDR1 = function(i) {
            var shdr = that.sfbk.pdta.child.shdr;            
            var r = parseSHDR1(ar, shdr, i);
            
            r.end -= r.start;
            r.startloop -= r.start;
            r.endloop -= r.start;
            r.sample = new Float32Array(r.end);
            ar.seek(that.sfbk.sdta.child.smpl.headPosition + r.start * 2)
            for(var j = 0; j < r.end; j++) {
                r.sample[j] = ar.readInt16() / 32768;
            }
            r.start = 0;
            
            return r;            
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
                data.genAmount = ar.readInt16();
            }
            
            root.data[i] = data;
                
            return data;
        };
        
        var parseMOD1 = function(ar, root, i) {
            ar.seek(root.headPosition + i * 10);

            var data = {};
            data.modSrcOper = { };
            data.modSrcOper.index = ar.readUInt8();
            data.modSrcOper.type  = ar.readUInt8();
            data.modDestOper = ar.readUInt16();
            data.modDestInst = sfGenerator[data.modDestOper];
            data.modAmount = ar.readInt16();
            data.modAmtSrcOper = {};
            data.modAmtSrcOper.index = ar.readUInt8();
            data.modAmtSrcOper.type  = ar.readUInt8();
            data.modTransOper = ar.readUInt16();
            
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
                data.genAmount = ar.readInt16();
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
    
    return sf2;
});