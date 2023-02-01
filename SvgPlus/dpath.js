import {Vector, parseVector} from "./vector.js";
function pow(number, ind) {return Math.pow(number, ind)}
function isNonNaNVector(v) {
  return (v instanceof Vector && !v.isNaN);
}
function isNonNaNNumber(num) {
  return typeof num === "number" && !Number.isNaN(num);
}
function isNonEmptyString(string) {
  return typeof string === "string" && string.length > 0
}
function parseNumbers(string) {
  let numbers = [];

  if (isNonEmptyString(string)) {
    let matches = string.matchAll(/(-?\d*\.?\d+)/g);
    for (let match of matches) {
      numbers.push(parseFloat(match[0]))
    }
  }

  return numbers;
}

function cap(num, min, max) {
  if (num < min) num = min;
  if (num > max) num = max;
  return num;
}
function dotExt(constants, vectors) {
  let sum = new Vector(0);
  let i = 0;
  for (let constant of constants) {
    let v = parseVector(vectors[i]);
    sum = sum.add(v.mul(constant));
    i++;
  }
  return sum;
}

class CubicBezier {
  constructor(p1, t1, t2, p2) {
    this.points = [p1, t1, t2, p2];
  }
  getPoint(t) {
    try {
      let sum = new Vector(0);
      // compute constants
      t = cap(t, 0, 1);
      let t_1 = 1 - t;
      let tC = [
        pow(t_1, 3),
        3 * pow(t_1, 2) * t,
        3 * pow(t, 2) * t_1,
        pow(t, 3)
      ];

      sum = dotExt(tC, this.points);
      return sum;
    } catch (e) {
      return null;
    }
  }
  getGradient(t) {
    let sum = new Vector(0);
    try {
      // compute constants
      t = cap(t, 0, 1);
      let t_1 = 1 - t;

      let tC = [
         -3*pow(t_1, 2),
         -6*t*t_1 + 3*pow(t_1, 2),
         6*t*t_1 - 3*pow(t, 2),
         3*pow(t, 2)
      ];

      sum = dotExt(tC, this.points)
      return sum;
    } catch (e) {
      // console.log(e);
      return null;
    }

  }
  static parseCPoint(cp) {
    try {
      if (!cp.isAbsolute || cp.cmd_TYPE == "A") return null;
      let end = cp.p;
      let start = cp.last.p;
      let c2 = end.clone();
      let c1 = start.clone();

      let type = cp.cmd_TYPE;
      switch (type) {
        case "C":
          c1 = cp.c1;
          c2 = cp.c2;
        break;
        case "S":
          c2 = cp.c2;
          c1 = start.mul(2).sub(cp.last.c2);
        break;
        case "Q":
          c1 = cp.c1;
          c2 = c1.clone();
        break;
        case "T":
          c1 = start.mul(2).sub(cp.last.c1);
          c2 = c1.clone();
        break;
      }

      return new CubicBezier(start, c1, c2, end)
    } catch (e) {
      return null;
    }
  }
}


class LinkItem{
  constructor(){
    this._last = null;
    this._next = null;
  }

  set next(next){
    if (next instanceof LinkItem){
      this._next = next;
    }else{
      if (next != null) throw `error next set to non link item`
      this._next = null;
    }
  }

  get next(){
    return this._next;
  }

  set last(last){
    if (last instanceof LinkItem){
      this._last = last;
    }else{
      if (last != null) throw `error last set to non link item`
      this._last = null;
    }
  }

  get last(){
    return this._last;
  }

  link(l2){
    this.next = l2;
    l2.last = this
  }

  break(dir = 'both'){
    if (dir === 'next'){
      if (this.next != null){
        this.next.last = null;
        this.next = null;
      }
    }else if (dir === 'last'){
      if (this.last != null){
        this.last.next = null;
        this.last = null;
      }
    }else if(dir === 'both'){
      if (this.last != null){
        this.last.next = null;
        this.last = null;
      }
      if (this.next != null){
        this.next.last = null;
        this.next = null;
      }
    }
  }

  clear(){
    this.last = null;
    this.next = null;
  }
}

