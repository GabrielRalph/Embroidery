
class Stitch{
  constructor(point){
    //Node values
    this.point = point.round();

    //Pointers
    this.next = null;
    this.last = null;
  }

  set next(val){
    this._next = val;
  }

  set last(val){
    this._last = val;
  }

  get next(){
    return this._next;
  }

  get last(){
    return this._last;
  }

  clone(){
    return new Stitch(this.point)
  }

  toString(){
    return `${this.last == null?'M':''}${this.point} ${this.next!=null?('L' + this.next):('')}`
  }
}

class SPath{
  constructor(){
    this._end = null;
    this._start = null;
    this.size = 0;
    this._color = 'red';

    this.children = []

    this.visualizer_svg = null
    this.visualizer_path = null
  }

  animate(){
    let cur = this.start.next
    let nextFrame = () => {
      let temp = cur.next;
      cur.next = null;
      this.render()
      cur.next = temp;
      cur = temp;
      if (cur == this.end){
        this.render()
      }else{
        window.requestAnimationFrame(nextFrame)
      }
    }
    window.requestAnimationFrame(nextFrame)
  }

  removeVisualizer(){
    this.visualizer_svg.removeChild(this.visualizer_path)
    this.visualizer_svg = null
    this.visualizer_path = null;
  }
  setVisualizerSvg(svg){
    this.visualizer_path = create('path')
    this.visualizer_path.setAttribute('class','stitch-style')

    this.visualizer_svg = svg
    this.visualizer_svg.appendChild(this.visualizer_path)
  }

  render(){
    this.visualizer_path.setAttribute('d',`${this}`)
    this.visualizer_path.setAttribute('stroke',`${this.color}`)
  }

  set appendChild(child){
    this.children.push()
  }

  set color(val){
    this._color = val;
  }

  get color(){
    return this._color
  }

  set end(val){
    this._end = val;
  }

  set start(val){
    this._start = val;
  }

  get end(){
    return this._end;
  }

  get start(){
    return this._start;
  }

  push(stitch){
    if (stitch instanceof Vector){
      stitch = new Stitch(stitch)
    }

    if (stitch instanceof Stitch){
      this.size ++;

      if (this.end == null){
        this.start = stitch;
        this.end = stitch;
      }else{
        this.end.next = stitch
        stitch.last = this.end
        this.end = stitch;
      }
    }else if(stitch instanceof SPath){
      this.size += stitch.size

      if (this.end == null){
        this.start = stitch.start;
        this.end = stitch.end;
      }else{
        this.end.next = stitch.start
        stitch.start.last = this.end
        this.end = stitch.end;
      }
    }

    if (this.visualizer_path != null){
      this.render()
    }
  }

  queue(stitch){
    if (stitch instanceof Vector){
      stitch = new Stitch(stitch)
    }

    if (stitch instanceof Stitch){
      this.size ++;

      if (this.start == null){
        this.start = stitch;
        this.end = stitch;
      }else{
        this.start.last = stitch
        stitch.next = this.start
        this.start = stitch;
      }
    }else if(stitch instanceof SPath){
      this.size += stitch.size;

      if (this.start == null){
        this.start = stitch.start;
        this.end = stitch.end;
      }else{
        this.start.last = stitch.end
        stitch.end.next = this.start
        this.start = stitch.start;
      }
    }
    if (this.visualizer_path != null){
      this.render()
    }
  }

  isLoop(max_length = 40){
    if (this.end != null && this.start != null){
      return this.end.distance(this.start) < max_length
    }
  }

  rotate(x = 1){
    let dir = x < 0;
    x = Math.abs(x);
    for (var i = 0; i < x; i++){
      if (dir){
        //New end will be the ends last node
        let new_end = this.end.last;
        new_end.next = null

        let new_start = this.end;
        new_start.next = this.start;
        new_start.last = null;
        this.start.last = new_start
        this.start = new_start;

        this.end = new_end;
      }else{
        //New end will be the ends last node
        let new_start = this.start.next;
        new_start.last = null

        let new_end = this.start;
        new_end.last = this.end;
        new_end.next = null;
        this.end.next = new_end
        this.end = new_end;

        this.start = new_start;
      }
    }
  }

  putAfter(stitch, location){
    if (stitch instanceof Vector){
      stitch = new Stitch(stitch)
    }
    if (stitch instanceof Stitch){
      this.size ++;

      stitch.next = location.next
      stitch.last = location
      location.next = stitch
    }else if (stitch instanceof SPath){
      this.size += stitch.size;
      let next_location = location.next;
      stitch.end.next = next_location
      next_location.last = stitch.end

      stitch.start.last = location
      location.next = stitch.start
    }

    if (this.visualizer_path != null){
      this.render()
    }
  }

  insertAtIntersection(path, threshold = 3, cur = this.start){
    while (cur != this.end){
      for (var i = 0; i < path.size; i++){
        path.rotate()
        if (path.start.point.distance(cur.point) < threshold){

          path.push(path.start.clone())
          path.push(cur.clone())

          this.putAfter(path, cur)
          return path.end
        }
      }
      cur = cur.next;
    }
    return false
  }

  join(path, offset = this.start){
    var i = 0;
    let res = false;
    do {
      i++;
      res = this.insertAtIntersection(path, i, offset);
    } while(res == false);
    return res
  }

  tieOff(length = 3, repeats = 1){
    let cur_s = this.start
    let cur_e = this.end
    for (var r = 0; r < repeats; r++){
      for (var i = 0; i < length; i++){
        cur_s = cur_s.next
        cur_e = cur_e.last
        this.queue(cur_s.clone())
        this.push(cur_e.clone())
      }
      for (var i = 0; i < length; i++){
        cur_s = cur_s.last
        cur_e = cur_e.next
        this.queue(cur_s.clone())
        this.push(cur_e.clone())
      }
    }
  }

  loopBack(){
    let cur = this.end;
    while (cur != this.start){
      cur = cur.last;
      this.push(cur.clone())
    }
  }

  toString(){
    return `${this.start}`
  }
}

class STree{
  constructor(root){
    this.root = root
  }
}
