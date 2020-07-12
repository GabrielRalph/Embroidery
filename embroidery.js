
function DSTHeader(data){

  let buffer = []

  let pushString = (string) => {
    for (var i = 0; i < string.length; i++){
      buffer.push(string[i])
    }
  }
  let push = (value) => {
    if(typeof value == 'string'){
      pushString(value)
    }else{
      buffer.push(value)
    }
  }
  let pad = (value, n) => {
    for(var i = 0; i < n; i++){
      buffer.push(value)
    }
  }
  let add = (info) => {
    info.label = `${info.label}`
    info.value = `${info.value}`
    push(info.label)
    if (info.trail != undefined){
      push(info.value)
      pad(info.trail, info.size - info.value.length)
    }else if(info.lead != undefined){
      pad(info.lead, info.size - info.value.length)
      push(info.value)
    }
    push(0x0D)
  }


  //['LA:', 'ST:', 'CO:', '+X:','-X:', '+Y:', '+Y:', 'AX:', 'AY:', 'MX:', 'MY:', 'PD:']

  add({label: 'LA:', trail: 0x20, value: data.label, size: 16})

  add({label: 'ST:', lead: 0, value: data.stitch_count, size: 7})

  add({label: 'CO:', lead: 0, value: data.color_changes, size: 3})

  add({label: '+X:', lead: 0, value: data.maxx, size: 5})
  add({label: '-X:', lead: 0, value: data.minx, size: 5})
  add({label: '+Y:', lead: 0, value: data.maxy, size: 5})
  add({label: '-Y:', lead: 0, value: data.miny, size: 5})
  add({label: '+X:', lead: 0, value: data.maxx, size: 5})
  add({label: '-X:', lead: 0, value: data.minx, size: 5})
  add({label: '+Y:', lead: 0, value: data.maxy, size: 5})
  add({label: '-Y:', lead: 0, value: data.miny, size: 5})

  push('AX:+')
  pad(0, 4)
  push('0')
  push(0x0D)

  push('AY:+')
  pad(0, 4)
  push('0')
  push(0x0D)

  push('MX:+')
  pad(0, 4)
  push('0')
  push(0x0D)

  push('MY:+')
  pad(0, 4)
  push('0')
  push(0x0D)

  push('PD:******')
  pad(0x0D, 3)

  pad(0x20, 512 - buffer.length)
  return buffer
}

