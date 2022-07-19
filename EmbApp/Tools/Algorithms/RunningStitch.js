const name = "Running Stitch";

function isCorner(cp1) {
  let last = cp1.last;
  let next = cp1.next;
  if (last && next && cp1.cmd_type == "L") {

    let tvlast = last.p.sub(cp1.p);
    let tvnext = next.p.sub(cp1.p);
    let a = 180 * tvlast.angleBetween(tvnext) / Math.PI;
    return Math.abs(a - 180) > 20;
  }
  return false;
}


function splitSegment(start){
  let cpoint = start.next;
  while (cpoint) {
    if (isCorner(cpoint)) {
      return cpoint;
    }
    cpoint = cpoint.next;
  }

  return null;
}

const properties = {
  max_stitch_length: {
    type: "string",
    default: "1.5mm",
  },
  min_stitch_length: {
    type: "string",
    default: "1mm",
  }
}

let error = 0;

const icon = `
<svg viewBox="0 0 100 60">
  <path class="i-stitch" d="M8.721,51.733c2.663,0.469,10.952-2.229,12.592-2.781"/>
  <path class="i-stitch" d="M28.55,46.099c2.722-0.577,9.532-6.438,11.614-7.155"/>
  <path class="i-stitch" d="M46.094,34.103c0,0,9.675-8.346,10.367-8.901"/>
  <path class="i-stitch" d="M62.83,20.475c0,0,10.014-6.394,11.687-6.344"/>
  <line class="i-stitch" x1="81.866" y1="11.486" x2="92.393" y2="8.119"/>
  <circle class="i-point" cx="8.721" cy="51.733" r="3.213"/>
  <circle class="i-point" cx="92.393" cy="8.119" r="3.213"/>
</svg>
`

const pattern = "g"

function nextStitch(l, s, path, end, dmin, dmax){
  // Get a stitch point, s, with a distance of max_length away from the last
  // this will be our initial guess for the next stitch point
  let s_i = null;
  let nextL = l + dmax;
  if (nextL > end){
    nextL = end;
  }
  s_i = path.getVectorAtLength(nextL);


  // Get all the stitch points between the last stitch point and our guess for
  // the next stitch point, s_i, with a spacing of min_length between each other
  for (var i = l + dmin; i < nextL; i += dmin){
    let sinc = path.getVectorAtLength(i);

    // Get the perpendicular distance from the current point, s to the line
    // between the last point and the guess for the next point
    let variance = sinc.distToLine(s, s_i);

    // As we look at the points, d will increase or remain 0. When the d of the
    // point s is just greater than the variance threshold, we set the next stitch
    if (variance > dmin){
      nextL = i;
      s_i = sinc;
      break;
    }
  }

  // If the d never exceeds the threshold the next stitch will be our inititial guess
  l = nextL;
  s = s_i;
  return [l, s];
}

function run(params) {
  let geo = params.input;
  let output = params.output;
  let props = params.props;
  let dmax = props.max_stitch_length;
  let dmin = props.min_stitch_length;

  geo.working = true;

  let spath = output.makeSPath();
  spath.color = geo.color;

  let path = geo.normalised;

  let l = 0;
  let s = path.getVectorAtLength(l);
  let total = path.getTotalLength();
  spath.addPoint(s);

  return {
    *[Symbol.iterator]() {

      let dpath = path.d;
      let start = path.d.start;
      let pathend = path.d.end;

      let split = start;
      let splitNext = null;

      let done = false;
      while (!done) {
        if (splitNext && split) split.next = splitNext;
        split = splitSegment(split);
        if (split == null) {
          split = pathend;
          done = true;
        }
        splitNext = split.next;

        split.next = null;
        dpath.end = split;
        dpath.update();

        let end = path.getTotalLength();
        while (l < end) {
          [l, s] = nextStitch(l, s, path, end, dmin, dmax)
          spath.addPoint(s);
          yield l/total;
        }
      }
    }
  }
}

function parseProperties(props, parser) {
  for (let name in props) {
    props[name] = parser.parseUnit(props[name]);
  }

  let mm = parser.getUnit("mm");

  let dmax = props.max_stitch_length;
  let dmin = props.min_stitch_length;

  if (dmax == null) {
    parser.error("Max stitch length not a number.", "max_stitch_length");
  } else if (dmax < mm * 0.1) {
    parser.error("Max stitch length can be no less than 0.1mm.", "max_stitch_length");
  }

  if (dmin == null) {
    parser.error("Max stitch length not a number.", "max_stitch_length");
  } else if (dmin < mm * 0.01) {
    parser.error("Min stitch length can be no less than 0.01mm.", "min_stitch_length")
  }
  if (dmax < dmin) parser.parseError("The min stitch length cannot be greater than the max.");
  parser.throw();
}



export {name, properties, run, pattern, icon, parseProperties}
