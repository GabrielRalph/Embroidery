import {SvgPlus, Vector} from "../SvgPlus/4.js"

function bBoxToVV(bbox) {
  return [new Vector(bbox), new Vector(bbox.width, bbox.height)]
}

class ViewBox {
  constructor(svg) {
    this._offset = new Vector;
    this._scale = 1;
    this._pos = new Vector;
    this._size = new Vector;

    this.updateViewBox = () => {
      let pos = this.pos.add(this.offset).round(3);
      let size = this.size.mul(this.scale).round(3);
      let viewBox = "";

      if (pos && size) viewBox = `${pos.x} ${pos.y} ${size.x} ${size.y}`
      svg.setAttribute("viewBox", viewBox);
      if (this.onupdate instanceof Function) {
        this.onupdate();
      }
    }

    this.getContentBBox = () => {
      let bbox = svg.getBBox();
      return bBoxToVV(bbox);
    }

    this.getScreenBBox = () => {
      let bbox = svg.getBoundingClientRect();
      this._spos = new Vector(bbox);
      this._ssize = new Vector(bbox.width, bbox.height);
      return [this._spos.clone(), this._ssize.clone()]
    }
  }

  get ssize(){return this._ssize;}
  get spos(){return this._spos;}

  set scale(v) {
    this._scale = v;
    this.update();
  }
  set offset(v) {
    if (v instanceof Vector) {
      this._offset = v;
      this.update();
    }
  }

  get offset(){return this._offset;}
  get scale(){return this._scale;}

  displayRealSize(){
    let [spos, ssize] = this.getScreenBBox();
    let [cpos, csize] = this.getContentBBox();

    let ratio = 254 / 96;
    let pr = window.devicePixelRatio
    if (pr) ratio = pr;
    let vsize = ssize.mul(ratio);

    let vpos = cpos.add(csize.div(2)).sub(vsize.div(2));


    this.viewbox = [vpos, vsize];
  }

  set viewbox([pos, size]) {
    this._size = size;
    this._pos = pos;
    this.update();
  }
  get viewbox(){return [this.pos, this.size]}

  get absoluteViewbox() {return [this.pos.add(this.offset), this.size.mul(this.scale)]}

  get size() {
    if (this._size instanceof Vector) {
      return this._size.clone();
    }
    return null;
  }
  set size(size) {
    size = new Vector(size);
    this._size = size;
    this.update();
  }

  get pos() {
    if (this._pos instanceof Vector) {
      return this._pos.clone();
    }
    return null;
  }
  set pos(pos) {
    pos = new Vector(pos);
    this._pos = pos;
    this.update();
  }

  scaleAtPoint(sDelta, sp) {
    let [pos, size] = this.viewbox;
    let offset = this.offset
    pos = pos.add(offset);

    let scale = this.scale;
    sDelta = 1 + sDelta * 0.002;
    let newScale = sDelta * scale;

    let relP = sp.sub(pos);
    let delta = relP.sub(relP.mul(newScale/scale));


    if (scale + sDelta > 0.05) {
      this.offset = offset.add(delta);
      this.scale = newScale;
    }
  }

  drag(delta) {
    let [spos, ssize] = this.getScreenBBox();
    delta = delta.mul(this.size.mul(this.scale)).div(ssize);
    this.offset = this.offset.sub(delta);
  }

  screenToSVG(p) {
    p = new Vector(p);
    let [spos, ssize] = this.getScreenBBox();
    let [vpos, vsize] = this.viewbox;
    vpos = vpos.add(this.offset);
    vsize = vsize.mul(this.scale);
    let deltaPercent = p.sub(spos).mul(vsize.div(ssize));
    let pos = vpos.add(deltaPercent);
    return pos;
  }

  update(){
    if (!this._update) {
      this._update = true;
      window.requestAnimationFrame(() => {
        this.updateViewBox();
        this._update = false;
      })
    }
  }
}

class VectorSelector extends SvgPlus {
  constructor(el) {
    super(el);
  }

  onconnect(){
    let svg = this.svg;
    let cursor = svg.makeCursor(this.value);
    this.cursor = cursor;
    cursor.class = "vector-selector-cursor"

    if (this._lastValue) {
      this.value = this._lastValue;
    }

    cursor.addEventListener("input", () => {
      this.innerHTML = cursor.name;
    })

    cursor.locked = true;
    this.onclick = async () => {
      cursor.locked = false;
      console.log(cursor.locked);
      await svg.tillClick();
      cursor.locked = true;
    }
  }

  get value(){
    let value = null;
    try {
      value = this.cursor.value;
    } catch(e) {}
    return value;
  }

  set value(v){
    try {
      this.cursor.value = v;
      this.innerHTML = this.cursor.name;
    } catch (e) {
      this._lastValue = v;
    }
  }

  ondisconnect(){
    this.cursor.remove();
  }
}

class Cursor extends SvgPlus {
  constructor() {
    super("g")
    const size = 15;
    this.createChild("path", {d: `M-${size},0L${size},0`})
    this.createChild("path", {d: `M0-${size}L0,${size}`})
    this.createChild("circle", {r: "3"});
    this.autoLockThreshold = 50;
  }

