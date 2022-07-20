const name = "Loop Join";

const properties = null;

const icon = `
<svg viewBox="0 0 100 60">
<g>
	<path class="i-stitch-d" d="M51.909,50.063H18.195c-7.333,0-13.278-5.945-13.278-13.278c0-7.333,5.945-13.278,13.278-13.278
		c0,0,33.715,0,33.715,0C69.519,24.215,69.531,49.35,51.909,50.063L51.909,50.063z"/>
</g>
<g>
	<path class="i-stitch-d" d="M82.045,39.111H48.33c-7.333,0-13.278-5.945-13.278-13.278c0-7.333,5.945-13.278,13.278-13.278
		c0,0,33.715,0,33.715,0C99.654,13.264,99.666,38.398,82.045,39.111L82.045,39.111z"/>
</g>
</svg>
`

const pattern = /^r?\(l+\)$/

function getIntersection(a1, b1, a2, b2, V) {
	// y = mx + c
	// y1 - y2
	// a1.y - b1.y = m1 * (a1.x - b1.x);
	let m1 = (a1.x - b1.x) / (a1.y - b1.y);
	let m2 = (a2.x - b2.x) / (a2.y - b2.y);
	// c = y - mx
	let c1 = a1.y - m1 * a1.x;
	let c2 = a2.y - m2 * a2.x;

	let intersection = null;

		// y1 = y2 = y
		// m1x + c1 = m2x + c2
		// x(m1 - m2) = c2 - c1
		let x = (c2 - c1) / (m1 - m2);
		let y = m1 * x + c1;

		if (!Number.isNaN(x) && !Number.isNaN(y)) {
			let i = new V(x, y);

			let ab = b1.sub(a1);
			let ai = i.sub(a1);
			let kac = ab.dot(ai);
			let kab = ab.dot(ab);
			if (kac > 0 && kab > kac) {
				intersection = i;
			}
		}

	return intersection;
}

function closestPoints(patha, pathb) {
	let d1 = patha.dpath;
	let d2 = pathb.dpath;

	let s1 = null;
	let s2 = null;
	let minDist = 0;
	for (let c1 of d1) {
		for (let c2 of d2) {
			// if (c1.last != null && c2.last != null) {
			// 	let intersection = getIntersection(c1.last.p, c1.p, c2.last.p, c2.p, patha.Vector);
			// 	if (intersection != null) {
			// 		s1 = patha.insertAfter(c1.last, intersection);
			// 		s2 = pathb.insertAfter(c2.last, intersection);
			// 		return [s1, s2]
			// 	}
			// }

			let dist = c1.p.dist(c2.p);
			if ((s1 == null || s2 == null) || dist < minDist) {
				s1 = c1;
				s2 = c2;
				minDist = dist;
			}
		}
	}

	return {d: minDist, s1: s1, s2: s2, p1: patha, p2: pathb};
}

function run(params) {
  let group = params.input;
	let output = params.output;
  let guides = params.guides.makeStitchVisualiser();
  let props = params.props;

  return {
    *[Symbol.iterator]() {

			// comput distance table
			let n = group.children.length;
			let D = [];
			for (let ch1 of group.children) {
				let row = []
				for (let ch2 of group.children) {
					let info = {d: Infinity, s1: ch1, s2: ch2};
					if (ch1 != ch2) {
						info = closestPoints(ch1, ch2);
					}
					row.push(info)
				}
				D.push(row);
			}

			// solve minimum spaning tree
			let visit = new Set();
			let unvisit = new Set();
			let links = [];
			for (let i = 1; i < n; i++) unvisit.add(i);
			visit.add(0);
			while (unvisit.size > 0) {
				let min = null;
				let minIndx = [0, 0];
				for (let i of visit) {
					for (let j of unvisit) {
						let dist = D[i][j];
						if (min == null || dist.d < min.d) {
							min = dist;
							minIndx = [i, j];
						}
					}
				}
				links.push(min)
				unvisit.delete(minIndx[1]);
				visit.add(minIndx[1]);
			}

			// console.log(links);
			let p1 = output.makeSPath();
			p1.dpath.push(links[0].p1.dpath)
			for (let link of links) {
				if (p1 == null) p1 = link.p1;
				let {p2, s2, s1} = link;
				p2.rotateTo(s2);
				p2.dpath.push(s1.clone())
				p1.insertAfter(s1, p2);
				p1.color = p2.color;
			}
			// // animation
			// group.working = true;
			// for (let cp of p1.dpath) {
			// 	if (cp.last) {
			// 		guides.addStitch(cp.last.p, cp.p, p1.color);
			// 		yield 0;
			// 	}
			// }
			p1.updateDPath();

		}
  }
}

export {name, properties, run, pattern, icon}