class DSTBuffer{
  constructor(){
    this.buffer = []
    this.maxx = -10000000000;
    this.maxy = -10000000000;
    this.minx = 100000000000;
    this.miny = 100000000000;
    this.label = "MyCam";
    this.stitch_count = 0;
    this.color_changes = 0;
  }
  decToDst(p, mode = 'stitch'){
    let x = 0;
    let y = 0;
    let b1 = 0;
    let b2 = 0;
    let b3 = (1<<0)|(1<<1);

    if (p instanceof Vector){
      x = p.x;
      y = p.y;
    }else if (p == 'color'){
      b3 |= (1<<7)|(1<<6)
      return [b1, b2, b3]
    }

    if(mode == 'jump'){
      b3 |= (1<<7)
    }

    let y_sign = y/Math.abs(y);
    y = Math.abs(y)

    //Set Y +-1
    let t1 = y%3;
    if(t1 == 1){
      if(y_sign > 0){
        b1 |= (1<<7)
      }else{
        b1 |= (1<<6)
      }
    }else if(t1 == 2){
      if(y_sign > 0){
        b1 |= (1<<6)
      }else{
        b1 |= (1<<7)
      }
    }

    //Set Y +- 9
    let t9 = Math.ceil(((y - 4)%27)/9);
    if(t9 == 1){
      if(y_sign > 0){
        b1 |= (1<<5)
      }else{
        b1 |= (1<<4)
      }
    }else if(t9 == 2){
      if(y_sign > 0){
        b1 |= (1<<4)
      }else{
        b1 |= (1<<5)
      }
    }

    //Set Y +- 3
    let t3 = Math.ceil(((y - 1)%9)/3);
    if(t3 == 1){
      if(y_sign > 0){
        b2 |= (1<<7)
      }else{
        b2 |= (1<<6)
      }
    }else if(t3 == 2){
      if(y_sign > 0){
        b2 |= (1<<6)
      }else{
        b2 |= (1<<7)
      }
    }

    //Set Y +- 27
    let t27 = Math.ceil(((y - 13)%81)/27);
    if(t27 == 1){
      if(y_sign > 0){
        b2 |= (1<<5)
      }else{
        b2 |= (1<<4)
      }
    }else if(t27 == 2){
      if(y_sign > 0){
        b2 |= (1<<4)
      }else{
        b2 |= (1<<5)
      }
    }

    //Set Y +- 81
    let t81 = Math.ceil(((y - 40)%243)/81);
    if(t81 == 1){
      if(y_sign > 0){
        b3 |= (1<<5)
      }else{
        b3 |= (1<<4)
      }
    }else if(t81 == 2){
      if(y_sign > 0){
        b3 |= (1<<4)
      }else{
        b3 |= (1<<5)
      }
    }


    let x_sign = x/Math.abs(x);
    x = Math.abs(x)

    //Set Y +-1
    t1 = x%3;
    if(t1 == 1){
      if(x_sign > 0){
        b1 |= (1<<0)
      }else{
        b1 |= (1<<1)
      }
    }else if(t1 == 2){
      if(x_sign > 0){
        b1 |= (1<<1)
      }else{
        b1 |= (1<<0)
      }
    }

    //Set Y +- 9
    t9 = Math.ceil(((x - 4)%27)/9);
    if(t9 == 1){
      if(x_sign > 0){
        b1 |= (1<<2)
      }else{
        b1 |= (1<<3)
      }
    }else if(t9 == 2){
      if(x_sign > 0){
        b1 |= (1<<3)
      }else{
        b1 |= (1<<2)
      }
    }

    //Set Y +- 3
    t3 = Math.ceil(((x - 1)%9)/3);
    if(t3 == 1){
      if(x_sign > 0){
        b2 |= (1<<0)
      }else{
        b2 |= (1<<1)
      }
    }else if(t3 == 2){
      if(x_sign > 0){
        b2 |= (1<<1)
      }else{
        b2 |= (1<<0)
      }
    }

    //Set Y +- 27
    t27 = Math.ceil(((x - 13)%81)/27);
    if(t27 == 1){
      if(x_sign > 0){
        b2 |= (1<<2)
      }else{
        b2 |= (1<<3)
      }
    }else if(t27 == 2){
      if(x_sign > 0){
        b2 |= (1<<3)
      }else{
        b2 |= (1<<2)
      }
    }

    //Set Y +- 81
    t81 = Math.ceil(((x - 40)%243)/81);
    if(t81 == 1){
      if(x_sign > 0){
        b3 |= (1<<2)
      }else{
        b3 |= (1<<3)
      }
    }else if(t81 == 2){
      if(x_sign > 0){
        b3 |= (1<<3)
      }else{
        b3 |= (1<<2)
      }
    }

    return [b1, b2, b3]
  }
  dstToDec(b1, b2, b3){
    let b = (b, c) => {
      return ((b>>c)&1)
    }
    let x = b(b1, 0) - b(b1, 1) + 9*b(b1, 2) - 9*b(b1, 3) + 3*b(b2, 0) -3*b(b2, 1)
    x +=   27*b(b2, 2) - 27*b(b2, 3) + 81*b(b3, 2) - 81*b(b3, 3);
    let y = b(b1, 7) - b(b1, 6) + 9*b(b1, 5) - 9*b(b1, 4) + 3*b(b2, 7) -3*b(b2, 6)
    y += 27*b(b2, 5) - 27*b(b2, 4) + 81*b(b3, 5) -81*b(b3, 4);
    return {x: x, y: y}
  }