  findClosestAnchor(p) {
    let cname = "";
    let closest = null;
    if (this.anchors && typeof this.anchors === "object") {
      if (p in this.anchors) {
        closest = this.anchors[p];
        cname = p;
      } else if (p instanceof Vector){
        let minDist = null;
        for (let name in this.anchors) {
          let v = this.anchors[name];
          let dist = p.dist(v);
          if (minDist == null || dist < minDist) {
            minDist = dist;
            closest = v;
            cname = name;
          }
        }
        if (minDist > this.autoLockThreshold) {
          closest = p;
          cname = p.round(0) + "";
        }
      }
    }

    if (closest == null) {
      closest = p;
      if (!(p instanceof Vector)) {
        closest = new Vector();
      }
      cname = closest.round() + "";
    }

    return [closest, cname];
  }

  set value(value){
    let [v, name] = this.findClosestAnchor(value);
    this._value = v;
    this.name = name;
    if (v != null) {
      this.props = {transform: `translate(${v})`}
    }
    const event = new Event("input");
    this.dispatchEvent(event);
  }

  get value(){
    let v = this._value;
    if (v instanceof Vector) {
      v = v.clone();
    }
    return v;
  }
}

class SvgPro extends SvgPlus {
  constructor(el = "svg") {
    super(el);
    let original = [...this.children];
    this.foreground = this.createChild("g", {class: "background"})
    this.original = this.createChild("g", {class: "original"});
    for (let ogchild of original) {
      this.original.appendChild(ogchild);
    }
    this.foreground = this.createChild("g", {class: "foreground"})
    this.cursors = this.createChild("g", {class: "cursors"});

    this.vb = new ViewBox(this);
    let resize = () => {
      if (!this.isConnected) window.removeEventListener("resize", resize);
      else this.vb.displayRealSize();
    }
    window.addEventListener("resize", resize)
    window.requestAnimationFrame(() => {
      this.vb.displayRealSize();
    })

    let onwheel = (e) => {
      if (!this.isConnected) window.removeEventListener("wheel", onwheel);
      else {
        let sp = this.vb.screenToSVG(e);
        if (sp instanceof Vector) {
          this.vb.scaleAtPoint(e.deltaY, sp)
        }
      }
    }
    window.addEventListener("wheel", onwheel)

    let down = false;
    let startt = 0;
    let duration = 0;
    let distance = 0;
    let spos = new Vector;
    this.addEventListener("mousedown", (e) => {
      down = true;
      startt = performance.now();
      duration = 0;
      distance = 0;
      spos = new Vector(e);
    })

    let last = null;
    this.addEventListener("mousemove", (e) => {
      this.toggleAttribute("panning", false)
      if  (down) {
        this.toggleAttribute("panning", true)
        let next = new Vector(e);
        if (last != null) {
          this.vb.drag(next.sub(last));
        }
        last = next;
      }

      this.onMouseMove(e)
    })

    this.addEventListener("mouseup", (e) => {
      if (last == null) last = spos;
      distance = spos.dist(last);
      duration = performance.now() - startt;
      down = false;
      last = null;
      this.toggleAttribute("panning", false)
    });

    this.addEventListener("click", (e) => {
      if (distance > 10) {
        e.stopPropagation();
      } else {
        if (this.onClick instanceof Function) {
          if (this.onClick(e)) {
            e.stopPropagation();
          }
        }
      }
      duration = 0;
      distance = 0;
    })
  }

  async tillClick() {
    return new Promise((resolve, reject) => {
      this.onClick = (e) => {
        this.onClick = null;
        resolve(e);
        return true
      }
    });
  }

  onMouseMove(e){
    let point = this.vb.screenToSVG(e);
    let th = 50 * this.vb.scale;
    // update all unlocked cursors
    for (let cursor of this.cursors.children) {
      cursor.anchors = this.anchors;
      cursor.autoLockThreshold = th;
      if (!cursor.locked) {
        cursor.value = point
      }
    }
  }

  makeCursor(value) {
    let cursor = new Cursor();
    this.cursors.appendChild(cursor);
    cursor.anchors = this.anchors;
    return cursor;
  }

  frame(node) {
    if (this.frameRect) {
      this.frameRect.remove();
      this.frameRect = null;
      this.vb.onupdate = null;
    }

    if (!this.contains(node)) return;

    let frame = this.createChild("path", {
      class: "frame",
    })
    this.frameRect = frame;

    let [c1, size] = bBoxToVV(node.getBBox());
    let c2 = c1.addV(size.y);
    let c3 = c2.addH(size.x);
    let c4 = c1.addH(size.x);
    let nfpath = `M${c1}L${c2}L${c3}L${c4}`

    this.anchors = {
      "center": c1.add(c3).div(2),
      "top-left": c1,
      "bottom-left": c2,
      "bottom-right": c3,
      "top-right": c4,
      "center-left": c1.add(c2).div(2),
      "center-top": c1.add(c4).div(2),
      "center-right": c3.add(c4).div(2),
      "center-bottom": c3.add(c2).div(2),
    };

    let reframe = () => {
      let [pos, size] = this.vb.absoluteViewbox;
      let pad = new Vector(5, 5);
      let c1 = pos.sub(pad);
      let c3 = pos.add(size.add(pad));
      let c2 = c1.clone();
      c2.x = c3.x;
      let c4 = c1.clone();
      c4.y = c3.y;
      let vpath = `M${c1}L${c2}L${c3}L${c4}`;

      frame.setAttribute("d", nfpath + vpath);
    }

    this.vb.onupdate = reframe;
    reframe();
  }
}

SvgPlus.defineHTMLElement(VectorSelector);

export {SvgPro}
