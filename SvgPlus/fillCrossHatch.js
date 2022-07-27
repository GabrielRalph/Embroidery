async function findPointsOnLine(start, delta, end) {
  let paths = [];
  let points = [];
  let res = inFill(start);
  LP = null;

  console.log(res);
  let deltau = delta.dir();

  while (start.x < end.x && start.y < end.y) {
    start = start.add(delta);
    let nres = inFill(start);

    if (nres != res) {
      let s = start.clone();
      let r = nres;
      if (nres && !res) {
        while (r) {
          s = s.sub(deltau);
          r = inFill(s);
        }
        add(s);
      } else {
        while (!r) {
          s = s.sub(deltau);
          r = inFill(s);
        }
        add(s);
        LP = null;
      }
    }

    if (nres) {
      add(start)
    }

    res = nres;
  }


}

async function FillCross(dy, dx){
  let cur = pos.addH(size.x);
  while (cur.x > 0) {
    await findPointsOnLine(cur, new Vector(dx, dy), pos.add(size));
    await nextFrame();
    cur = cur.addH(-dx);
  }
  while (cur.y <= size.y) {
    await findPointsOnLine(cur, new Vector(dx, dy), pos.add(size));
    await nextFrame();
    cur = cur.addV(dy);
  }
}

async function FillCrossHatch(arr) {
  g.innerHTML = "";
  let tests = [];
  for (let [dy, dx] of arr) {
    tests.push(FillCross(dy, dx))
  }

  for (let task of tests) await task;
}

async function testt(a3){
  for (let a of a3) await testP(a);
}