  addPoint(p, mode){
    let b = this.decToDst(p, mode)
    this.buffer.push(b[0])
    this.buffer.push(b[1])
    this.buffer.push(b[2])
  }

  addEnd(){
    this.buffer.push(0)
    this.buffer.push(0)
    this.buffer.push(243)
  }

  encodeStitchCam(stitchCam){
    let lastPoint = new Vector()

    let start = 1;

    let lastColor = null;


    stitchCam.forEachCommand((op) => {
      let points = op.stitches
      if(op.color != null&&lastColor != null&&lastColor != op.color){
        this.addPoint('color')
        this.color_changes ++
      }else if(op.color != null){
        lastColor = op.color
      }
      for (var i = start; i < points.length; i++){
        this.stitch_count++
        let p = points[i]
        let dPoint = p.sub(lastPoint)
        this.addPoint(dPoint, op.type)

        this.minx = p.x<this.minx?p.x:this.minx
        this.miny = p.y<this.miny?p.y:this.miny
        this.maxx = p.x>this.maxx?p.x:this.maxx
        this.maxy = p.y>this.maxy?p.y:this.maxy

        lastPoint = p
      }
      start = 0;
    })
    this.addEnd()
  }

}

class DSTExporter{
  constructor(element){
    this.download_element = element;
    this.download_element.style.setProperty('visibility', 'hidden')
    this.dstBuffer = new DSTBuffer()
  }

  exportStitchCam(stitchCam){
    this.dstBuffer.encodeStitchCam(stitchCam)

    let header = DSTHeader(this.dstBuffer)
    let dst = header.concat(this.dstBuffer.buffer)

    let n = dst.length;
    let array = new Uint8Array(n)
    for (var i = 0; i < n; i++){
      if(typeof dst[i] == 'string'){
        array[i] = dst[i].charCodeAt(0)
      }else{
        array[i] = dst[i]
      }
    }

    let dst_blob = new Blob([array], {type: "application/octet-stream"})
    var url = window.URL.createObjectURL(dst_blob);

    this.download_element.href = url;
    this.download_element.style.setProperty('visibility', 'visible')
  }
}


class StitchRender{
  constructor(svg){
    this.render_dots = create('path')
    this.render_line = create('path')
    this.render_dots.setD('M0,0')
    this.render_svg = svg
    this.render_svg.appendChild(this.render_line)
    this.render_svg.appendChild(this.render_dots)
    this.dot_style = {
      stroke: 'rgba(0,0,0,0.2)',
      'stroke-width': '5',
      fill: 'none',
      'stroke-linecap': 'round',
    }
    this.line_style = {
      stroke: 'rgba(0,0,0,0.3)',
      'stroke-width': '4',
      fill: 'none',
      'stroke-linecap': 'round',
    }
    this.render_line.setProps(this.line_style)
    this.render_dots.setProps(this.dot_style)
  }

  setStyle(style, key = null){
    if(key == null){
      this.line_style = Object.assign(this.line_style, style)
      this.dot_style = Object.assign(this.dot_style, style)
    }else{
      this[key] = Object.assign(this[key], style)
    }
    this.render_line.setProps(this.line_style)
    this.render_dots.setProps(this.dot_style)
  }

  addStitch(stitch_point){
    this.render_dots.appendD(`M${stitch_point}L${stitch_point}`)
    this.render_line.addPoint(stitch_point)
  }
}

let b = (b, c) => {
  return ((b>>c)&1)
}
class Jump{
  constructor(svg){
    this.type = 'jump'
    this.svg = svg

    this.stitchRender = new StitchRender(this.svg)

    this.stitchRender.setStyle({
      stroke: 'rgba(0,255,0,0.2)',
      'stroke-width': '2',
    }, 'line_style')
    this.stitchRender.setStyle({
      stroke: 'rgb(0,100,0)',
      'stroke-width': '3',
    }, 'dot_style')
    this.stitches = []
  }

