define(['util'], function (util) {
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
            that.sfbk.pdta.child.inst.data = [];
            that.sfbk.pdta.child.ibag.data = [];
            that.sfbk.pdta.child.igen.data = [];
            that.sfbk.pdta.child.shdr.data = [];
        };
        
        that.readPreset = function(n) {
            var phdr = that.sfbk.pdta.child.phdr;
            var pbag = that.sfbk.pdta.child.pbag;
            
            var r = {
                presetName: phdr.data[n].presetName,
                preset: phdr.data[n].preset,
                bank: phdr.data[n].bank
            }
            
            // PBAGs
            r.pbag = {
                pgen: [],
                pmod: []
            };
            for(var i = phdr.data[n].presetBagNdx; i < phdr.data[n + 1].presetBagNdx; i++) {
                var pbag0 = parsePBAG1(ar, pbag, i);
                var pbag1 = parsePBAG1(ar, pbag, i + 1);
                r.pbag.pgen.push(createHashGenFromPgenArray(readPGEN1(pbag0.genNdx, pbag1.genNdx)));
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
        
        var readPGEN1 = function(b, e) {
            var pgen = that.sfbk.pdta.child.pgen;
            var result = [];
            if(b != e) {
                for(var i = b; i < e; i++) {
                    var r = {
                        "pgen": parsePGEN1(ar, pgen, i)
                    }
                    if(r.pgen.inst == "instrument") {
                        r.inst = readINST1(r.pgen.genAmount);
                    }
                    
                    result.push(r);
                }                
            }
            
            return result;
        };
        
        var readINST1 = function(i) {
            var inst = that.sfbk.pdta.child.inst;
            var ibag = that.sfbk.pdta.child.ibag;
            var inst0 = parseINST1(ar, inst, i);
            var inst1 = parseINST1(ar, inst, i + 1);
            
            var r = {
                "instName": inst0.instName
            };
            
            // IBAGs
            r.ibag = {
                igen: [],
                imod: []
            };
            for(var i = inst0.instBagNdx; i < inst1.instBagNdx; i++) {
                var ibag0 = parseIBAG1(ar, ibag, i);
                var ibag1 = parseIBAG1(ar, ibag, i + 1);
                
                r.ibag.igen.push(
                    createHashGenFromIgenArray(
                        readIGEN1(ibag0.instGenNdx, ibag1.instGenNdx)));                
            }
            
            return r;
        }
        
        var createHashGenFromIgenArray = function(igens) {
            var hash = {};
            igens.forEach(function(igen) {
                hash[igen.igen.inst] = igen.igen.genAmount;
                if(igen.igen.inst == 'sampleID') {
                    hash['shdr'] = igen.shdr;
                }
            });
            
            return hash;
        }
        
        var createHashGenFromPgenArray = function(pgens) {
            var hash = {};
            pgens.forEach(function(pgen) {
                hash[pgen.pgen.inst] = pgen.pgen.genAmount;
                if(pgen.pgen.inst == 'instrument') {
                    hash['instrument'] = pgen.inst;
                }
            });
            
            return hash;
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
                data.genAmount = ar.readInt16();
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