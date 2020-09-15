class NoteStreamElement{
    constructor(note, velocity){
        this._note = note;
        this._velocity = velocity;
        this._onAt = Date.now();
        this._duration = null;
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
    off(){
        if(this._duration == null){
            this._duration = Date.now() - this._onAt;
            return true;
        }else{
            console.log(this._duration);
            return false;
        }
    }
}
class NoteStream{
    constructor(){
        this._elements = new Array();
    }
    noteOn(note,velocity){
        this._elements.push(new NoteStreamElement(note,velocity));
    }
    noteOff(note)
    {
        for(var len = this._elements.length - 1; len > -1; len--){
            var elmt = this._elements[len];
            if(elmt.note == note){
                if(!elmt.off()){
                    console.log("failed to turn off note:", note);
                }
                return this._elements.splice(len,1);
            }
        }
    }
}

class Visualizer{
    constructor(show){
        this._stream = new NoteStream();
    }
    noteOn(note, velocity){
        this._stream.noteOn(note,velocity);
    }
    noteOff(note){
        show(this._stream.noteOff(note)[0]);
    }
}