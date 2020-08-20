
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
    this.start_point = new Vector(0,0)
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
    let jump_path = new Path()
    jump_path.push(point1)

    for (var i = 0; i < n; i++){
      float_points.push(float_points[i].add(inc))
      jump_path.push(float_points[i].add(inc))
    }
    jump_path.push(point2)
    jump_path.mode = 'jump';
    return jump_path
  }

  encodeSPath(sPath){
    sPath.reflect('h')
    sPath.tieOff()

    let lastPoint = sPath.start.point
    let jump = null
    if (lastPoint.distance(this.start_point) > 5){
      jump = this.jumpAcross(this.start_point, lastPoint)
    }
    let start = 1;

    let lastColor = null;

    if (jump != null){
      let cur = jump.start;
      while (cur != jump.end){
        cur = cur.next;
        let dPoint = cur.point.sub(cur.last.point)
        this.addPoint(dPoint, 'jump')

        this.minx = cur.point.x<this.minx?cur.point.x:this.minx
        this.miny = cur.point.y<this.miny?cur.point.y:this.miny
        this.maxx = cur.point.x>this.maxx?cur.point.x:this.maxx
        this.maxy = cur.point.y>this.maxy?cur.point.y:this.maxy
      }
    }
    lastPoint = sPath.start
    while(lastPoint != sPath.end){
      lastPoint = lastPoint.next;
      let dPoint = lastPoint.point.sub(lastPoint.last.point)
      this.addPoint(dPoint, 'stitch')

      this.minx = lastPoint.point.x<this.minx?lastPoint.point.x:this.minx
      this.miny = lastPoint.point.y<this.miny?lastPoint.point.y:this.miny
      this.maxx = lastPoint.point.x>this.maxx?lastPoint.point.x:this.maxx
      this.maxy = lastPoint.point.y>this.maxy?lastPoint.point.y:this.maxy
    }
    this.start_point = lastPoint.point;
  }
}
class DSTExporter{
  constructor(element = null){
    this.dstBuffer = new DSTBuffer()
  }

  downloadURL(){
    this.dstBuffer.addEnd();
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
    return url
  }

  addSNode(sNode){
    if (sNode instanceof SPath){
      this.dstBuffer.encodeSPath(sNode)
    }else if(sNode instanceof SJoin){
      sNode.children.forEach((child) => {
        this.addSNode(child)
      });
    }
  }
}
