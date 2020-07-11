let svg = document.getElementById('svg')

class SatinColumn{
  constructor(svg_group){
    this.group = svg_group
    this.stitchRender = new StitchRender(this.group)
    this.stitchRender.setStyle({
      stroke: 'red',
      'stroke-width': '1'
    }, 'line_style')
    this.path_a = svg_group.getElementsByTagName('path')[0]
    this.path_b = svg_group.getElementsByTagName('path')[1]

    this.stitchLength = 3.5;
  }

  compute(){
    let len_a = this.path_a.getTotalLength();
    let len_b = this.path_b.getTotalLength();

    let len_avg = (len_a + len_b)/2;
    let stitch_num = len_avg/this.stitchLength;


    let inc_a = len_a/stitch_num;
    let inc_b = len_b/stitch_num;
    var a, b;
    for (a = len_a, b = 0; a >= 0; a -= inc_a, b += inc_b){
      let pa = new Vector(this.path_a.getPointAtLength(a))
      let pb = new Vector(this.path_b.getPointAtLength(b))
      this.stitchRender.addStitch(pa.round())
      this.stitchRender.addStitch(pb.round())
    }
  }
}
let groups = svg.getElementsByTagName('g')
// for (var i = 0; i < groups.length; i++){
//   let sc = new SatinColumn(groups[i])
//   sc.compute()
// }

class PathPattern{
  constructor(svg_pattern){
    this.pattern = svg_pattern;
    this.size = 2;
  }


  setPath(path){
    let parent = path.parentNode
    let len = path.getTotalLength();
    for (var i = 0; i < len/this.size; i+= this.size){
      let p = new Vector(path.getPointAtLength(i))
      let dp = new Vector(path.getPointAtLength(i + 0.001))
      let riserun = dp.sub(p);
      let theta = dp.arg()*180/Math.PI;

      // let copy = this.pattern.cloneNode(true);
      // copy.setAttribute('x',p.x)
      // copy.setAttribute('y',p.y)
      // copy.setAttribute('width',this.size)
      // copy.setAttribute('style', `transform: rotate(${theta}deg)`)
      // parent.appendChild(copy)
    }
  }
}

let pp = new PathPattern(svg)
pp.setPath(groups[5].getElementsByTagName('path')[0])
