class NoteStreamElement{
    constructor(note, velocity){
        this._note = note;
        this._velocity = velocity;
        this._onAt = Date.now();
        this._duration = null;
        this.interval = null;
        this.sync = null;
    }
    get note(){
        return this._note;
    }
    get velocity(){
        return this._velocity;
    }
    get duration(){
        return this._duration;
    }
    get onAt(){
        return this._onAt;
    }

    off(){
        if(this._duration == null){
            this._duration = Date.now() - this._onAt;
            return true;
        }else{
            return false;
        }
    }
}
class NoteStream{
    constructor(){
        this._elements = new Array();
    }

    noteOn(note,velocity){
        var elmt = new NoteStreamElement(note,velocity);
        var len = this._elements.length;
        if(len > 2){
            var diff = elmt.onAt - this._elements[len-1].onAt;
            if(diff < 100){
                //sync
                elmt.sync = diff;
            }else{
                elmt.interval = diff;
                if(this._elements[len-1].onAt - this._elements[len-2].onAt < 100){
                    elmt.interval = elmt.onAt - this._elements[len-2].onAt;
                }
            }
        }
        this._elements.push(elmt);
        while(this._elements.length > 30){
            this._elements.shift();
        }
        return elmt;
    }

    noteOff(note)
    {
        for(var len = this._elements.length - 1; len > -1; len--){
            var elmt = this._elements[len];
            if(elmt.note == note){
                if(!elmt.off()){
                    console.log("failed to turn off note:", note);
                }
                return elmt;
            }
        }
        return null;
    }
}

class Visualizer{
    constructor(show){
        this._stream = new NoteStream();
    }
    noteOn(note, velocity){
        show(this._stream.noteOn(note,velocity));
    }
    noteOff(note){
        showDuration(this._stream.noteOff(note));
    }
}