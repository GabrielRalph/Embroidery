import {Vector} from "../SvgPlus/4.js"
/* shifts a boundry by a given value e.g.
| * |        |   * |
|***| + 2 =  |  ***|

*/
function shiftBoundry(b1, value){
  for (let seg of b1) {
    seg[1] += value;
    seg[0] += value;
  }
}

/* adds two boundries together to from one e.g.e
| * |   |   *** |   | ***** |
|***| + |    ***| = |*******|
| * |               | *     |
*/
function addBoundries(b1, b2) {
  if (b1 == null) return b2;
  let n1 = b1.length;
  let n2 = b2.length;
  let nmin = min(n1, n2);
  let nmax = max(n1, n2);
  let bmax = nmax == n1 ? b1 : b2;

  let boundry = [];
  let i = 0;
  while (i < nmin) {
    boundry.push([
      min(b1[i][0], b2[i][0]),
      max(b1[i][1], b2[i][1])
    ]);
    i++;
  }
  while (i < nmax) {
    boundry.push([bmax[i][0], bmax[i][1]]);
    i++;
  }
  return boundry
}

/* place boundries recursively solves boundries from a root node and
and positions children boundries with minimum spacing centered by
the parent node. The relative positions of the nodes (with regard
  to the position of their parents) will be stored under the key
  relativePosition.

  boundry = [
    [1 1],          o
    [1 5],        ooooo
    ...
  ]
  */

const TTIME = 370; //ms
let node_width = 7.5;
let node_height = node_width;
let yspace = node_width*1.7;
let xspace = 5;
let treegap = 0;
let max_nodes = 5;


function min() {
  let min = null;
  for (let arg of arguments) {
    if (min == null || arg < min) {
      min = arg;
    }
  }
  return min
}
function max() {
  let max = null;
  for (let arg of arguments) {
    if (max == null || arg > max) {
      max = arg;
    }
  }
  return max
}


/* given two boundries computes the minimum x delta of the second boundry
   such that the two boundries sit next to each other with no overlap
 b1| *
   |***
   | *

 b2|***
   | ***

   solution: 3 (2 + 1 for spacing)
   | * ***
   |*** ***
   | *
*/
function getBoundrySpacing(b1, b2, xspace) {
  if (b1 == null) return 0;

  let minInteractions = b1.length < b2.length ? b1.length : b2.length;
  let maxInteraction = null;
  let maxi = 0;
  for (let i = 0; i < minInteractions; i++) {
    let interaction = b1[i][1] - b2[i][0];
    if (maxInteraction == null || interaction > maxInteraction) {
      maxInteraction = interaction;
      maxi = i;
    }
  }

  return maxInteraction + xspace;
}


function transformPositions(geoInfo, trans = new Vector(0, 0)) {
  let ntrans = trans.add(geoInfo.position);
  geoInfo.position = ntrans;
  for (let child of geoInfo.children) {
    transformPositions(child, ntrans);
  }
}

function getNodeLayout(root, node_width = 7.5, node_height = node_width, yspace = 1.7*node_width, xspace = node_width * 0.6) {
  let  getGeoInfo = (node) => {
    let res = {
      boundry: [],
      children: [],
      position: new Vector(0, 0),
    }

    let isLeaf = !(node.children && node.children.length > 0);
    if (isLeaf || node.collapsed) {
      res.boundry = [[-node_width/2, node_width/2]]
    } else {
      for (let child of node.children) {
        let cres = getGeoInfo(child); // get boundry
        res.children.push(cres)
        let spacing = getBoundrySpacing(res.boundry, cres.boundry, xspace);
        cres.position = new Vector(spacing, node_height + yspace);
        shiftBoundry(cres.boundry, spacing);
        res.boundry = addBoundries(res.boundry, cres.boundry);
      }

      let xadj = 0;
      if (res.boundry.length) {
        xadj = -(res.boundry[0][0] + res.boundry[0][1])/2;
      }

      //center align
      for (let child of res.children) {
        child.position = child.position.add(new Vector(xadj, 0));
      }
      shiftBoundry(res.boundry, xadj);
      res.boundry.unshift([-node_width/2, node_width/2])
    }

    return res;
  }

  let geoInfo = getGeoInfo(root);
  transformPositions(geoInfo);

  // viewbox sizing
  let h = geoInfo.boundry.length;
  let height = (h - 1) * yspace + h * node_height;
  let x = null;
  let width = 0;
  for (let b of geoInfo.boundry) {
    if (x == null || b[0] < x) x = b[0];
    if (b[1] > width) width = b[1]
  }
  width = width - x;
  let size = new Vector(width, height);
  let pos = new Vector(x, -node_height/2);

  geoInfo.viewbox = [pos, size];
  return geoInfo;
}

export {getNodeLayout}
