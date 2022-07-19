import {SvgPlus, Vector, DPath, SvgPath, CPoint} from "../../SvgPlus/4.js"
let node_size = 7.5;
let r45 = (node_size/2) / Math.sqrt(2);
function getColor(node) {
  let style = window.getComputedStyle(node);
  if (style.fill != "none" && style.fill != null) {
    return style.fill;
  } else {
    return style.stroke;
  }
}

function pointToVector(p) {
  let v = null;
  if (p) {
    p = p.split(/,(-*)/g);
    if (Array.isArray(p) && p.length > 2) {
      v = new Vector(p[0], p[1] + p[2])
    } else {
      v = new Vector();
    }
  }

  return v;
}

let lastSelected = [];
const LOOP_THRESHOLD = 1;

function normaliseGeometry(el) {
  let path = new SvgPath("path");

  let get = (key) => el.getAttribute(key);

  let ellipse = (c, r) => {
    path.M(c.addV(-r.y))
    .A(r, 1, 0, 1, c.addH(r.x))
    .A(r, 1, 0, 1, c.addV(r.y))
    .A(r, 1, 0, 1, c.addH(-r.x))
    .A(r, 1, 0, 1, c.addV(-r.y))
  }

  let pointsToPath = () => {
    let ps = get("points").split(" ");
    let m = "M";
    for (let p of ps) {
      let v = pointToVector(p);
      if (v != null) {
        path[m](v);
        m = "L";
      }
    }
  }

  switch (el.tagName) {
    case "path":
      path.d_string = get("d");
      path.d.makeAbsolute();
    break;

    case "circle":
      let cc = new Vector(get("cx"), get("cy"));
      let rc = new Vector(get("r"), get("r"));
      ellipse(cc, rc);
    break;

    case "ellipse":
      let ce = new Vector(get("cx"), get("cy"));
      let re = new Vector(get("rx"), get("ry"));
      ellipse(ce, re);
    break;

    case "rect":
      let c1 = new Vector(get('x'), get('y'));
      let size = new Vector(get('width'), get('height'));

      let rx = parseFloat(get('rx'));
      let ry = parseFloat(get('ry'));

      if (!ry) ry = rx;
      if (!rx) rx = ry;
      let c2 = c1.addH(size.x);
      let c3 = c1.add(size);
      let c4 = c1.addV(size.y);

      let radius = rx > 0.1 && ry > 0.1;
      if (radius) {
        let r = new Vector(rx, ry);
        path.M(c1.addH(rx))
        .L(c2.addH(-rx))
        .A(r, 1, 0, 1, c2.addV(ry))
        .L(c3.addV(-ry))
        .A(r, 1, 0, 1, c3.addH(-rx))
        .L(c4.addH(rx))
        .A(r, 1, 0, 1, c4.addV(-ry))
        .L(c1.addV(ry))
        .A(r, 1, 0, 1, c1.addH(rx));
      } else {
        path.M(c1).L(c2).L(c3).L(c4).Z()
      }
    break;

    case "line":
      path.M(new Vector(get("x1"), get("y1"))).
      L(new Vector(get("x2"), get("y2")));
    break;

    case "polyline":
      pointsToPath();
    break;

    case "polygon":
      pointsToPath();
      path.Z();
    break;
  }

  path.update(3);

  return path;
}

let points = new SvgPlus("svg");

class SNode extends SvgPlus {
  constructor(el) {
    super(el);
  }


  get Vector() {return Vector}

  set progress(value){
      let rad = node_size/2;
      let p1 = new Vector(0, -rad);
      let p2 = p1.rotate(Math.PI*2*value);
      let str = "";
      if (value > 0 && value < 1) {
        str = `M${p1}A${rad},${rad},0,${value>0.5?'1':'0'},1,${p2}`;
      }
      this.progressBar.props = {
        d: str
      }
  }

  makeVNode(node){
    node.classList.add(this.stype);
    node.collapsed = this.collapsed
    function makeText(){
      let idx = this._colorIndex;
      if (typeof idx !== "number") idx = "";
      node.text = node.createChild("text", {
      styles: {
          fill: "white",
          "font-size": 4,
        },
        content: idx,
        x: -1,
        y: 1,
      });
    }

    function makePrefill(){
      this._ficon = new SvgPlus("circle");
      let r =  node_size/13
      this._ficon.props = {
        r: r,
        cx: r/2-node_size/2,
        cy: r/2-node_size/2,
        class: "sfunc"
      };
    }

    Object.defineProperty(node, "selected", {
      set: (v) => {
        this.selected = v
      }
    })

    this.progressBar = node.createChild("path");
  }

  replace(node) {
    this.parentNode.replaceChild(node, this);
  }

  set stype(value){
    if (this._stype) {
      this.classList.remove(this._stype);
      if (this.vnode) {
        this.vnode.classList.remove(this._stype);
      }
    }
    this._stype = value;
    this.classList.add(value);
    if (this.vnode) {
      this.vnode.classList.add(value);
    }
  }

  get stype(){
    return this._stype;
  }

  set selected(value) {
    this.toggleAttribute("selected", value);
  }
  set working(value) {
    this.toggleAttribute("working", value);
  }


