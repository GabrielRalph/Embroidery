import {Vector} from "./vector.js"

async function nextFrame() {
  return new Promise(function(resolve, reject) {
    window.requestAnimationFrame(resolve);
  });
}

function inBounds(pos, bounds) {
  return pos.x <= bounds.x && pos.y <= bounds.y
}

function findLineBounds(pos, ext, dir, inFill) {
  let start = null;
  let lastInFill = false;
  let row = [];
  while (inBounds(pos, ext)) {
    let nowInFill = inFill(pos);

    // into fill
    if (!lastInFill && nowInFill) {
      start = pos;

    // out of fill
    } else if (lastInFill && !nowInFill) {
      let end = pos.sub(dir);
      row.push([start, end]);
    }

    lastInFill = nowInFill;
    pos = pos.add(dir);
  }
  if (lastInFill) {
    row.push([start, pos]);
  }
  return row;
}
async function fillSquare(pos, size, inFill, dir = false, ds = 3, res = 1) {
  let up = new Vector(0, ds);
  let left = new Vector(res, 0);
  if (dir) {
    left = new Vector(0, res);
    up = new Vector(ds, 0);
  }
  let extent = pos.add(size);

  //compute square
  let grid = [];
  while (inBounds(pos, extent)) {
    let row = findLineBounds(pos, extent, left, inFill);
    pos = pos.add(up);
    grid.push(row);
  }
  // console.log(grid);

  await nextFrame();
  return grid;
}



function joinClosestPath(rowa, rowb) {
  // find closest pair
  let minDist = null;
  let minPair = [];
  let minI = 0;
  let i = 0;
  for (let pa of rowa) {
    for (let pb of rowb) {
      if (pb.visited) continue;
      let psa = new Vector(pa[pa.length - 2]);
      let peb = pb[0];
      let dist = psa.dist(peb);

      if (minDist == null || dist < minDist) {
        minDist = dist;
        minPair = [pa, pb];
        minI = i;
      }
    }
    i++;
  }

  // remove pa from rowa and insert it into pb
  if (minDist != null) {
    let [pa, pb] = minPair;
    pb.visited = true;

    // remove pa
    rowa.splice(minI, 1);

    // insert into pb
    while (pa.length) pb.unshift(pa.pop());
    return true;
  }

  return false;
}
function satinJoin(borders) {
  let lastRow = [];
  let paths = [];
  for (let row of borders) {
    // find closest border and path pair
    while (joinClosestPath(lastRow, row));

    // push paths that did not continue
    for (let path of lastRow) {
      paths.push(path);
    }

    lastRow = row;
  }

  // push all paths
  for (let path of lastRow) {
    paths.push(path);
  }

  return paths;
}
function printSquare(borders, visual) {
  let paths = satinJoin(borders);
  let c2 = 0;
  for (let path of paths) {
    let l = null;
    let spath = visual.makeSPath();
    for (let v of path) {
      // if (l == null)
      spath.addPoint(v)
      //   visual.addStitch(new Vector(l), new Vector(v), `hsl(${c2}, 100%, 50%)`);
      // l = v;
    }
    c2+=50;
  }
}

