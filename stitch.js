class Stitch{
  constructor(point){
    //Node values
    this.point = point.round();

    //Pointers
    this.next = null;
    this.last = null;
  }
  reflect(mode = 'v'){
    if (mode.indexOf('v') != -1){
      this.point.x = this.point.x*-1
    }
    if (mode.indexOf('h') != -1){
      this.point.y = this.point.y*-1
    }
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
    let d = '';
    let cur = this
    while (cur != null){
      if (cur.last == null){
        d += `M${this.point}`
      }else{
        d += `L${cur.point}`
      }
      cur = cur.next;
    }
    return d
  }
}

class SPath{
  constructor(sTree){
    this.sTree = sTree;
    this.vNode = new VNode(this)

    this._end = null;
    this._start = null;
    this.size = 0;
    this._color = 'red';

    this.mode = 'join'; // join | stitch | uncomputed

    this.parent = null;
    this.children = [];
  }

  appendChild(child){
    this.children.push(child)
    child.parent = this;
    child.setVisualizerParent(this.visualizer_group)
  }
  removeChild(child_to_remove){
    let newChildren = [];
    this.visualizer_group.removeChild(child_to_remove.visualizer_group)

    for (var i = 0; i < this.children.length; i++){
      let child = this.children[i]
      if (child != child_to_remove){
        newChildren.push(child)
      }
    }
    this.children = newChildren
    if (this.children.length == 1){
      this.set(this.children[0])
    }
    this.sTree.VNodeRender();
  }

