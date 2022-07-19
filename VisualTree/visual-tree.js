import {getNodeLayout} from "./node-layout.js";
import {SvgPlus, Vector} from "../SvgPlus/4.js"

const node_size = 7.5;
const padding = 3.5 / 2;

function getColor(node) {
  return window.getComputedStyle(node).fill;
}
class VNode extends SvgPlus{
  constructor(node) {
    super("g");
    this.classList.add("vnode")
    this._pos = null;
    this._lastPos = null;
    this._nextPos = null;
    this.node = node;
    node.vnode = this;
    this.mainIcon = this.createChild("ellipse", {rx: node_size/2, ry: node_size/2})
    if (node.makeVNode instanceof Function) {
      node.makeVNode(this);
    }

  }

  get color(){
    return getColor(this.mainIcon);
  }

  set nextPos(pos) {
    this._lastPos = this._pos;
    this._nextPos = pos.clone();
  }
  get lastPos(){
    if (this._lastPos == null) return new Vector;
    return this._lastPos.clone();
  }
  get nextPos(){
    if (this._nextPos == null) return new Vector;
    return this._nextPos.clone();
  }

  get delta(){
    // console.log(this._lastPos);
    if (this._lastPos == null) return 0;
    return this.lastPos.dist(this.nextPos);
  }

  set collapsed(value){
    if (value && this.node.children.length > 0) {
      this._addElipses();
    } else {
      if (this.elipses)
        this.elipses.remove();
    }
    this.node.collapsed = value;
    this._collapsed = value;
  }
  _addElipses(){
    let g = this.createChild("g");
    let r = node_size/15;
    let y = node_size/1.5;
    g.createChild("circle", {r: r, cx: 0, cy: y})
    g.createChild("circle", {r: r, cx: -3*r, cy: y});
    g.createChild("circle", {r: r, cx: 3*r, cy: y});
    this.elipses = g;
  }

  get collapsed(){
    return this._collapsed;
  }


  set pos(v){
    v = new Vector(v);
    this._pos = v;
    this.props = {
      transform: `translate(${v.x}, ${v.y})`,
    }
  }

  get pos(){
    if (this._pos == null) return new Vector();
    return this._pos.clone();
  }
}

class VisualTree extends SvgPlus {
  onconnect(){
    this.innerHTML = "";
    this.svg = this.createChild("svg");
    this.defs = this.svg.createChild("defs");
    this.edges = this.svg.createChild("g", {class: "edges"});
    this.nodes = this.svg.createChild("g", {class: "nodes"});
    this._lastvb = [new Vector, new Vector]
    this._vb = [new Vector, new Vector]
    this.lastNodes = new Set();
  }

  set tree(root){
    this.update(0, root);
  }

  async toggleCollapse(node) {
    node.collapsed = !node.collapsed;
    await this.update(350);
  }

  async update(time, root = this.root) {
    //stop the transition in place
    if (this.transition instanceof Promise) {
      await this.transition
    }
    this._stop = false;

    this.root = root;

    let [added, removed] = this._updateVNodes(root);
    let diff = this._positionVNodes();

    for (let child of removed) {
      this.nodes.removeChild(child);
    }


    //start transition if is applicable
    if (time > 0 && diff > 0) {
      this.transition = this.waveTransistion((a) => {
        if (this._stop) return true;
        this._setUpdateState(a);
      }, time, true);
      await this.transition;
      this.transition = null;
    }


    for (let child of added) {
      this.nodes.appendChild(child);
    }

    if (!this._stop) {
      this._setUpdateState(1);
    }
  }

  __makeVNode(node) {
    let vnode = new VNode(node);
    vnode.ondblclick = async () => {
      this.toggleCollapse(vnode);
      await this.update(350);
    }
    vnode.onclick = () => {
      const event = new Event("select");
      event.value = vnode.node;
      this.dispatchEvent(event);
    }
    // check for node builder function
    if (this.nodeBuilder instanceof Function) {
      this.nodeBuilder(vnode);
    }
    return vnode;
  }

