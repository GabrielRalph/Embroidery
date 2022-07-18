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
const COLOR = "#506bffb5"

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
			if (c1.last != null && c2.last != null) {
				let intersection = getIntersection(c1.last.p, c1.p, c2.last.p, c2.p, patha.Vector);
				if (intersection != null) {
					s1 = patha.insertAfter(c1.last, intersection);
					s2 = pathb.insertAfter(c2.last, intersection);
					return [s1, s2]
				}
			}

			let dist = c1.p.dist(c2.p);
			if ((s1 == null || s2 == null) || dist < minDist) {
				s1 = c1;
				s2 = c2;
				minDist = dist;
			}
		}
	}

	return [s1, s2];
}

function run(params) {
  let group = params.input;
	let output = params.output;
  let guides = params.guides;
  let props = params.props;

  return {
    *[Symbol.iterator]() {
			let D = [];
			for (let ch1 of group.children) {
				let row = []
				for (let ch2 of group.children) {
					let dist = {d: Infinity};
					if (ch1 != ch2) {
						let [s1, s2] = closestPoints(ch1, ch2);
						dist = {
							d: s1.p.dist(s2.p),
							s1: s1,
							s2: s2,
						}
						let spath = guides.makeSPath();
						spath.color = COLOR;
						spath.addPoint(s1.p);
						spath.addPoint(s2.p);
						for (let i = 0; i < 1; i++)
							yield 0.3;
					}
					row.push(dist)
				}
				D.push(row);
			}

			guides.innerHTML="";

			let n = group.children;
			let unvisit = new Set();
			for (let i = 1; i < n; i++) unvisit.add(i);
			let visit = [0];
			while (unvisit.size > 0) {
				let min = null;
				for (let i of visit) {
					for (let j of unvisit) {
						let dist = D[i][j]
						if (min == null || dist.dist < min.dist) {
							min = dist;
						}
					}
				}

				console.log(min);


				let spath = guides.makeSPath();
				spath.color = COLOR;
				spath.addPoint(min.s1.p);
				spath.addPoint(min.s2.p);

				yield 1;

				unvist.delete(min[1])
				visit.add(min[1])
			}

			for (let i = 0; i < 1000; i++)yield 0.9;
    }

  }
}

export {name, properties, run, pattern, icon}