const LinkListMainMethods = ["push", "pop", "dequeue", "queue", "clear", "find", "insertAfter", "rotateTo"]
class LinkList{
  constructor(){
    this._start = null;
    this._end = null;
    this._length = 0;
  }

  get length(){
    return this._length;
  }

  get isEmpty(){
    if (this._length == 0 || this.end == null || this.start === null) {
      if (this._length != 0) {
        console.log("invalid length" + this._length);
        this._length = 0;
      }
      return true;
    }
    return false;
  }

  set start(start){
    if (start instanceof LinkItem){
      this._start = start;
      start.last = null;
    }else{
      if (start != null) throw `error start set to non link item`
      this._start = null;
    }
  }

  get start(){
    return this._start;
  }

  set end(end){
    if (end instanceof LinkItem){
      this._end = end;
      end.next = null
    }else{
      if (end != null) throw `error end set to non link item`
      this._end = null;
    }
  }

  get end(){
    return this._end;
  }

  // Pushes LinkItem or LinkList at the end of this list
  push(item){
    if (item instanceof LinkItem){
      //if the node was unset <start> => item <= <end>
      if (this.isEmpty){
        this.start = item; // <start> => <item>
        this.end = item;   // <end> = <item>

        //Otherwise end refers to <end> <=> <item>
      }else{//                    <end> = item

        this.end.link(item);
        this.end = item;
      }

      this._length ++;
    }else if(item instanceof LinkList){
      if (this.isEmpty) {
        this.end = item.end;
        this.start = item.start;
        this._length = item.length;
      } else {
        this.end.link(item.start);
        this.end = item.end;
        this._length += item.length;
      }
      item.clear();
    }
  }


  // Pop linked item from the end of the list
  pop(){
    if (this.isEmpty){
      return null
    }else if (this.end == this.start){
      this._length = 0;
      let temp = this.end;
      this.end = null;
      this.start = null;
      return temp;
    }else{
      this._length--;
      let oldl = this.end;
      let newl = this.end.last;
      oldl.break();
      this.end = newl;
      return oldl
    }
  }

  // Dequeue linked item from the start of the list
  dequeue(){
    if (this.length > 1){
      this._length --;
      let oldl = this.start;
      let newl = this.start.next;
      oldl.break();
      this.start = newl;
      return oldl
    } else {
      return this.pop();
    }
  }

  // Puts LinkList or LinkItem at start of this list
  queue(item){
    if (this.isEmpty){
      if (item instanceof LinkItem){
        item.clear();
        item.link(this.start);
        this.start = item;
        this._length ++;
      } else if(item instanceof LinkList){
        item.end.link(this.start);
        this.start = item.start;
        this._length += item.length;
        item.clear();
      }
    } else {
      this.push(item);
    }
  }

  *[Symbol.iterator]() {
    let start = this.start;
    while (start instanceof LinkItem) {
      yield start;
      if (start == this.end) break;
      start = start.next;
    }
  }

  forEach(visit){
    if (!(visit instanceof Function)){
      throw 'forEach expects a function as its first parameter'
      return
    }

    let cur = this.start;
    let i = 0;
    visit(cur, i);
    while (cur != this.end){
      if (cur.next == null){
        throw 'List is disjointed'
        return
      }else{
        cur = cur.next;
        i++;
        visit(cur, i);
      }
    }
  }

  clear(){
    this._end = null;
    this._start = null;
    this._length = 0;
  }

  find(node) {
    let found = null;
    let i = 0;
    if (node instanceof LinkItem) {
      for (let item of this) {
        i++
        if (item == node) {
          found = item;
          break;
        }
      }
    }
    return [found, i];
  }

  insertAfter(before, item) {
    [before] = this.find(before)
    if (before == null)  throw 'Item before is not in list.'

    if (before == this.end || this.isEmpty) {
      this.push(item);
    } else {
      let after = before.next;
      if (item instanceof LinkItem) {
        before.link(item);
        item.link(after);
        this._length ++;
      } else if (item instanceof LinkList) {
        before.link(item.start);
        item.end.link(after);
        this._length += item.length;
        item.clear();
      }
    }
  }