  addPoint(p){
    this.stitches.push(p.round())
    this.stitchRender.addStitch(p.round())
  }

  jumpAcross(point1, point2){

    let m = Math.abs(point1.grad(point2))
    let inc = new Vector()
    if (m < 1){
      inc.x = 118*(point2.x - point1.x)/Math.abs(point2.x - point1.x);
      inc.y = 118*m*(point2.y - point1.y)/Math.abs(point2.y - point1.y);
    }else{
      inc.x = 118*(point2.x - point1.x)/Math.abs(point2.x - point1.x)/m;
      inc.y = 118*(point2.y - point1.y)/Math.abs(point2.y - point1.y);
    }

    let inc_dist = inc.norm()
    let move_dist = point1.distance(point2)
    let n = Math.floor(move_dist/inc_dist)

    let float_points = [point1]
    this.addPoint(point1)

    for (var i = 0; i < n; i++){
      float_points.push(float_points[i].add(inc))
      this.addPoint(float_points[i].add(inc))
    }
    this.addPoint(point2)
  }

  join(obj1, obj2){
    let p1 = new Vector(0,0)
    let p2 = new Vector(0,0)
    if (obj1 instanceof Vector){
      p1 = obj1
    }else if(obj1 instanceof RunningStitch){
      p1 = obj1.stitches[obj1.stitches.length - 1]
    }
    if (obj2 instanceof Vector){
      p2 = obj2
    }else if(obj2 instanceof RunningStitch){
      p2 = obj2.stitches[0]
    }
    this.jumpAcross(p1, p2)
  }
}
class RunningStitch{
  constructor(svg){
     this.type = 'stitch'

      this.stitchLength = 2
      this.threshold = 0.3
      this.res = 0.6
      this.unit = 0.1

      this.svg = svg
      this.path = null

      this.l = 0
      this.end = 0

      this.stitches = []

      this.computed = false

      this.color = '#FFAACC'
      this.label = ''

      this.statusDisplay = null
  }

  appendStatusDisplay(element){
    this.statusDisplay = document.createElement('tr')
    this.updateStatus()
    element.appendChild(this.statusDisplay)
  }

  updateStatus(){
    this.statusDisplay.innerHTML = `<td>${this.label}</td><td>${this.stitches.length}</td><td>${Math.round(10000*this.l/this.end)/100}</td>`
  }

  setPath(path){
    this.stitchRender = new StitchRender(this.svg)
    this.l = 0
    this.path = path
    this.stitches = []
    this.computed = false

    this.statusTable = null;

    if (path.stitchProps){
      this.threshold = path.stitchProps.threshold
      this.res = path.stitchProps.res
      this.stitchLength = path.stitchProps.stitchLength
      let color = path.stitchProps.color
      if (color){
        this.stitchRender.setStyle({
          stroke: color,
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
          'stroke-width': '2',
          style: 'filter: url("#stitch")'
        }, 'line_style')

        this.color = color
      }
      this.label = path.stitchProps.label
    }


    this.end = this.path.getTotalLength()

  }

  addStitch(point, render = true){
    this.stitches.push(point.round())
    if (render) {
      this.stitchRender.addStitch(point.round())
    }
  }

  nextStitch(){
    if (this.statusDisplay != null){
      this.updateStatus()
    }
    if ((this.path == null)||(this.computed)){
      return false
    }

    if(this.stitches.length < 1){
      let first_stitch = new Vector(this.path.getPointAtLength(0))
      this.addStitch(first_stitch)
      return true
    }

    let dl = this.stitchLength/this.unit;
    let di = this.res/this.unit;
    let thresh = this.threshold/this.unit;

    let p1 = new Vector(this.path.getPointAtLength(this.l));
    let p2 = new Vector(this.path.getPointAtLength(this.l + dl));

    for (var i = di; i < dl; i += di){
      let p = new Vector(this.path.getPointAtLength(this.l + i))
      let d = p.distToLine(p1, p2)
      if (d > thresh){
        this.l += i
        if (this.l > this.end){
          let endpoint = new Vector(this.path.getPointAtLength(this.end))
          this.addStitch(endpoint)
          this.l = this.end
          return false
        }else{
          this.addStitch(p)
          return true
        }
      }
    }
    this.l += dl
    if (this.l > this.end){
      let endpoint = new Vector(this.path.getPointAtLength(this.end))
      this.addStitch(endpoint)
      this.l = this.end
      return false
    }else{
      this.addStitch(p2)
      return true
    }
  }

