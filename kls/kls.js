//
class KlsDisplay {
    constructor(params) {
    }

    init(params) {
        var VF = Vex.Flow;
        var renderer = new VF.Renderer(params.canvas, VF.Renderer.Backends.SVG);
        this._options = {};
        this._options.width = params.width;
        this._options.height = params.height;
        this._options.isShowNoteName = params.isShowNoteName;
        renderer.resize(params.width, params.height);
        this._context = renderer.getContext();
        this._context.setViewBox(0, -(params.height - 150) / 2, params.width, params.height)
    }

    showNoteName(value) {
        this._options.isShowNoteName = value;
    }

    _clean() {
        if (this._currGroup) {
            this._context.svg.removeChild(this._currGroup);
        }
    }

    _getAccidental(key) {
        const idx = key.indexOf('/');
        if (idx < 2) {
            return null;
        } else {
            return key.substring(1, idx);
        }
    }

    display(scale, clef, key) {
        console.log(scale, clef,key);
        this._clean();

        this._currGroup = this._context.openGroup();
        var VF = Vex.Flow;
        // Create a stave of width 400 at position 10, 40 on the canvas.
        const stave = new VF.Stave(5, 0, this._options.width - 10);

        //scale
        stave.addKeySignature(scale);

        // Add a clef and time signature.
        stave.addClef(clef);

        // Connect it to the rendering context and draw!
        stave.setContext(this._context).draw();

        let note = new VF.StaveNote({ clef: clef, keys: [key], duration: "w", align_center: true });
        let accidental = this._getAccidental(key);
        if (accidental) {
            note.addAccidental(0, new VF.Accidental(accidental));
        }
        if (this._options.isShowNoteName) {
            let noteName = key.substr(0, key.indexOf('/')).toUpperCase();
            note.addAnnotation(0, new VF.Annotation(noteName).setFont('Arial', 16));
        }

        let voice = new VF.Voice({ num_beats: 4, beat_value: 4 });
        voice.addTickables([note]);

        let formatter = new VF.Formatter().joinVoices([voice]).format([voice], this._options.width - 10);

        // Render voice
        voice.draw(this._context, stave);

        // Then close the group:
        this._context.closeGroup();
    }
}

class KlsQuizGenerator {
    constructor() {
        this.options = {
            range: {
                octave: [3, 5],
                scales: ["C"],
                signatures: {
                    sharp: false,
                    flat: false,
                    natural: false
                }
            },
            isShowNoteName: false
        }
    }

    init(settings) {
        if (settings) {
            var range = this.options.range;
            if (settings.octave) {
                range.octave[0] = settings.octave.min;
                range.octave[1] = settings.octave.max;
            }

            if (settings.scales) {
                range.scales = settings.scales;
            }

            if (settings.signatures) {
                if (settings.signatures.sharp != null) {
                    range.signatures.sharp = settings.signatures.sharp;
                }
                if (settings.signatures.flat != null) {
                    range.signatures.flat = settings.signatures.flat;
                }
                if (settings.signatures.natural != null) {
                    range.signatures.sharp = settings.signatures.natural;
                }
            }

            if (settings.isShowNoteName != null) {
                this.options.isShowNoteName = settings.isShowNoteName;
            }
        }
    }

    _getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    _note2midi(note, octave, flat, sharp) {
        const idx = "a_bc_d_ef_g".indexOf(note);
        var midi = idx + 21 + 12 * (idx <= 2 ? octave : octave - 1);
        if (flat) {
            midi--;
        }
        if (sharp) {
            midi++;
        }
        return midi;
    }

    next() {
        //scale
        const scale = this.options.range.scales[this._getRandomInt(0, this.options.range.scales.length-1)];

        //octave
        const octave = this._getRandomInt(...this.options.range.octave);
        let clef = octave <= 3 ? "bass" : "treble";

        //note
        let note = "cdefgab".substr(this._getRandomInt(0, 6), 1);
        while((octave == 0 && note != "a" && note != "b") || (octave == 8 && note != "c")){
            note = "cdefgab".substr(this._getRandomInt(0, 6), 1);
        }

        //signature
        
        return {
            scale: scale,
            clef: clef,
            octave: octave,
            note: note,
            midi: this._note2midi(note, octave, false, false)
        };
    }
}

class KlsMidi {
    init(callbacks) {
        if (navigator.requestMIDIAccess == null) {
            throw 'MIDI access not supported';
        }
        this._callbacks = callbacks;
        navigator.requestMIDIAccess({ sysex: true }).then(access => { this._onMIDISuccess(access) });
    }

    _onMIDISuccess(access) {
        this.inputs = access.inputs.values();
        for (var input of access.inputs.values()) {
            input.onmidimessage = (msg) => { this._onMidiMessage(msg) };
        }

        access.onstatechange = (e) => {
            if (this._callbacks  && this._callbacks.uiCallback) {
                this._callbacks.uiCallback({stateMsg: e.port.name + "[" + e.port.manufacturer + "]" + "-" + e.port.state });
            }
        };
    }

    _onMidiMessage(msg) {
        if (msg.data[0] == 144) {
            //note on
            if (this._callbacks && this._callbacks.onNoteOn) {
                this._callbacks.onNoteOn(msg.data[1], msg.data[2]);
            }
        }
    }
}

//Keyboard Learning Assistant
class KLS {
    init(params) {
        this._midi = new KlsMidi();
        this._midi.init({
            onNoteOn: (key, velocity) => { this._noteOn(key, velocity, params.callback) },
            uiCallback: params.callback
        });

        this._display = new KlsDisplay();
        this._display.init(params);

        this._quizGenerator = new KlsQuizGenerator();
    }

    reset(settings) {
        this._display.showNoteName(settings.isShowNoteName);
        this._quizGenerator.init(settings);
        this._next();
    }

    _noteOn(key, velocity, uiCallback) {
        if (key == this._quiz.midi) {
            uiCallback({ answer: true });
            this._next();
        } else {
            uiCallback({ answer: false});
        }
    }

    _next() {
        this._quiz = this._quizGenerator.next();
        this._display.display(this._quiz.scale, this._quiz.clef, this._quiz.note + "/" + this._quiz.octave);
    }
}