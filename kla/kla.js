//
class KlaDisplay {
    constructor(params) {
    }

    init(params) {
        this._uiCallback = params.callback;
        var VF = Vex.Flow;
        var renderer = new VF.Renderer(params.canvas, VF.Renderer.Backends.SVG);
        this._options = {};
        this._options.width = params.width;
        this._options.height = params.height;
        this._options.isShowNoteName = params.isShowNoteName;
        this._options.isShowScaleName = params.isShowScaleName;
        renderer.resize(params.width, params.height);
        this._context = renderer.getContext();
        this._context.setViewBox(0, -(params.height - 150) / 2, params.width, params.height)

    }

    setSwitches(scaleName = false, noteName = false) {
        this._options.isShowScaleName = scaleName;
        this._options.isShowNoteName = noteName;
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

    _getScaleName(scale) {
        let scaleName = scale.replace("#", '\u266F').replace("b", '\u266D');
        if (scaleName.indexOf("m") > 0) {
            return scaleName.replace("m", " minor");
        } else {
            return scaleName + " major";
        }
    }

    display(scale, clef, key) {
        this._clean();

        this._currGroup = this._context.openGroup();
        var VF = Vex.Flow;
        // Create a stave of width 400 at position 10, 40 on the canvas.
        const stave = new VF.Stave(5, 0, this._options.width - 10);

        //scale
        stave.addKeySignature(scale);

        // Add a clef and time signature.
        stave.addClef(clef);


        //show scale
        if (this._options.isShowScaleName) {
            //
            stave.setTempo({ name: this._getScaleName(scale) }, 0);
        }

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

class KlaQuizGenerator {
    constructor() {
        this.scales = [
            { name: "C", keys: "CDEFGAB" },
            { name: "G", keys: "GABCDEF#" },
            { name: "D", keys: "DEF#GABC#" },
            { name: "A", keys: "ABC#DEF#G#" },
            { name: "E", keys: "EF#G#ABC#D#" },
            { name: "B", keys: "BC#D#EF#G#A#" },
            { name: "F#", keys: "F#G#A#BC#D#E#" },
            { name: "C#", keys: "C#D#E#F#G#A#B#" },
            { name: "F", keys: "FGABbCDE" },
            { name: "Bb", keys: "BbCDEbFGA" },
            { name: "Eb", keys: "EbFGAbBbCD" },
            { name: "Ab", keys: "AbBbCDbEbFG" },
            { name: "Db", keys: "DbEbFGbAbBbC" },
            { name: "Gb", keys: "GbAbBbCbDbEbF" },
            { name: "Cb", keys: "CbDbEbFbGbAbBb" },

            { name: "Am", keys: "ABCDEFG" },
            { name: "Em", keys: "EF#GABCD" },
            { name: "Bm", keys: "BC#DEF#GA" },
            { name: "F#m", keys: "F#G#ABC#DE" },
            { name: "C#m", keys: "C#D#EF#G#AB" },
            { name: "G#m", keys: "G#A#BC#D#EF#" },
            { name: "D#m", keys: "D#E#F#G#A#BC#" },
            { name: "A#m", keys: "A#B#C#D#E#F#G#" },
            { name: "Dm", keys: "DEFGABbC" },
            { name: "Gm", keys: "GABbCDEbF" },
            { name: "Cm", keys: "CDEbFGAbBb" },
            { name: "Fm", keys: "FGAbBbCDbEb" },
            { name: "Bbm", keys: "BbCDbEbFGbAb" },
            { name: "Ebm", keys: "EbFGbAbBbCbDb" },
            { name: "Abm", keys: "AbBbCbDbEbFbGb" }
        ]
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
            isShowNoteName: false,
            isShowScaleName: false
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

            if (settings.isShowScaleName != null) {
                this.options.isShowScaleName = settings.isShowScaleName;
            }

            if (settings.isShowNoteName != null) {
                this.options.isShowNoteName = settings.isShowNoteName;
            }
        }
    }

    _getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    _note2midi(scaleName, noteName, octave, flat, sharp, natural) {
        const idx = "A_BC_D_EF_G".indexOf(noteName);
        var midi = idx + 21 + 12 * (idx <= 2 ? octave : octave - 1);

        for (let s = 0; s < this.scales.length; s++) {
            if (this.scales[s].name == scaleName) {
                const noteIdx = this.scales[s].keys.indexOf(noteName);
                if (noteIdx == this.scales[s].keys.length - 1) {
                    break;
                }
                let accidental = this.scales[s].keys[+1];
                if (accidental == "#") {
                    midi++;
                } else if (accidental == "b") {
                    midi--;
                }
                break;
            }
        }

        // if (flat) {
        //     midi--;
        // }
        // if (sharp) {
        //     midi++;
        // }
        return midi;
    }

    next() {
        //scale
        const scaleName = this.options.range.scales[this._getRandomInt(0, this.options.range.scales.length - 1)];

        //octave
        const octave = this._getRandomInt(...this.options.range.octave);
        let clef = octave <= 3 ? "bass" : "treble";

        //note
        let noteName;
        while (!noteName || (octave == 0 && noteName != "A" && noteName != "B") || (octave == 8 && noteName != "C")) {
            noteName = "CDEFGAB".substr(this._getRandomInt(0, 6), 1);
        }

        //signature

        return {
            scaleName: scaleName,
            clef: clef,
            octave: octave,
            noteName: noteName,
            midi: this._note2midi(scaleName, noteName, octave, false, false, false)
        };
    }
}

class KlaMidi {
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
            if (this._callbacks && this._callbacks.uiCallback) {
                this._callbacks.uiCallback({ stateMsg: e.port.name + "[" + e.port.manufacturer + "]" + "-" + e.port.state });
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
class KLA {
    init(params) {
        this._midi = new KlaMidi();
        this._midi.init({
            onNoteOn: (key, velocity) => { this._noteOn(key, velocity, params.callback) },
            uiCallback: params.callback
        });

        this._display = new KlaDisplay();
        this._display.init(params);

        this._quizGenerator = new KlaQuizGenerator();
    }

    reset(settings) {
        this._display.setSwitches(settings.isShowScaleName, settings.isShowNoteName);
        this._quizGenerator.init(settings);
        this._next();
    }

    _noteOn(key, velocity, uiCallback) {
        if (key == this._quiz.midi) {
            uiCallback({ answer: true });
            this._next();
        } else {
            uiCallback({ answer: false });
        }
    }

    _next() {
        this._quiz = this._quizGenerator.next();
        this._display.display(this._quiz.scaleName, this._quiz.clef, this._quiz.noteName.toLocaleLowerCase() + "/" + this._quiz.octave);
    }
}