  addProperties(props, obj) {
    for (let prop of props) {
      let func = prop.function;
      if (func in this && this[func] instanceof Function) {
        obj[func] = () => {
          return this[prop].apply(this, arguments);
        }
      } else {
        let desc = {};
        let name = prop.name;
        if (prop.get) {
          desc.get = () => this[name];
        }
        if (prop.set) {
          desc.set = (v) => this[name] = v;
        }
        Object.defineProperty(obj, name, desc);
      }
    }
  }

  set colorIndex(i) {
    this._colorIndex = i;
  }
  get colorIndex(){
    return this._colorIndex;
  }
}

class Geometry extends SNode {
  constructor(el) {
    super(el);
    this.stype = "geo";

    this.normalised = normaliseGeometry(this);

    let styles = window.getComputedStyle(this);
    let stroke = styles.stroke;
    let fill = styles.fill;

    if (fill != "none" && fill != null) {
      styles = {"stroke": "none"};
      this.color = fill;
    } else {
      this.color = stroke;
    }
  }

  getVectorAtLength(l) {
    return new Vector(this.getPointAtLength(l));
  }
  isVectorInFill(v) {
    return this.isPointInFill(this.makeSVGPoint(v));
  }
  isVectorInStroke(v) {
    return this.isPointInStroke(this.makeSVGPoint(v));
  }
  makeSVGPoint(v) {
    return points.createSVGPoint(v.x, v.y);
  }

  static is(el) {return SvgPlus.is(el, Geometry);}
}

class Group extends SNode {
  constructor(el = "g") {
    super(el);
    this.stype ="group"
  }

  getSPaths(){
    let paths = [];
    let recurse = (node) => {
      if (node.stype == "group") {
        for (let child of node.children) {
          recurse(child);
        }
      } else {
        paths.push(node);
      }
    }
    recurse(this);
    return paths;
  }

  makeSPath() {
    return this.createChild(SPath);
  }

  makeGroup() {
    return this.createChild(Group);
  }

  static is(el) {return SvgPlus.is(el, Group);}
}

class SPath extends SNode {
  constructor(el = "path") {
    super(el);
    this.stype = "spath"
    this.dpath = new DPath(this.getAttribute("d"));
    this.dpath.makeAbsolute();
    this._repeats = 0;
  }

  set color(color){
    this.styles = {
      "stroke": color,
      "fill": "none"
    }
    this._color = color;
  }
  get color() {
    return this._color;
  }

  get repeats(){return this._repeats;}

  flip(){
    let dpath = this.dpath;
    let end = dpath.end;
		dpath.clear();
		while (end) {
			this.addPoint(end.p, false);
			end = end.last;
		}
    this.updateDPath();
  }

  addPoint(v, update = true) {
    let dpath = this.dpath;
    // add point to spath
    v = new Vector(v).round(0);
    let cmd = "L";
    if (dpath.length == 0) {
      cmd = 'M';
    }
    dpath[cmd](v);
    if (update) this.updateDPath();
  }

  insertAfter(cpoint, v) {
    let newc = new CPoint("L" + v);
    this.dpath.insertAfter(cpoint, newc)
    return newc
  }

  updateDPath(){
    this.setAttribute("d", this.dpath.toString(0));
    this.updateIsLoop();
  }

  updateIsLoop() {
    this.stype = "spath"
    this.isLoop = false;
    let dpath = this.dpath;

    // check if spath is a loop
    if (dpath.length > 1) {
      let start = dpath.start.p;
      let end = dpath.end;
      if (end.cmd_type == "Z") end = start.clone();
      else end = end.p;

      let delta = end.dist(start);
      if (delta < LOOP_THRESHOLD) {
        this.stype = "spath-loop";
        this.isLoop = true;
      }
    }
  }

  setStart(cpoint) {
    let dpath = this.dpath
    let ndpath = new DPath();

    if (cpoint == dpath.start || cpoint == dpath.end) {
      return;
    }

    ndpath.M(cpoint.p);
    let cur = cpoint.next;
    while (cur) {
      ndpath.L(cur.p);
      cur = cur.next;
    }

    cur = dpath.start;
    while (cur != cpoint) {
      cur = cur.next;
      ndpath.L(cur.p);
    }

    this.dpath = ndpath;

    this.updateDPath();
  }

  set repeats(num) {
    let dpath = this.dpath;
    if (num == this.repeats) {
      return;
    }

    let isLoop = false;
    if (this.repeats > 0) {
      dpath = new DPath(this._unrepeated);
      this.dpath = dpath;
      isLoop = this._unrepeatedIsLoop;
    } else {
      this._unrepeated = dpath.toString(0);
      this._unrepeatedIsLoop = this.isLoop;
    }

    if (num > 0) {
      let start = dpath.start;
      let end = dpath.end;

      if (isLoop) {
        for (let i = 0; i < num; i++) {
          let cur = start;
          while (cur != end) {
            cur = cur.next;
            dpath.L(cur.p);
          }
        }
      } else {
        let i = 0;
        let cur = end;
        while (i < num) {
          while (cur != start) {
            cur = cur.last;
            dpath.L(cur.p);
          }
          i++;
          if (i >= num) break;
          while (cur != end) {
            cur = cur.next;
            dpath.L(cur.p);
          }
          i++;
        }
      }
    }

    this.updateDPath();
    this._repeats = num;
  }

  static is(el) {return SvgPlus.is(el, SPath);}
}



export {Geometry, Group, SPath}
