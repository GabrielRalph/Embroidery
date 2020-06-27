class EmbroideryCam{
  constructor(svg){
    this.segs = []
    this.render_svg = svg

    this.stitch_length = 4
    this.angle_threshold = 165
    this.resolution = 0.15
    this.lastColor = null
    this.operations = []

  }


// | 1 | -1 |  3 | -3 |  9 | -9 | 27 | -27 | 81 | -81 |
//-----------------------------------------------------
// | a |  b |  c |  d |  e | f  | g  |  h  |  i |  j  |

//x = a - b + 3c - 3d + 9e - 9f + 27g - 27h + 81i - 81j

  decToDst(x, y = 'stitch', mode = 'stitch'){
    if (x instanceof Vector){
      let v = x.assign();
      mode = y
      x = v.x;
      y = v.y;
    }

    let b1 = 0;
    let b2 = 0;
    let b3 = (1<<0)|(1<<1);

    if(mode == 'jump'){
      b3 |= (1<<7)
      console.log('j');
    }else if(mode == 'color'){
      b3 |= (1<<7)|(1<<6)
      return [b1, b2, b3]
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
    let x = b(b1, 0) - b(b1, 1) + 9*b(b1, 2) - 9*b(b1, 3) + 3*b(b2, 0) -3*b(b2, 1)
    x +=   27*b(b2, 2) - 27*b(b2, 3) + 81*b(b3, 2) - 81*b(b3, 3);
    let y = b(b1, 7) - b(b1, 6) + 9*b(b1, 5) - 9*b(b1, 4) + 3*b(b2, 7) -3*b(b2, 6)
    y += 27*b(b2, 5) - 27*b(b2, 4) + 81*b(b3, 5) -81*b(b3, 4);
    return {x: x, y: y}
  }

  export(){
    let data = this.decodeDST()
    let header = new Header(data)
    let dst = header.buffer.concat(data.binBuffer)
    dst.push(0)
    dst.push(0)
    dst.push(243)
    let n = dst.length

    let array = new Uint8Array(n)
    for (var i = 0; i < n; i++){
      if(typeof dst[i] == 'string'){
        array[i] = dst[i].charCodeAt(0)
      }else{
        array[i] = dst[i]
      }
    }
    let dst_blob = new Blob([array], {type: "application/octet-stream"})
    // let file = new File([dst_blob], 'mycam.DST')

    var url = window.URL.createObjectURL(dst_blob);

    document.getElementById('download_link').href = url;

  }

  decodeDST(){
    let lastPoint = new Vector()
    let start = 1;
    let buffer = [];
    let stitch_count = 0;
    let color_changes = 0;
    let maxx = -10000000000;
    let maxy = -10000000000;
    let minx = 100000000000;
    let miny = 100000000000;
    this.operations.forEach((op) => {
      if(op.points){
        let points = op.points
        for (var i = start; i < points.length; i++){
          stitch_count++
          let p = points[i]
          let dPoint = p.sub(lastPoint)
          let dstPoint = this.decToDst(dPoint, op.type)
          buffer.push(dstPoint[0])
          buffer.push(dstPoint[1])
          buffer.push(dstPoint[2])
          minx = p.x<minx?p.x:minx
          miny = p.y<miny?p.y:miny
          maxx = p.x>maxx?p.x:maxx
          maxy = p.y>maxy?p.y:maxy
          lastPoint = p
        }
        start = 0
      }else{
        stitch_count++
        color_changes++
        buffer.push(0)
        buffer.push(0)
        buffer.push(195)
      }
    })
    return {
      binBuffer: buffer,
      label: 'MYCAM',
      stitchCount: stitch_count,
      colorChanges: color_changes,
      maxx: Math.round(maxx),
      maxy: Math.round(maxy),
      minx: Math.round(minx),
      miny: Math.round(miny)
    }
  }
  camPaths(svg){
    this.operations = []

    let paths = svg.getElementsByTagName('path')
    let n = paths.length
    let last_point = new Vector()

    for (var i = 0; i < n; i++){
      let stitch_points = this.runningStitch(paths[i])
      console.log(stitch_points[0]);
      if(last_point instanceof Vector && stitch_points[0] instanceof Vector){
        let jump_points = this.moveTo(last_point, stitch_points[0])
        this.operations.push({
          type: 'jump',
          points: jump_points
        })
        this.operations.push({
          type: 'stitch',
          points: stitch_points
        })
        last_point = stitch_points[stitch_points.length -1]
      }
    }
    return this.operations
  }

  runningStitch(path){
    let sl = this.stitch_length/this.resolution
    let stitchRender = new StitchRender(this.render_svg)
    console.log({it:path.attributes.class});
    let color = path.getAttribute('stroke')
    if(this.lastColor != null && color != this.lastColor){
      this.operations.push({type: 'color'})
    }
    if(color != null){
      stitchRender.setStyle({
        stroke: color
      })
    }
    this.lastColor = color;
    let length = path.getTotalLength()

    let vbuff = []
    let stitch_points = []

    for (var i = 0; i < length; i += sl){
      let v = new Vector(path.getPointAtLength(i))
      vbuff.push(v)
      if(vbuff.length > 2){
        let a = vbuff[1].sub(vbuff[0])
        let b = vbuff[1].sub(vbuff[2])
        let angle = a.angleBetween(b)*180/Math.PI
        if(angle > this.angle_threshold){
          vbuff.shift()
        }else{

          i -= sl/2.5;
          v = new Vector(path.getPointAtLength(i))
          vbuff.pop()
          vbuff.push(v)
          vbuff.shift()
        }
      }

      let stitch_point = v.round()

      stitchRender.addStitch(stitch_point)
      stitch_points.push(stitch_point)
    }
    let v = new Vector(path.getPointAtLength(length))
    let stitch_point = v.round()

    stitchRender.addStitch(stitch_point)
    stitch_points.push(stitch_point)

    return stitch_points
  }

  moveTo(point1, point2){
    let m = Math.abs(point1.grad(point2))
    let inc = new Vector()
    if (m < 1){
      inc.x = 120*(point2.x - point1.x)/Math.abs(point2.x - point1.x);
      inc.y = 120*m*(point2.y - point1.y)/Math.abs(point2.y - point1.y);
    }else{
      inc.x = 120*(point2.x - point1.x)/Math.abs(point2.x - point1.x)/m;
      inc.y = 120*(point2.y - point1.y)/Math.abs(point2.y - point1.y);
    }
    let inc_dist = inc.norm()
    let move_dist = point1.distance(point2)
    let n = Math.floor(move_dist/inc_dist)
    let float_points = [point1]
    for (var i = 0; i < n; i++){
      float_points.push(float_points[i].add(inc))
    }
    float_points.push(point2)

    let stitch_points = []
    let stitchRender = new StitchRender(this.render_svg)
    stitchRender.setStyle({
      stroke: 'rgba(0,255,0,0.2)',
      'stroke-width': '2',
    }, 'line_style')
    stitchRender.setStyle({
      stroke: 'rgb(0,100,0)',
      'stroke-width': '3',
    }, 'dot_style')
    float_points.forEach((stitch) => {
      let stitch_point = stitch.round()
      stitch_points.push(stitch_point)
      stitchRender.addStitch(stitch_point)
    });
    return stitch_points
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
      stroke: 'rgb(150,0,0)',
      'stroke-width': '4',
      fill: 'none',
      'stroke-linecap': 'round',
    }
    this.line_style = {
      stroke: 'red',
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

class PathPoint{
  constructor(string){
    this.type = string[0];
    string = string.substring(1)
    this.values = string.replace(/(?!(^-))-/g, ',-').split(',');

    this.p = null
    this.c1 = null
    this.c2 = null

    this.dp = null
    this.dc1 = null
    this.dc2 = null

    this.r = null
    this.x_axis_rotation = 0
    this.large_arc_flag = 0
    this.sweep_flag = 0
  }

  set(relPathPoint){
    if(this.type.toUpperCase() == this.type){
      if (this.type == 'V'){
        this.p = relPathPoint.p.assign()
        this.p.y = this.values[0];
      }else if(this.type == 'H'){
        this.p = relPathPoint.p.assign()
        this.p.x = this.values[0];
      }else{
        this.p = new Vector(this.values, this.values.length - 2)
      }

      if (this.type == 'C'){
        this.c2 = new Vector(this.values, this.values.length - 4)
        this.c1 = new Vector(this.values)
      }else if(this.type == 'S'){
        this.c2 = new Vector(this.values)
        this.c1 = relPathPoint.c2.mul(-1)
      }else if(this.type == 'Q'){
        this.c1 = new Vector(this.values)
        this.c2 = this.c1.assign()
      }
    }


  }
}
class Header{
  constructor(data = null){
    this.buffer = []
    if(data != null){
      this.create(data)
    }
  }

  pushString(string){
    for (var i = 0; i < string.length; i++){
      this.buffer.push(string[i])
    }
  }
  pad(value, n){
    for(var i = 0; i < n; i++){
      this.buffer.push(value)
    }
  }
  push(value){
    if(typeof value == 'string'){
      this.pushString(value)
    }else{
      this.buffer.push(value)
    }
  }

  add(info){
    info.label = `${info.label}`
    info.value = `${info.value}`
    this.push(info.label)
    if (info.trail != undefined){
      this.push(info.value)
      this.pad(info.trail, info.size - info.value.length)
    }else if(info.lead != undefined){
      this.pad(info.lead, info.size - info.value.length)
      this.push(info.value)
    }
    this.push(0x0D)
  }

  create(data){
    //['LA:', 'ST:', 'CO:', '+X:','-X:', '+Y:', '+Y:', 'AX:', 'AY:', 'MX:', 'MY:', 'PD:']

    this.add({label: 'LA:', trail: 0x20, value: data.label, size: 16})

    this.add({label: 'ST:', lead: 0, value: data.stitchCount, size: 7})

    this.add({label: 'CO:', lead: 0, value: data.colorChanges, size: 3})

    this.add({label: '+X:', lead: 0, value: data.maxx, size: 5})
    this.add({label: '-X:', lead: 0, value: data.minx, size: 5})
    this.add({label: '+Y:', lead: 0, value: data.maxy, size: 5})
    this.add({label: '-Y:', lead: 0, value: data.miny, size: 5})
    this.add({label: '+X:', lead: 0, value: data.maxx, size: 5})
    this.add({label: '-X:', lead: 0, value: data.minx, size: 5})
    this.add({label: '+Y:', lead: 0, value: data.maxy, size: 5})
    this.add({label: '-Y:', lead: 0, value: data.miny, size: 5})

    this.push('AX:+')
    this.pad(0, 4)
    this.push('0')
    this.push(0x0D)

    this.push('AY:+')
    this.pad(0, 4)
    this.push('0')
    this.push(0x0D)

    this.push('MX:+')
    this.pad(0, 4)
    this.push('0')
    this.push(0x0D)

    this.push('MY:+')
    this.pad(0, 4)
    this.push('0')
    this.push(0x0D)

    this.push('PD:******')
    this.pad(0x0D, 3)

    this.pad(0x20, 512 - this.buffer.length)
  }
}
let b = (b, c) => {
  return ((b>>c)&1)
}