  _updateVNodes(root) {
    let added = new Set();
    let recurse = (node, collapsed = false) => {
      for (let child of node.children) {
        recurse(child, collapsed || node.collapsed);
      }

      let vnode = node.vnode;
      if (!SvgPlus.is(vnode, VNode)) {
        vnode = this.__makeVNode(node);
      }
      if (!collapsed) {
        added.add(vnode);
      }
    }

    recurse(root)

    let removed = new Set();
    for (let node of this.lastNodes) {
      if (!added.has(node)) {
        removed.add(node);
      }
    }
    this.lastNodes = new Set([...added]);

    return [added, removed]
  }

  _positionVNodes(root = this.root) {
    let layout = getNodeLayout(root, node_size);
    let diff = 0;
    let applyPosition = (node, lay) => {
      node.vnode.nextPos = lay.position;
      diff += node.vnode.delta;
      for (let i = 0; i < lay.children.length; i++) {
        applyPosition(node.children[i], lay.children[i]);
      }
    }
    applyPosition(root, layout);
    this.viewbox = layout.viewbox;
    diff += this.vbdelta;
    return diff;
  }
  get vbdelta(){
    return this._lastvb[0].sub(this._vb[0]).norm() + this._lastvb[1].sub(this._vb[1]).norm()
  }

  set viewbox(vecs) {
    this._lastvb = this._vb;
    this._vb = vecs;
  }

  _setUpdateState(a){
    this.__setViewboxState(a);
    for (let node of this.lastNodes) {
      let v = node.nextPos.mul(a).add(node.lastPos.mul(1 - a));
      node.pos = v;
    }
    this.__updateEdges()
  }

  __setViewboxState(a, pad = padding){
    if (a < 0) a = 0;
    if (a >= 1) a = 1;

    let [pos, size] = this._vb;
    let [lastPos, lastSize] = this._lastvb;

    let p = pos.mul(a).add(lastPos.mul(1 - a));
    let s = size.mul(a).add(lastSize.mul(1 - a))

    this.svg.props = {"viewBox": `${p.x - pad} ${p.y - pad} ${s.x + 2*pad} ${s.y + 2*pad}`}

    if (a == 1) {
      this._lastvb = [p, s]
    }
  }

  __updateEdges(node = this.root){
    this.___resetGradients();
    this.edges.innerHTML = "";

    let recurse = (node) => {
      if (!node.vnode || !node.vnode.isConnected) return;
      for (let child of node.children) {
        if (child.vnode && child.vnode.isConnected){
          this.___makeEdge(node, child);
          recurse(child);
        }
      }
    }

    recurse(node)
  }

  ___resetGradients(){
    this.defs.innerHTML = "";
    this.gradients = {};
    this.gradients_id_count = 0;
  }

  ___makeEdge(parent, child) {
    let t = node_size * 1.7 * 0.3642;
    let s = parent.vnode.pos;
    s.y += node_size / 2;

    let e = child.vnode.pos;
    e.y -= node_size / 2;

    let t1 = s.addV(t);
    let t2 = e.addV(-t);

    if (Math.abs(e.x - s.x) < 1e-5) {
      t1 = s.add(new Vector(0, t).rotate(0.2))
      t2 = e.add(new Vector(0, -t).rotate(0.2))
    }

    let pc = parent.vnode.color;
    let cc = child.vnode.color;

    let id = this.____makeGradient(pc, cc)
    this.edges.createChild("path", {
      style: {
        stroke: `url(#${id})`
      },
      d: `M${s}C${t1},${t2},${e}`
    });
  }

  ____makeGradient(c1, c2) {
    let key = c1 + c2;
    let id = null;
    if (key in this.gradients) {
      id = this.gradients[key];
    } else {
      id = "edge" + this.gradients_id_count;
      this.gradients_id_count++;
      this.gradients[c1 + c2] = id;
      this.defs.innerHTML += `
      <linearGradient id="${id}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="30%" stop-color = "${c1}" stop-opacity = "1"/>
      <stop offset="90%" stop-color = "${c2}" stop-opacity = "1" />
      </linearGradient>`
    }
    return id;
  }
}


SvgPlus.defineHTMLElement(VisualTree);
export{VisualTree}