  rotateTo(item) {
    [item] = this.find(item);
    if (item == null) throw "Item not a LinkItem";
    let end = item.last;
    if (end != null) {
      this.end.link(this.start);
      this.start = item;
      this.end = end;
    }
  }
}

const CORNER_THRESHOLD = 20;//deg
class CPoint extends LinkItem{
  constructor(string){
    super();
    this.DPath = null;
    this.precision = 5;
    this.cmd_type = 'L';
    this._p = new Vector(0, 0);
    this._c1 = new Vector(0, 0);
    this._c2 = new Vector(0, 0);
    this._r = new Vector(0, 0);
    this._x_axis_rotation = 0;
    this._large_arc_flag = 0;
    this._sweep_flag = 0;
    this.cmd = string
  }

  clone(){
    return new CPoint(`${this}`);
  }

  /* Set Svg Command Point
  svg-path-command: String
  String Format:
  'M x, y' or 'm dx, dy'
  'L x, y' or 'l dx, dy'
  'H x' or 'h dx'
  'V y' or 'v dy'
  'C x1, y1, x2, y2, x, y' or 'c dx1, dy1, dx2, dy2, dx, dy'
  'Q x1, y1, x, y' or 'q dx1 dy1, dx dy'
  'S x, y' or 's dx, dy'
  'T x, y' or 't dx, dy'
  'A rx ry x-axis-rotation large-arc-flag sweep-flag x y' or 'a rx ry x-axis-rotation large-arc-flag sweep-flag dx dy' */
  set cmd(value){
    // parse input
    let type = null;
    let params = [];
    if (isNonEmptyString(value)) {
      type = value[0];
      params = parseNumbers(value);
    } else if (Array.isArray(value)) {
      for (let param of value) {
        if (type == null) {
          type = param;
        } else if (isNonNaNVector(param)) {
          params.push(param.x);
          params.push(param.y);
        } else if (isNonNaNNumber(param)) {
          params.push(param)
        }
      }
    }

    // check type validity
    let typea = null;
    if (CPoint.isType(type)) {
      typea = type.toUpperCase();
      let nparams = CPoint.CMDS[typea];
      if (params.length != nparams) {
        throw `Error setting cmd: ${value} invalid parameters\n\texpected ${nparams} but ${params.length} where found.`
      }
    } else {
      throw 'invalid cpoint type'
    }

    // fill parameters
    switch (typea) {
      case "C":
      this.c1 = new Vector(params);
      this.c2 = new Vector(params, 2);
      this.p = new Vector(params, 4);
      break;

      case "H":
      this.p = new Vector(params[0], 0);
      this.c1 = this.p
      this.c2 = this.p
      break;

      case "V":
      this.p = new Vector(0, params[0]);
      this.c1 = this.p
      this.c2 = this.p
      break;

      case "S":
      this.c2 = new Vector(params);
      this.p = new Vector(params, 2);
      break;

      case "Q":
      this.c1 = new Vector(params);
      this.c2 = new Vector(params);
      this.p = new Vector(params, 2);
      break;

      case "A":
      this.r = new Vector(params);
      this.x_axis_rotation = params[2];
      this.large_arc_flag = params[3];
      this.sweep_flag = params[4];
      this.p = new Vector(params, 5);
      break;

      default:
      this.p = new Vector(params);
      this.c1 = this.p
      this.c2 = this.p
    }


    //If inputs where valid set cmd_type
    this.cmd_type = type;
  }
  get cmd(){
    return this.toString()
  }

  set cmd_type(type){
    if (CPoint.isType(type)){
      this._cmd_type = type;
    }else{
      this._cmd_type = null;
    }
  }
  get cmd_type(){
    return this._cmd_type;
  }
  get cmd_TYPE(){return this.cmd_type.toUpperCase()}

