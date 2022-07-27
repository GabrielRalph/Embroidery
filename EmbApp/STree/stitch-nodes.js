import {SvgPlus, Vector, DPath, SvgPath, CPoint} from "../../SvgPlus/4.js"
import {Cursor} from "../svg-pro.js"
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
        this.toggleAttribute("selected", v)
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

  get data(){
    return {
      type: "geo",
      data: this.normalised.d_string,
      color: this.color,
      getPoint: (v) => this.getVectorAtLength(v)
      
    }
  }

  get normalised() {
    if (!this._normalised) {
      this._normalised = SvgPath.normalise(this);
    }
    return this._normalised;
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

  makeStitchVisualiser(){
    return this.createChild(StitchVisualiser);
  }

  makeSPath() {
    return this.createChild(SPath);
  }

  makeGroup() {
    return this.createChild(Group);
  }

  get data(){
    let data = {
      type: "group",
      children: []
    }
    for (let node of this.children) {
      data.children.push(node.data);
    }
    return data;
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
    let cp = new CPoint(cmd + v);
    dpath.push(cp);
    if (update) this.updateDPath();
    return cp;
  }

  insertAfter(cpoint, path) {
    if (SPath.is(path)) {
      path = path.dpath;
    }

    let oldStart = null;
    if (path instanceof DPath) {
      oldStart = path.start;
    }
    this.dpath.insertAfter(cpoint, path);
    if (oldStart) oldStart.cmd_type = "L";
  }

  rotateTo(cpoint) {
    let [cp, i] = this.dpath.find(cpoint);
    if (cp != null && cp != this.dpath.start && cp != this.dpath.end) {
      this.dpath.pop();
      console.log('t1');
      this.dpath.start.cmd_type = "L";
      this.dpath.rotateTo(cp);
      console.log('t2');
      this.dpath.L(cp.p)
      cp.cmd_type = "M";
    }
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

  get data(){
    return {
      type: "spath",
      data: this.getAttribute("d"),
      color: "color",
    }
  }

  static is(el) {return SvgPlus.is(el, SPath);}
}


class StitchVisualiser extends Group {
  constructor(el = "g"){
    super(el);
  	this.moves = this.makeGroup();
  	this.stitches = this.makeGroup();
    this.stitches.class = "stitches"
  	this.moves.class = "moves"
    this.needle = this.createChild("g", {class: "needle"});
    this.needle.createChild("circle", {
      r: "35",
    })
    this.needle.createChild("circle", {
      r: "3",
    })
  }

  set needlePos(v){
    if (v != null) {
      this.needle.props = {transform: `translate(${v})`}
    }
  }

  addMove(p1, p2) {
		this.moves.createChild("path", {
			d: `M${p1}L${p2}`,
		})
  }

  addStitch(p1, p2, color) {
    this.needlePos = p2;
    this.stitches.createChild("path", {
      d: `M${p1}L${p2}`,
      stroke: color,
      class: "stitch"
    });
    this.stitches.createChild("path", {
      d: `M${p1}L${p2}`,
      stroke: "#fff",
      opacity: "0.3",
      "stroke-width": "1.5",
    });
    this.stitches.createChild("path", {
      d: `M${p1}L${p1}`,
      class: "dot",
    });
  }
}


export {Geometry, Group, SPath}
