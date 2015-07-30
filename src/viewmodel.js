// Main viewmodel class
define(['knockout-3.3.0', 'model', 'sf2'], function (ko, model, SF2) {
    "use strict";

    return function () { // ViewModel constructor
        var self = this;
        
        this.prepared = ko.observable(false);
        
        _.XB('http://gauzau.s30.xrea.com/A320U.sf2', function(r) {
            self.sf2 = SF2.createFromArrayBuffer(r);
            self.sf2.parseHeader();
            self.prepared(true);
        });
        
        this.synth = ko.observable(
            "var p = vm.sf2.readPreset(52);\n" +
            "var buf1 = ts.ctx.createBuffer(1, p.gen[1].shdr.end, p.gen[1].shdr.sampleRate);\n" +
            "buf1.copyToChannel(p.gen[1].shdr.sample, 0);\n" +
            "var buf2 = ts.ctx.createBuffer(1, p.gen[2].shdr.end, p.gen[2].shdr.sampleRate);\n" +
            "buf2.copyToChannel(p.gen[2].shdr.sample, 0);\n" +
            "var buf3 = ts.ctx.createBuffer(1, p.gen[3].shdr.end, p.gen[3].shdr.sampleRate);\n" +
            "buf3.copyToChannel(p.gen[3].shdr.sample, 0);\n" +
            "var buf4 = ts.ctx.createBuffer(1, p.gen[4].shdr.end, p.gen[4].shdr.sampleRate);\n" +
            "buf4.copyToChannel(p.gen[4].shdr.sample, 0);\n\n" +
            
            "fg.register(\"piano1\", ts.ModPoly(function() { return ts.ModSF2(p.gen[1], buf1); }));\n" +
            "fg.register(\"piano2\", ts.ModPoly(function() { return ts.ModSF2(p.gen[2], buf2); }));\n" +
            "fg.register(\"piano3\", ts.ModPoly(function() { return ts.ModSF2(p.gen[3], buf3); }));\n" +
            "fg.register(\"piano4\", ts.ModPoly(function() { return ts.ModSF2(p.gen[4], buf4); }));\n" +
            "fg.register(\"seq1\", ts.ModPolySeq());\n" +
            "fg.register(\"seq2\", ts.ModPolySeq());\n" +
            "fg.register(\"seq3\", ts.ModPolySeq());\n" +
            "fg.register(\"seq4\", ts.ModPolySeq());\n\n" +
    
            "fg.connect(\"seq1\", \"piano1\");\n" +
            "fg.connect(\"seq2\", \"piano2\");\n" +
            "fg.connect(\"seq3\", \"piano3\");\n" +
            "fg.connect(\"seq4\", \"piano4\");\n" +
            "fg.connect(\"piano1\", \"destination\");\n" +
            "fg.connect(\"piano2\", \"destination\");\n" +
            "fg.connect(\"piano3\", \"destination\");\n" +
            "fg.connect(\"piano4\", \"destination\");\n\n" +
            
            "fg.module.piano1.parameter.gain.gain(vm.volume());\n" +
            "fg.module.piano2.parameter.gain.gain(vm.volume());\n" +
            "fg.module.piano3.parameter.gain.gain(vm.volume());\n" +
            "fg.module.piano4.parameter.gain.gain(vm.volume());\n\n" +
    
            "var ca = vm.chord().split(/[\\s|]/).filter(function (s) { return s != \"\"; });\n" +
            "var va = vm.breakValue().split(/[\\s|]/).filter(function (s) { return s != \"\"; });\n" +
            "fg.module.seq1.parameter.sequence = ts.chordToSequence(ca, va, vm.tempo());\n" +
            "fg.module.seq2.parameter.sequence = ts.chordToSequence(ca, va, vm.tempo());\n" +
            "fg.module.seq3.parameter.sequence = ts.chordToSequence(ca, va, vm.tempo());\n" +
            "fg.module.seq4.parameter.sequence = ts.chordToSequence(ca, va, vm.tempo());\n\n"            
        );
        
        //this.chord = ko.observable('C G Am Em F C F G');
        this.chord = ko.observable(
            'A B G#m C#m A B C#7sus4 C#7\n' +
            'A B E E A B E E\n' +
            'A B G# C#m F# F# B Cm6(-5)\n' +
            'C#m C(+5) E/B A#m7(-5) A A A/B B\n'
            );
            
        this.breakValue = ko.observable();
        this.breakKind = ko.observable([
            "[RS]8/3 F8/3 T8/3",
            "[RS]8/3 T8/3 F8/3",
            "R4 [RTFS]4",
        ]);
        
        this.tempo = ko.observable(180);

        this.volume = ko.observable();

        this.playChord = function () {
            model.build(this.synth(), this);
            /*
            this.volume.subscribe(model.parameter.piano2.gain.gain);
            this.volume.subscribe(model.parameter.piano3.gain.gain);
            this.volume.subscribe(model.parameter.piano4.gain.gain);
            */
        
            model.play();
        };
        this.recycle = function () { model.recycle(); };
        this.stop = function() { model.stop(); };

        this.volume(1.0);
    };
});
