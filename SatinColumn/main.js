let svg = document.getElementById('svg')

class SatinColumn{
  constructor(svg_group){
    this.group = svg_group
    this.stitchRender = new StitchRender(this.group)
    this.stitchRender.setStyle({
      class: 'stitch'
    }, 'line_style')
    this.path_a = svg_group.getElementsByTagName('path')[0]
    this.path_b = svg_group.getElementsByTagName('path')[1]

    this.stitchLength = 3;
    this.clump_correction = 3;
  }

  compute(){
    let len_a = this.path_a.getTotalLength();
    let len_b = this.path_b.getTotalLength();

    let len_avg = (len_a + len_b)/2;
    let stitch_num = len_avg/this.stitchLength;

    let inc_a = len_a/stitch_num;
    let inc_b = len_b/stitch_num;

    var a, b, pa, pb;
    var d = this.stitchLength;
    for (a = len_a, b = 0; a >= 0; a -= inc_a, b += inc_b){
      let pa_p = new Vector(this.path_a.getPointAtLength(a))
      let pb_p = new Vector(this.path_b.getPointAtLength(b))

      if (b > 0){
        d = (pa_p.distToLine(pa, pb) + pb_p.distToLine(pa, pb))/2;
        console.log(d);
      }
      pa = pa_p;
      pb = pb_p;

      if(d > this.stitchLength/this.clump_correction){
        this.stitchRender.addStitch(pa.round())
        this.stitchRender.addStitch(pb.round())
      }

    }
  }
}
let groups = svg.getElementsByTagName('g')
for (var i = 0; i < groups.length; i++){
  let sc = new SatinColumn(groups[i])
  sc.compute()
}