// let test = [
//     [
//         [
//             {
//                 "x": 1688,
//                 "y": 224
//             },
//             {
//                 "x": 1710,
//                 "y": 224
//             }
//         ]
//     ],
//     [
//         [
//             {
//                 "x": 1686,
//                 "y": 227
//             },
//             {
//                 "x": 1710,
//                 "y": 227
//             }
//         ]
//     ],
//     [
//         [
//             {
//                 "x": 1683,
//                 "y": 230
//             },
//             {
//                 "x": 1710,
//                 "y": 230
//             }
//         ]
//     ],
//     [
//         [
//             {
//                 "x": 1682,
//                 "y": 233
//             },
//             {
//                 "x": 1710,
//                 "y": 233
//             }
//         ]
//     ],
//     [
//         [
//             {
//                 "x": 1682,
//                 "y": 236
//             },
//             {
//                 "x": 1688,
//                 "y": 236
//             }
//         ],
//         [
//             {
//                 "x": 1703,
//                 "y": 236
//             },
//             {
//                 "x": 1710,
//                 "y": 236
//             }
//         ]
//     ],
//     [
//         [
//             {
//                 "x": 1705,
//                 "y": 239
//             },
//             {
//                 "x": 1710,
//                 "y": 239
//             }
//         ]
//     ],
//     [
//         [
//             {
//                 "x": 1664,
//                 "y": 242
//             },
//             {
//                 "x": 1665,
//                 "y": 242
//             }
//         ],
//         [
//             {
//                 "x": 1706,
//                 "y": 242
//             },
//             {
//                 "x": 1710,
//                 "y": 242
//             }
//         ]
//     ],
//     [
//         [
//             {
//                 "x": 1664,
//                 "y": 245
//             },
//             {
//                 "x": 1667,
//                 "y": 245
//             }
//         ],
//         [
//             {
//                 "x": 1708,
//                 "y": 245
//             },
//             {
//                 "x": 1710,
//                 "y": 245
//             }
//         ]
//     ],
//     [
//         [
//             {
//                 "x": 1664,
//                 "y": 248
//             },
//             {
//                 "x": 1669,
//                 "y": 248
//             }
//         ],
//         [
//             {
//                 "x": 1709,
//                 "y": 248
//             },
//             {
//                 "x": 1710,
//                 "y": 248
//             }
//         ]
//     ],
//     [
//         [
//             {
//                 "x": 1664,
//                 "y": 251
//             },
//             {
//                 "x": 1671,
//                 "y": 251
//             }
//         ],
//         [
//             {
//                 "x": 1704,
//                 "y": 251
//             },
//             {
//                 "x": 1710,
//                 "y": 251
//             }
//         ]
//     ],
//     [
//         [
//             {
//                 "x": 1664,
//                 "y": 254
//             },
//             {
//                 "x": 1673,
//                 "y": 254
//             }
//         ],
//         [
//             {
//                 "x": 1682,
//                 "y": 254
//             },
//             {
//                 "x": 1710,
//                 "y": 254
//             }
//         ]
//     ],
//     [
//         [
//             {
//                 "x": 1664,
//                 "y": 257
//             },
//             {
//                 "x": 1710,
//                 "y": 257
//             }
//         ]
//     ],
//     [
//         [
//             {
//                 "x": 1664,
//                 "y": 260
//             },
//             {
//                 "x": 1710,
//                 "y": 260
//             }
//         ]
//     ],
//     [
//         [
//             {
//                 "x": 1664,
//                 "y": 263
//             },
//             {
//                 "x": 1710,
//                 "y": 263
//             }
//         ]
//     ],
//     [
//         [
//             {
//                 "x": 1664,
//                 "y": 266
//             },
//             {
//                 "x": 1710,
//                 "y": 266
//             }
//         ]
//     ],
//     [
//         [
//             {
//                 "x": 1664,
//                 "y": 269
//             },
//             {
//                 "x": 1710,
//                 "y": 269
//             }
//         ]
//     ]
// ]
//
// let res = satinJoin(test);

async function run(start, bounds, inFill, visual) {
  //
  //
  // return;
  // console.log(inFill(start.add(90, 10)));
  let color = "red";

  let ms = 45;
  let mainSize = new Vector(ms, ms);
  // bounds = bounds.add(30, 30);
  // start = start.sub(30, 30);
  let size = bounds.sub(start)

  // while (inBounds(cur, bounds)) {
  let i = 0;
  for (let y = 0; y < size.y; y+= ms) {
    let cur = start.add(ms * (i%2), y);
    while (inBounds(cur, bounds)) {
      // visual.createChild("rect", {
      //   x: cur.x,
      //   y: cur.y,
      //   width: ms,
      //   height: ms,
      // })
      let borders = await fillSquare(cur, mainSize, inFill);
      console.log(borders);
      printSquare(borders, visual);
      cur = cur.addH(ms*2);
    }
    i++;
  }

  // i = 0;
  // color = "tomato"
  // for (let y = 0; y < size.y; y+= ms) {
  //   let cur = start.add(ms * ((i + 1)%2), y);
  //   while (inBounds(cur, bounds)) {
  //     // visual.createChild("rect", {
  //     //   x: cur.x,
  //     //   y: cur.y,
  //     //   width: 51,
  //     //   height: 51,
  //     // })
  //     await fillSquare(cur, mainSize, true);
  //     cur = cur.addH(ms*2);
  //   }
  //   i++;
  // }
}

export {run}
