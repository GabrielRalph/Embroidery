class SPath extends SNode{
  constructor(sTree, group, specs = null){
    super(sTree)

    this.vNode.color = 'uncomputed'

    this._end = null;
    this._start = null;
    this.size = 0;
    this._color = 'red';

    this.visualizer_path = null;

    this.mode = 'uncomputed'

    this.stitchGenerator = new StitchPath(group, this, specs)
    this.onclick = () => { this.compute()}
  }

  setStroke(color, width = '1'){
    this.visualizer_path.setStroke(color, width)
  }

  // --- --- --- --- --- --- --- --- //
  // --- - Tree MGMT Functions - --- //
  // --- --- --- --- --- --- --- --- //



  // --- --- --- --- --- --- --- --- //
  // -- - Visualizer Functions - --- //
  // --- --- --- --- --- --- --- --- //

    // The focus tool takes the paramater point and scrolls
    // the sTree.output_svg to center the point
    //
    // point
    //  Types:
    //   ~ String: follow|point is a moving average of this.end
    //   ~ Vector
    focus(point){
      if (point === 'follow'){
        point = this.end.point
        let cur = this.end
        var i;
        if(cur != this.start){
          for (i = 0; i < 5; i++){
            cur = cur.last;
            point = point.add(cur.point)
            if(cur == this.start){
              break;
            }
          }
        }
        point = point.div(i)
      }
      let svg = this.sTree.output_svg;
      let box = svg.parentNode;

      let svg_size = new Vector(svg.clientWidth, svg.clientHeight);
      let box_size = new Vector(box.clientWidth, box.clientHeight);
      let viewbox = svg.getViewBox()

      point = point.sub(viewbox.offset)
      let here = point.mul(svg_size).div(viewbox.size)
      here = here.sub(box_size.div(2))
      box.scrollTo(here.x, here.y)
    }

    // Creates an svg path and sets its class to .stitch-style
    createPath(){
      this.visualizer_path = this.el.createChild('path', {class: 'stitch-style'})
    }

    render(){
      if (this.visualizer_path == null){
        this.createPath()
      }
      this.visualizer_path.setAttribute('d',`${this}`)
      this.visualizer_path.setAttribute('stroke',`${this.color}`)
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

  // StitchPath functions
  compute(callback){
    if(this.mode == 'uncomputed'){
      this.mode = 'computing'
      this.stitchGenerator.computeOnAnimationFrame(() => {
        this.mode = 'computed'
        this.vNode.color = 'computed'
        this.vNode.__update()
        if (callback){
          callback()
        }
      })
    }
  }

  computeAll(callback){
    this.compute(callback)
    for (var i = 0; i < this.children.length; i++){
      this.children[i].computeAll(callback)
    }
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
  get end(){
    return this._end;
  }
  set start(val){
    this._start = val;
  }
  get start(){
    return this._start;
  }
  set mode(mode){
    this._mode = mode;
    if (this.el){
      this.el.setAttribute('mode',mode)
    }
    if (this.vNode){
      this.vNode.__update()
    }
  }
  get mode(){
    return this._mode
  }
  set progress(progress){
    this._progress = progress;
    this.vNode.__update();
  }
  get progress(){
    if (this._progress){
      return this._progress
    }else{
      return null
    }
  }

  // Link list insert functions

  // Pushes to the link list
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
    this.render()
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
    this.render()
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

    this.render()
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

  //Inserts another sPaths link list
  insertLoop(loop, location, rotation = 1){
    loop.rotate(rotation)
    loop.push(loop.start.clone())
    loop.push(location.clone())

    this.putAfter(loop, location)
  }

  isLoop(max_length = 40){
    if (this.end != null && this.start != null){
      return this.end.point.distance(this.start.point) < max_length
    }
  }
  isComputed(){
    let recursiveHelp = (node) => {
      let res = true
      for (var i = 0; i < node.children.length; i++){
        let child = node.children[i]
        if (child.mode == 'join'){
          res &= recursiveHelp(child)
        }else{
          res &= child.mode == 'computed'
        }
      }
      return res
    }
    return recursiveHelp(this)
  }

  // Link list smart functions
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

  reflect(mode = 'v'){
    let cur = this.start;
    cur.reflect(mode)
    while(cur != this.end){
      cur = cur.next
      cur.reflect(mode);
    }
  }

  toString(){
    return `${this.start}`
  }
}

class Path{
  constructor(){
    this._end = null;
    this._start = null;
  }

  set end(val){
    this._end = val;
  }
  get end(){
    return this._end;
  }
  set start(val){
    this._start = val;
  }
  get start(){
    return this._start;
  }

  // Pushes to the link list
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

  }
  // Link list smart functions
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
  toString(){
    return `${this.start}`
  }
}