  get p(){
    return this._p.clone();
  }
  set p(v){
    if (isNonNaNVector(v)){
      this._p = v;
    }
  }
  get c1(){
    return this._c1.clone();
  }
  set c1(v){
    if (isNonNaNVector(v)){
      this._c1 = v;
    }
  }
  get c2(){
    return this._c2.clone();
  }
  set c2(v){
    if (isNonNaNVector(v)){
      this._c2 = v;
    }
  }
  get r(){
    return this._r.clone();
  }
  set r(v){
    if (isNonNaNVector(v)){
      this._r = v;
    }
  }
  get x_axis_rotation(){
    return this._x_axis_rotation;
  }
  set x_axis_rotation(angle){
    if (isNonNaNNumber(angle)){
      this._x_axis_rotation = angle;
    }else{
      this._x_axis_rotation = 0;
    }
  }
  get large_arc_flag(){
    return this._large_arc_flag;
  }
  set large_arc_flag(bool){
    if (bool){
      this._large_arc_flag = 1;
    }else{
      this._large_arc_flag = 0;
    }
  }
  get sweep_flag(){
    return this._sweep_flag;
  }
  set sweep_flag(bool){
    if (bool){
      this._sweep_flag = 1;
    }else{
      this._sweep_flag = 0;
    }
  }

  add(x, y){
    this.p = this.p.add(x, y);
    this.c1 = this.c1.add(x, y);
    this.c2 = this.c2.add(x, y);
  }
  sub(x = 0, y = x){
    this.p = this.p.sub(x, y);
    this.c1 = this.c1.sub(x, y);
    this.c2 = this.c2.sub(x, y);
  }
  div(x = 0, y = x){
    this.p = this.p.div(x, y);
    this.c1 = this.c1.div(x, y);
    this.c2 = this.c2.div(x, y);
  }
  mul(x = 0, y = x){
    this.p = this.p.mul(x, y);
    this.c1 = this.c1.mul(x, y);
    this.c2 = this.c2.mul(x, y);
  }
  get x(){
    return this.p.x;
  }
  set x(val){
    val = parseFloat(val);
    if (Number.isNaN(val)) return;
    this._p.x = val;
  }
  get y(){
    return this.p.y;
  }
  set y(val){
    val = parseFloat(val);
    if (Number.isNaN(val)) return;
    this._p.y = val;
  }
  dist(x, y){
    return this.p.dist(x, y);
  }

  get isAbsolute(){
    return (this.cmd_type && (this.cmd_type == this.cmd_type.toUpperCase()))
  }

  // only for absolute
  get cubic(){
    return CubicBezier.parseCPoint(this);
  }
  get isCorner(){
    try{
      let cubic = this.cubic;
      let next = this.next.cubic;

      if (cubic.points[0].sub(cubic.points[3]).norm() < 0.1) throw 'single point'
      if (next.points[0].sub(next.points[3]).norm() < 0.1) throw 'single point'

      let d = 0.01;
      let p1 = cubic.getPoint(1-d);
      let g1 = cubic.getGradient(1-d).mul(-1);
      let t1 = p1.add( g1.dir().mul(50) );
      let p2 = next.getPoint(d);
      let g2 = next.getGradient(d)
      let t2 = p2.add( g2.dir().mul(50) );

      let angle = g1.angleBetween(g2) * 180 / Math.PI;
      return Math.abs(angle - 180) > CORNER_THRESHOLD;
    }catch(e) {
      return false;
    }
  }

  toString(dp = 3){
    let p = this.p.round(dp);

    switch (this.cmd_type.toUpperCase()) {
      //    Move: x, y
      case 'M': return `${this.cmd_type}${p}`;

      //    Line: x, y
      case 'L': return `${this.cmd_type}${p}`;

      //    Horizontal Line: x
      case 'H': return `${this.cmd_type}${p.x}`;

      //    Vertical Line: y
      case 'V': return `${this.cmd_type}${p.y}`;

      //    Bézier Curve: x1, y1, x2, y2, x, y
      case 'C': return `${this.cmd_type}${this.c1.round(dp)},${this.c2.round()},${p}`;

      //    Reflection Bézier: x2, y2, x, y
      case 'S': return `${this.cmd_type}${this.c2.round(dp)},${p}`;

      //    Quadratic Curve: x1, y1, x, y
      case 'Q': return `${this.cmd_type}${this.c1.round(dp)},${p}`;

      //    Quadratic Curve String: x, y
      case 'T': return `${this.cmd_type}${p}`;

      //    Arc: rx, ry, x-axis-rotation, large-arc-flag, sweep-flag, x, y
      case 'A': return `${this.cmd_type}${this.r.round(dp)},${this.x_axis_rotation},${this.large_arc_flag},${this.sweep_flag}${p}`;

      //    Close:
      case 'Z': return `${this.cmd_type}`
    }
  }
  static typeParamNum(type) {
    if (CPoint.isType(type)) {
      return CPoint.CMDS[type.toUpperCase()];
    } else {
      return null
    }
  }
  static isType(type) {
    return isNonEmptyString(type) && type.toUpperCase() in CPoint.CMDS;
  }
  static CMDS = {
    "Z": 0,
    "M": 2,
    "L": 2,
    "T": 2,
    "C": 6,
    "H": 1,
    "V": 1,
    "S": 4,
    "Q": 4,
    "A": 7,
  }
}


