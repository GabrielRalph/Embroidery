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
  constructor(sTree){
    this._end = null;
    this._start = null;
    this.size = 0;
    this._color = 'red';

    this.mode = 'join'; // join | stitch | uncomputed

    this.parent = null;
    this.children = [];

    this.sTree = sTree;
    this.vNode = new VNode(this)
  }

  appendChild(child){
    this.children.push(child)
    child.parent = this;
    child.setVisualizerParent(this.visualizer_group)
  }

  build(group){
    let mode = group.getAttribute('mode')

    //If join node
    if (mode == 'join'){
      let children = group.children
      for (var i = 0; i < children.length; i++){
        let child = children[i];
        let sChild = new SPath(this.sTree)
        this.appendChild(sChild)
        sChild.build(child)
      }

    //If leaf path node
    }else if (mode == 'RunningStitch'||mode == 'SatinColumn'){
      this.stitchGenerator = new StitchPath(group, this)
      this.mode = 'uncomputed'
    }
  }

  // Path visualizer
  removeVisualizer(){
    this.visualizer_parent.removeChild(this.visualizer_path)
    this.visualizer_parent = null
    this.visualizer_path = null;
  }
  setVisualizerParent(svg){
    this.visualizer_group = create('g')

    this.visualizer_path = create('path')
    this.visualizer_path.setAttribute('class','stitch-style')

    this.visualizer_parent = svg
    this.visualizer_parent.appendChild(this.visualizer_group)
    this.visualizer_group.appendChild(this.visualizer_path)
  }
  render(){
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
    if (this.mode != 'join'){
      this.stitchGenerator.computeOnAnimationFrame(() => {
        this.mode = 'computed'
        callback()
      })
    }
  }

  // Setter Getter
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

  // Link list insert functions
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

  isLoop(max_length = 40){
    if (this.end != null && this.start != null){
      return this.end.distance(this.start) < max_length
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

class StitchPath{
  constructor(group, sPath){
    this.sPath = sPath;

    this.max_length = 3;
    this.min_length = 1;
    this.max_var = 0.5;
    this.mode = 'RunningStitch';
    this.loop = null;
    this.order = null;

    this.unit = 0.1;

    this.path = null
    this.path_2 = null;

    this.svg_group = group
    this.assignAttributes()
  }

  assignAttributes(){
    if (this.svg_group.hasAttribute('mode')){
      this.mode = this.svg_group.getAttribute('mode')
    }
    if (this.svg_group.hasAttribute('loop')){
      this.loop = this.svg_group.getAttribute('loop')
    }
    if (this.svg_group.hasAttribute('order')){
      this.order = this.svg_group.getAttribute('order')
    }
    if (this.svg_group.hasAttribute('max_length')){
      this.max_length = parseFloat(this.svg_group.getAttribute('max_length'))
    }
    if (this.svg_group.hasAttribute('min_length')){
      this.min_length = parseFloat(this.svg_group.getAttribute('min_length'))
    }
    if (this.svg_group.hasAttribute('max_var')){
      this.max_var = parseFloat(this.svg_group.getAttribute('max_var'))
    }
    if (this.svg_group.hasAttribute('max_var')){
      this.max_var = parseFloat(this.svg_group.getAttribute('max_var'))
    }
    if (this.svg_group.hasAttribute('stroke')){
      this.sPath.color = this.svg_group.getAttribute('stroke')
    }
  }

  nextStitch(){
    return this['__next' + this.mode]()
  }
  startStitch(){
    this['__start' + this.mode]()
  }

  ['progress'](){
    let progress = 0;
    if (this.l && this.end){
      progress = this.l/this.end
    }
    if (this.l_2 && this.end_2){
      progress += this.l_2/this.end_2
      progress /= 2;
    }
    return progress
  }

  //Compute
  computeOnAnimationFrame(callback = false){
    this.startStitch()
    if (this.nextStitch()){
      let nextframe = () => {
        if (this.nextStitch()){
          window.requestAnimationFrame(nextframe)
        }else{
          if (callback){
            if(this.loop == 'back'){
              this.sPath.loopBack()
            }

            callback()
          }
        }
      }
      window.requestAnimationFrame(nextframe)
    }
  }

  //Add a stitch
  __addStitch(point){
    this.sPath.push(point)
  }

  //Starts a SatinColumn stitch
  __startSatinColumn(dir = false){
    // Set Paths
    this.path = this.svg_group.getElementsByTagName('path')[0]
    this.path_2 = this.svg_group.getElementsByTagName('path')[1]

    // Setup end points
    this.end = this.path.getTotalLength()
    this.end_2 = this.path_2.getTotalLength()

    // Setup Increments
    let avg_end = (this.end + this.end_2) / 2;
    let stitch_num = avg_end / (this.max_length / this.unit);
    this.inc = this.end / stitch_num;
    this.inc_2 = (dir?-1:1) * this.end_2 / stitch_num;
    // Setup length counters
    this.l = 0
    this.l_2 = dir?this.end_2:0;

    // Direction Correction
    this.end_2 *= dir?0:1

    // Get initial points
    this.s = new Vector(this.path.getPointAtLength(this.l))
    this.s_2 = new Vector(this.path_2.getPointAtLength(this.l_2))

    //Auto direction Correction
    let s_2_opp = new Vector(this.path_2.getPointAtLength(this.end_2))
    let d = this.s.distance(this.s_2)
    let d_opp = this.s.distance(s_2_opp)
    if (d > d_opp){
      this.__startSatinColumn(!dir)
    }else{

      //Add last stitches if direction is correct
      this.__addStitch(this.s)
      this.__addStitch(this.s_2)
    }
  }

  //Computes the next stitch point in a SatinColumn
  __nextSatinColumn(){

    // Increment length counters
    this.l += this.inc;
    this.l_2 += this.inc_2;

    // Get the points at the length of the new length counters
    let s = new Vector(this.path.getPointAtLength(this.l))
    let s_2 = new Vector(this.path_2.getPointAtLength(this.l_2))

    //Get the average perpendicular distance from the new points to the line formed by the old ones
    let d = (s.distToLine(this.s, this.s_2) + s_2.distToLine(this.s, this.s_2))/2;

    this.s = s;
    this.s_2 = s_2;

    //If distance is greater than the min_length factor then add the points
    if(d > (this.min_length / this.unit)){
      this.__addStitch(this.s)
      this.__addStitch(this.s_2)
    }

    //Return false if the whole line has been computed
    if (this.l > this.end){
      return false
    }else{
      return true
    }
  }

  //Starts a RunningStitch
  __startRunningStitch(){

    //Set Path
    this.path = this.svg_group.getElementsByTagName('path')[0]

    //Set length counter and end length
    this.l = 0
    this.end = this.path.getTotalLength()

    //Add the first point
    this.s = new Vector(this.path.getPointAtLength(this.l))
    this.__addStitch(this.s)
  }

  //Computes the next running stitch
  __nextRunningStitch(){

    let dl = this.max_length/this.unit;
    let di = this.min_length/this.unit;
    let mr = this.max_var/this.unit;

    if (this.l + dl > this.end){
      this.l = this.end
      this.s = new Vector(this.path.getPointAtLength(this.end))
      this.__addStitch(this.s)
      return false
    }


    // Get a stitch point, s, with a distance of max_length away from the last
    // this will be our initial guess for the next stitch point
    let s_i = new Vector(this.path.getPointAtLength(this.l + dl));


    // Get all the stitch points between the last stitch point and our guess for
    // the next stitch point, s_i, with a spacing of min_length between each other
    for (var i = di; i < dl; i += di){
      let s = new Vector(this.path.getPointAtLength(this.l + i))

      // Get the perpendicular distance from the current point, s to the line
      // between the last point and the guess for the next point
      let d = s.distToLine(this.s, s_i)

      // As we look at the points, d will increase or remain 0. When the d of the
      // point s is just greater than the variance threshold, we set the next stitch
      if (d > mr){
        this.l += i
        this.s = s;
        this.__addStitch(this.s)
        return true
      }
    }

    // If the d never exceeds the threshold the next stitch will be our inititial guess
    this.l += dl
    this.s = s_i
    this.__addStitch(this.s)
    return true
  }
}

class STree{
  constructor(input_svg, output_svg, node_svg){
    this.input_svg = input_svg
    this.output_svg = output_svg
    this.node_svg = null
    this.root = new SPath(this)
    this.root.setVisualizerParent(output_svg)
    this.root.build(input_svg)
  }

  VNodeSetup(svg){
    this.node_svg = svg;

    let height = 0;

    let recursiveHelp = (node, level=0, lastWidth = 0) => {
      height = height < level? level:height;

      // Children
      if(node.children.length > 0){

        var width = 0;
        for(var i in node.children){
          width += recursiveHelp(node.children[i], level + 1, width + lastWidth);
        }

        node.vNode.width = width;
        node.vNode.pos = new Vector(level, lastWidth + width/2);
        node.vNode.render()
        return width

      // Leaf
      }else{
        node.vNode.width = 1;
        node.vNode.pos = new Vector(level, lastWidth + 0.5);
        node.vNode.render()
        return 1
      }
    }
    let width = recursiveHelp(this.root)
    this.node_svg.setProps({
      viewBox: `0 0 50 50`
    })
  }


}

class VNode{
  constructor(sPath){
    this.sPath = sPath;
    this._pos = null;
    this._width = 0;

  }

  render(){
    this.node_template = `
    <ellipse cx = '0' cy = '0' rx = '50' ry = '50' />
    <text>Hey</text>
    `
    this.el = create('svg');

    this.el.setProps({
      viewBox: '-50 -50 100 100',
      x: `${this.pos.x}`,
      y: `${this.pos.y}`,
      width: '0.8',
      preserveAspectRation: 'xMidYMid'
    });
    this.el.innerHTML = this.node_template
    this.sPath.sTree.node_svg.appendChild(this.el)
  }

  set pos(pos){
    this._pos = pos;
  }
  get pos(){
    return this._pos
  }
  set width(w){
    this._width = w;
  }
  get width(){
    return this._width
  }
}
