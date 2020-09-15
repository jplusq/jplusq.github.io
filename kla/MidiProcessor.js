class MidiProcessor{
    constructor(){
    }
    init(listener) {
        if (navigator.requestMIDIAccess == null) {
            throw 'MIDI access not supported';
        }
        this._listener = listener;
        navigator.requestMIDIAccess({ sysex: true }).then(access => { this._onMIDISuccess(access) });
    }
  
    _onMIDISuccess(access) {
        this.inputs = access.inputs.values();
        for (var input of access.inputs.values()) {
            input.onmidimessage = (msg) => { this._onMidiMessage(msg) };
        }

        access.onstatechange = (e) => {
            if (this._listener) {
                //this._listener.onStateChange(e);
            }
        };
    }

    _onMidiMessage(msg) {
        switch(msg.data[0]){
            case 144:
                //note on
                if (this._listener) {
                    this._listener.noteOn(msg.data[1], msg.data[2]);
                }
                break;
            case 128:
                //note off
                if (this._listener) {
                    this._listener.noteOff(msg.data[1]);
                }
                break;
        }
    }
}