const DPathMainMethods = ["splitAt", "makeAbsolute", "makeRelative"]
class DPath extends LinkList{
  constructor(string = null){
    super();
    if (string != null && typeof string !== 'undefined' && string.length != 0){
      this.d_string = string;
    }
    this.addCmdMethods(this);
  }
  addCmdMethods(obj) {
    let dpath = this;
    for (let cmda in CPoint.CMDS) {
      for (let cmd of [cmda, cmda.toLowerCase()]) {
        obj[cmd] = function (){
          let args = [cmd, ...arguments]
          let cp = new CPoint(args);
          dpath.push(cp);
          obj.dPathUpdated = true;
          return obj;
        }
      }
    }
  }

  find(cpoint){
    let res = [null, 0];
    if (cpoint instanceof CPoint) {
      res = super.find(cpoint);
    }
    return res;
  }

  splitAt(cp) {
    let [cpoint, i] = this.find(cp);

    let split = null;
    if (cpoint != null) {
      let splitl = this.length - i;
      if (splitl > 0) {
        split = new DPath();
        split.end = this.end;
        split.start = cpoint.next;
        split._length = splitl;
        this.end = cpoint;
        this._length = i;
      }
    }

    return split;
  }
  makeAbsolute(){
    if (this.isEmpty) return;
    let start = this.start.p;
    let last = this.start.p;
    for (var point of this){

      if (point.cmd_type == "Z") {
        point.p = start;
      }else if (point.cmd_type == 'V'){
        point.x = last.x;
      } else if (point.cmd_type == 'H'){
        console.log(point.p + " " + last.y);
        point.y = last.y;
        console.log(point.p + "");

      }

      if (point.isAbsolute){
        last = point.p;
      }else{
        point.add(last);
        point.cmd_type = point.cmd_type.toUpperCase();
        last = point.p
      }

    }
  }
  makeRelative(){
    this.makeAbsolute();
    let cur = this.end;
    while (cur != this.start){
      cur.sub(cur.last.p);
      cur.cmd_type = cur.cmd_type.toLowerCase();
      cur = cur.last;
    }
  }

  set d_string(string){
    if (isNonEmptyString(string)){
      //Remove white space
      let cmds = string.replace(/( |\n|\t|\r)/g, '');

      cmds = cmds.matchAll(/([MmLlHhVvZzCcSsQqTtAa])|(-?\d*(\.\d+)?)/g);
      let nparams = null;
      let type = null;
      let paramBuffer = [];
      for (var cmd of cmds){
        let value = cmd[0];
        if (isNonEmptyString(value)) {
          if (CPoint.isType(value)) {
            nparams = CPoint.typeParamNum(value);
            type = value;
          } else {
            paramBuffer.push(parseFloat(value));
          }
          if (paramBuffer.length == nparams) {
            paramBuffer.unshift(type);
            let cp = new CPoint(paramBuffer);
            this.push(cp);
            paramBuffer = []
          }
        }
      }
    } else {
      throw `Error setting d:\nd must be set to a string, not ${typeof string}`
    }
  }

  *[Symbol.iterator]() {
    let start = this.start;
    while (start) {
      yield start;
      start = start.next;
    }
  }

  toString(dp = 3){
    let str = ''
    if (this.end == null) {return str}
    for(var item of this){
      str += `${item.toString(dp)}`
    }
    return str
  }
}

export {DPath, CPoint, Vector, LinkListMainMethods, DPathMainMethods, parseNumbers}