  addBackStitch(){
    let front = []
    let back = []
    let n = this.stitches.length
    for (var i = 1; i < 4; i++){
      front.unshift(this.stitches[i])
      back.push(this.stitches[n - 1 - i])
    }

    for (var i = 2; i >= 0; i--){
      front.unshift(this.stitches[i])
      back.push(this.stitches[n - 1 - i])
    }
    this.stitches = front.concat(this.stitches.concat(back))
  }

  getStitchCommand(){
    return {points: this.stitches, type: 'stitch', color: this.color, label: this.label}
  }
}

class StitchCam{
  constructor(svg){
    this.runningStitch = null
    this.runningStitchBuffer = []
    this.pastStitchBuffer = []
    this.svg = svg
    this.ondone = null
  }

  set done(callback){
    this.ondone = callback;
  }
  forEachCommand(callback){
    for (var i = 0; i < this.pastStitchBuffer.length; i++){
      let com = this.pastStitchBuffer[i]
      callback({
        type: com.type,
        stitches: com.stitches,
        color: com.color?com.color:null
      })
    }
  }

  //For every path in the group add a runningStitch object, set its path and add it to a buffer
  addPathGroup(group){
    let paths = group.getElementsByTagName('path')
    let n = paths.length
    for (var i = 0; i < n; i++){
      let runningStitch = new RunningStitch(this.svg)
      runningStitch.setPath(paths[i])
      this.runningStitchBuffer.push(runningStitch)
      if(this.statusTable != null){
        runningStitch.appendStatusDisplay(this.statusTable)
      }
    }
  }

  //Create a runningStitch object, set its path and add it to the buffer
  addPath(path){
    let runningStitch = new RunningStitch(this.svg)
    runningStitch.setPath(path)
    this.runningStitchBuffer.push(runningStitch)
    if(this.statusTable != null){
      runningStitch.appendStatusDisplay(this.statusTable)
    }
  }

  //Loads the next path
  nextPath(){
    if (this.runningStitchBuffer.length > 0){
      this.runningStitch = this.runningStitchBuffer.shift()
      return true
    }else{
      return false
    }
  }

  //Starts computing the points on the paths in the buffer every animation fram
  start(callback){
    let design = document.getElementById('design')
    design.style.setProperty('opacity', '0.1')
    if (this.nextPath()){
      let nextframe = () => {
        if (this.next()){
          window.requestAnimationFrame(nextframe)
        }else if(this.ondone != null){
          this.ondone();
        }
      }
      window.requestAnimationFrame(nextframe)
    }
  }

  //Computes the next point in the current path
  next(){
    if (this.runningStitch.nextStitch()){
      return true
    }else{
      this.runningStitch.addBackStitch()
      if (this.pastStitchBuffer.length > 0){
        let jump = new Jump(this.svg)
        jump.join(this.pastStitchBuffer[this.pastStitchBuffer.length - 1], this.runningStitch)
        this.pastStitchBuffer.push(jump)
        this.pastStitchBuffer.push(this.runningStitch)
      }else{
        let jump = new Jump(this.svg)
        jump.join(new Vector(0,0), this.runningStitch)
        this.pastStitchBuffer.push(jump)
        this.pastStitchBuffer.push(this.runningStitch)
      }
      return this.nextPath()
    }
  }
}
