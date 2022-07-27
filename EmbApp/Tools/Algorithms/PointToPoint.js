const name = "PointToPoint";
const properties = null;
const pattern = "g";
const icon = `
<svg viewBox="0 0 100 60" >
<g>
<path class="i-stitch" d="M75.404,46.099c6.104-9.134,8.731-25.558,16.739-37.981"/>
<path class="i-stitch" d="M44.844,32.836c0,0,9.751-6.233,11.723-8.633"/>
<path class="i-stitch" d="M61.576,27.98c2.103,5.214,5.487,10.26,9.787,16.563"/>
<path class="i-stitch" d="M27.057,13.759c4.693,6.453,9.496,12.945,12.018,18.647"/>
<path class="i-stitch" d="M23.459,14.372c-5.94,13.453-11.003,19.895-17.62,37.415"/>
</g>
<circle class="i-point" cx="92.143" cy="8.119" r="3.213"/>
<circle class="i-point" cx="73.207" cy="46.099" r="3.213"/>
<circle class="i-point" cx="59.779" cy="24.203" r="3.213"/>
<circle class="i-point" cx="41.631" cy="32.406" r="3.213"/>
<circle class="i-point" cx="25.463" cy="13.759" r="3.213"/>
<circle class="i-point" cx="7.317" cy="51.787" r="3.213"/>
</svg>
`

function run(params){
  let geo = params.input;
  let output = params.output;
  let spath = output.makeSPath();
  spath.color = geo.color;
  let normal = geo.normalised;
  normal.makeAbsolute();
  return {
    *[Symbol.iterator]() {
      for (let cpoint of normal.d) {
        spath.addPoint(cpoint.p);
        yield 0;
      }
    }
  }
}

export {name, properties, run, pattern, icon}