  set(sPath){
    this.start = sPath.start;
    this.end = sPath.end;
    this.color = sPath.color;
    this._mode = null;
    this.mode = sPath.mode;
    this.children = sPath.children;
    this.visualizer_group.innerHTML = ''
    if (sPath.visualizer_group){
      this.visualizer_group.appendChild(sPath.visualizer_path)
    }
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
    }else if(mode == 'computed'){
      let d = group.children[0].getD();
      d = d.replace(' ', '').replace('M', '').split('L');
      for (var i = 0; i < d.length; i++){
        let ps = d[i].split(',')
        let p = new Vector(ps[0], ps[1])
        this.push(new Stitch(p))
      }
      this.mode = 'computed'
    }
  }

  focus(){
    let point = this.end.point
    let cur = this.end
    if(cur != this.start){
      for (var i = 0; i < 5; i++){
        cur = cur.last;
        point = point.add(cur.point)
        if(cur == this.start){
          break;
        }
      }
    }
    point = point.div(5)
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

  // Path visualizer
  removeVisualizer(){
    this.visualizer_parent.removeChild(this.visualizer_path)
    this.visualizer_parent = null
    this.visualizer_path = null;
  }
  setVisualizerParent(svg){
    this.visualizer_group = create('g')

    this.visualizer_path = create('path')
    this.visualizer_path.SPath = this
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
    if(this.mode == 'uncomputed'){
      this.mode = 'computing'
      this.stitchGenerator.computeOnAnimationFrame(() => {
        this.mode = 'computed'
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
  set mode(mode){
    this._mode = mode;
    if (this.visualizer_group){
      this.visualizer_group.setAttribute('mode',mode)
    }
    if (this.vNode){
      this.vNode.update()
    }
  }
  get mode(){
    return this._mode
  }
  set progress(progress){
    this._progress = progress;
    this.vNode.update();
  }
  get progress(){
    if (this._progress){
      return this._progress
    }else{
      return null
    }
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
  insertLoop(loop, location){
    loop.push(loop.start.clone())
    loop.push(location.clone())

    this.putAfter(loop, location)
  }

  isLoop(max_length = 40){
    if (this.end != null && this.start != null){
      return this.end.distance(this.start) < max_length
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

  get progress(){
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
          this.sPath.progress = this.progress
          this.sPath.focus()
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
    this.sPath.focus()
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
    this.box = document.getElementById('output-svg-box');
    this.input_svg = input_svg
    this.output_svg = output_svg
    this.node_svg = null
    this.root = new SPath(this)
    this.root.setVisualizerParent(output_svg)
    this.root.build(input_svg)
  }

  VNodeSetup(svg){
    this.node_svg = svg;
    this.VNodeRender()
  }

  VNodeRender(){
    let height = 0;

    let recursiveHelp = (node, level=0, lastWidth = 0) => {
      height = height < level? level:height;

      // Children
      if(node.children.length > 0){

        var width = 0;
        for(var i in node.children){
          width += recursiveHelp(node.children[i], level + 2, width + lastWidth);
        }

        node.vNode.width = width;
        node.vNode.pos = new Vector(lastWidth + width/2, level);

        return width

        // Leaf
      }else{
        node.vNode.width = 1;
        node.vNode.pos = new Vector(lastWidth + 0.5, level);
        return 1
      }
    }
    let width = recursiveHelp(this.root)
    this.node_svg.setProps({
      viewBox: `0 -1 ${width} ${height + 2}`
    })

    this.node_svg.innerHTML = ''
    let links = create('g')
    this.node_svg.appendChild(links)
    let recursiveHelp2 = (node) => {
      this.node_svg.appendChild(node.vNode.node)
      if (node.parent){
        links.innerHTML += node.vNode.link(node.parent.vNode)
      }
      for (var i = 0; i < node.children.length; i++){
        recursiveHelp2(node.children[i])
      }
    }
    recursiveHelp2(this.root)
  }


}

class VNode{
  constructor(sPath){
    this.sPath = sPath;
    this._pos = null;
    this._width = 0;
    this.rad = 0.3;
    this.colors = {
      join: '#ffd400',
      uncomputed: '#ff3765',
      computed: '#2988ff',
      computing: '#9dc9ff'
    }
  }

  setColor(color){
    if (this.el){
      this.el.setFill(color)
    }
  }


  onClick(){
    let mode = this.sPath.mode;
    if (mode == 'uncomputed'){
      this.sPath.compute(() => {
        this.sPath.sTree.VNodeRender()
      })
    }else if (mode == 'join'){
      if (this.sPath.isComputed()){
        this.setColor('#FFFFFF')
        let join = new JoinFriend(this.sPath.children)
      }else{
        this.sPath.computeAll()
      }
    }else if(mode == 'computed'){
      tools.style.setProperty('visibility', 'visible')
      let exporter = new DSTExporter(this.sPath.sTree.download_element)
      exporter.exportSPath(this.sPath)
    }
  }

  update(){
    if (this.el){
      this.el.innerHTML = ''
      this.el.appendChild(this.ellipse)
      this.el.appendChild(this.progress)
      this.el.onclick = () => {
        this.onClick()
      }
    }
  }

  get node(){
    this.el = create('g')
    this.update();
    return this.el
  }

  get ellipse(){
    let ellipse = create('ellipse')
    ellipse.setProps({
      fill: this.mode_color,
      cx: `${this.pos.x}`,
      cy: `${this.pos.y}`,
      rx: `${this.rad}`,
      ry: `${this.rad}`,
    })
    return ellipse
  }
  get progress(){
    let path = create('path');
    let progress = this.sPath.progress;
    if(this.sPath.progress != null){
      let p1 = new Vector(0, - this.rad);
      let p2 = p1.rotate(Math.PI*2*progress);
      p1 = p1.add(this.pos)
      p2 = p2.add(this.pos)
      path.setD(`M${this.pos}L${p1}A${this.rad},${this.rad},0,${progress>0.5?'1':'0'},1,${p2}`)
      path.setFill(this.colors['computed'])
    }
    return path
  }

  link(parent){
    let c1 = this.pos.sub(new Vector(0, 1))
    let c2 = parent.pos.add(new Vector(0, 1))
    return `<path d = 'M${this.pos}C${c1},${c2},${parent.pos}' fill = 'none' stroke = '#04a2ff' stroke-width = '0.05'/>`
  }

  get mode_color(){
    return this.colors[this.sPath.mode]
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

class JoinFriend{
  constructor(sPaths){
    this.toolBox = document.getElementById('tool-box')
    this.toolBox.style.setProperty('visibility', 'visible')
    this.sPaths = sPaths

    this.sPath = this.sPaths.shift()
    this.sPath_2 = this.sPath_1;

    this.svg = this.sPath.sTree.output_svg
    this.closest = null;
    this.merger = true;
    this.insert_location = null

    this.cursors = create('g');
    this.svg.appendChild(this.cursors)
    this.addEventListners()
    this.createCursor()
    this.highlight()
  }

  addEventListners(){
    this.svg.onclick = (e) => {
      this.click(e)
    }

    this.svg.onmousemove = (e) => {
      this.mousemove(e)
    }

    this.toolBox.onwheel = (e) => {
      this.wheel(e)
    }

    this.toolBox.onclick = (e) => {
      this.click(e)
    }
  }
  stopEventListners(){
    this.svg.onclick = null
    this.svg.onmousemove = null
  }
  clearCursor(){
    this.svg.removeChild(this.cursors)
    this.toolBox.style.setProperty('visibility', 'hidden')
  }
  createCursor(){
    this.cursor = create('ellipse')
    this.cursor.setProps({
      cx: '0',
      cy: '0',
      rx: '5',
      ry: '5',
      fill: 'none',
      stroke: 'green'
    })
    this.cursors.appendChild(this.cursor)
  }

  highlight(){
    this.svg.parentNode.style.setProperty('--hide', 0.3)
    this.sPath.visualizer_path.setProps({
      style: {
        opacity: '1'
      }
    })
  }
  unhighlight(){
    this.svg.parentNode.style.setProperty('--hide', 1)
    this.sPath.visualizer_path.setProps({
      style: {
        opacity: 'var(--hide)'
      }
    })
  }

  wheel(e){
    if(this.closest == null){
      console.log(this.closest);
        this.closest = {
          node: this.sPath.start,
          i: 0,
        }
    }else{
      if (e.deltaY > 0){
        if (this.closest.node == this.sPath.end){
          this.closest.node = this.sPath.start;
          this.closest.i = 0;
        }else{
          this.closest.node = this.closest.node.next;
          this.closest.i ++;
        }
      }else{
        if (this.closest.node == this.sPath.start){
          this.closest.node = this.sPath.start;
          this.closest.i = this.sPath.size - 1;
        }else{
          this.closest.node = this.closest.node.last;
          this.closest.i --;
        }
      }
      this.setCursor(this.closest.node.point)
    }
  }

  click(){
    this.unhighlight()
    if (this.merger){
      this.merger = false;

      this.insert_location = this.closest.node

      this.sPath_2 = this.sPath;
      this.sPath = this.sPaths.shift();

      this.cursor.setStroke('#8888FF')
      this.cursor.setFill('#0000FF')
      this.createCursor()
      this.highlight()
    }else{
      this.sPath.rotate(this.closest.i)
      this.sPath_2.insertLoop(this.sPath, this.insert_location)
      this.sPath_2.parent.removeChild(this.sPath)

      if (this.sPaths.length < 1){
        this.stopEventListners()
        this.clearCursor()
        this.sPath_2.parent.set(this.sPath_2)
        this.sPath_2.parent.vNode.update()
      }else{
        this.sPath = this.sPath_2;
        this.merger = true;
        this.highlight()
      }
    }
  }

  mousemove(event){
    let p = this.relMousePoint(event)
    let c = this.closestPoint(p)
    this.closest = c
    this.setCursor(c.node.point)
  }

  relMousePoint(event){
    let m = new Vector(event)
    let vb = this.svg.getAttribute('viewBox').split(' ')
    let vs = new Vector(vb[2], vb[3])
    vb = new Vector(vb[0], vb[1])
    let size = new Vector(this.svg.clientWidth, this.svg.clientHeight);
    let fact = vs.div(size)
    var t = this.svg.getBoundingClientRect().top;
    var l = this.svg.getBoundingClientRect().left;
    let offset = new Vector(l, t)

    let point = m.sub(offset).mul(fact).add(vb)
    return point
  }

  setCursor(p){
    if (this.closest != null){
      let disp = `path-offset: ${this.closest.i}`
      this.toolBox.children[0].innerHTML = disp;
    }
    this.cursor.setProps({
      cx: `${p.x}`,
      cy: `${p.y}`
    })
  }

  closestPoint(p){
    let i = 0;
    let cur = this.sPath.start
    let d = cur.point.distance(p)
    let soln = {
      node: cur,
      i: 0,
      d: d
    }
    while (cur != this.sPath.end) {
      cur = cur.next;
      i++;
      d = cur.point.distance(p);
      if (d < soln.d){
        soln = {
          node: cur,
          i: i,
          d: d
        }
      }
    }
    return soln
  }
}
