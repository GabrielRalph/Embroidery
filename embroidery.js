class EmbroideryCam{
  constructor(svg){
    this.segs = []
    this.render_svg = svg
    this.length = 0
    this.lookup = {
      M: ['x','y'],
      m: ['dx','dy'],
      L: ['x','y'],
      l: ['dx','dy'],
      H: ['x'],
      h: ['dx'],
      V: ['y'],
      v: ['dy'],
      C: ['x1', 'y1', 'x2', 'y2', 'x', 'y'], //Control pointes (x1,y1), (x2, y2)
      c: ['dx1', 'dy1', 'dx2', 'dy2', 'dx', 'dy'],
      S: ['x2', 'y2', 'x', 'y'],
      s: ['dx2', 'dy2', 'dx', 'dy'],
      Q: ['x1', 'y1', 'x', 'y'],
      q: ['dx1', 'dy1', 'dx', 'dy'],
      T: ['x','y'],
      t: ['dx','dy'],
      A: ['rx', 'ry', 'x-axis-rotation', 'large-arc-flag', 'sweep-flag', 'x', 'y'],
      a: ['rx', 'ry', 'x-axis-rotation', 'large-arc-flag', 'sweep-flag', 'dx', 'dy'],
      z: ['x', 'y'],
      Z: ['x', 'y'],
    }
    this.stitch_length = 3
    this.angle_threshold = 150
    this.resolution = 0.1

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

          i -= sl/2;
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
      stroke: 'green',
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
