// 2D vector class
let DecimalPlaces = 5;
const ZERO_TOLERENCE = 1e-8;
function parseNumber(num) {
  if (typeof num === "number") return num;
  return parseFloat(num);
}
function sqr(v){return v*v}
function abs(v){return Math.abs(v)}
function sqrt(v){return Math.sqrt(v)}
function sin(v){return Math.sin(v)}
function cos(v){return Math.cos(v)}
function ceil(v){return Math.ceil(v)}
function floor(v){return Math.floor(v)}
function isNaN(v){return Number.isNaN(v)}
function isArray(v){return Array.isArray(v)}
function isNonNullObject(o){return o != null && typeof o === "object"}
function isNumber(v){return typeof v === "number"}
function isNonNaNNumber(v){return isNumber(v) && !isNaN(v)}
function round(num, dp = 0){
  let pow = isNonNaNNumber(dp) ? Math.pow(10, dp) : 1;
  return Math.round(num*pow)/pow;
}
function isZero(num) {
  return abs(num) < ZERO_TOLERENCE;
}
function atan(rise, run){
  if(isZero(rise) && isZero(run)){
    return 0
  }
  let theta = Math.atan(abs(rise)/abs(run))
  let pi = Math.PI
  if(rise > 0){
    if(run > 0){
      return theta
    }else if(run < 0){
      return pi - theta
    }else{
      return pi/2
    }
  }else if(rise < 0){
    if(run > 0){
      return theta + 3*pi/2
    }else if(run < 0){
      return theta + pi
    }else{
      return 3*pi/2
    }
  }else{
    if(run >= 0){
      return 0
    }else{
      return pi
    }
  }
}

function parseVector(x, y = x) {
  if (x instanceof Vector) {
    return x;
  } else {
    return new Vector(x, y);
  }
}

class NaNError extends Error {
  constructor(name, p = "'s") {
    super(`${name} of NaN vector${p}`)
  }
}

class Vector {
  constructor(x = 0, y = x){
    if (isArray(x)) {
      let i = isNonNaNNumber(y) ? y : 0;
      y = x[i+1];
      x = x[i];
    } else if (isNonNullObject(x)) {
      y = x.y;
      x = x.x;
    }

    this.x = x;
    this.y = y;
  }

  add(x = 0, y = x) {
    let v = parseVector(x, y);
    if (this.isNaN || v.isNaN)
      throw new NaNError("Addition")
    return new Vector(this._x + v.x, this._y + v.y)
  }
  sub(x = 0, y = x) {
    let v = parseVector(x, y);
    if (this.isNaN || v.isNaN)
      throw new NaNError("Subtraction");
    return new Vector(this._x - v.x, this._y - v.y)
  }
  mul(x = 0, y = x) {
    let v = parseVector(x, y);
    if (this.isNaN || v.isNaN)
      throw new NaNError("Multiplication");
    return new Vector(this._x * v.x, this._y * v.y)
  }
  div(x = 0, y = x) {
    let v = parseVector(x, y);
    if (this.isNaN || v.isNaN)
      throw new NaNError("Division");

    if (isZero(v.x) || isZero(v.y))
      throw new Error("Division by zero containing vector.");

    return new Vector(this._x / v.x, this._y / v.y)
  }
  dot(x = 0, y = x){
    let v = parseVector(x, y);
    if (this.isNaN || v.isNaN)
      throw new NaNError("Dot Product");
    return this._x * v.x + this._y * v.y
  }
  angleBetween(x = 0, y = x){
    let v = parseVector(x, y);
    let a = this.norm()
    let b = v.norm()
    let c = this.distance(v)
    if (isZero(a)|| isZero(b) || isZero(c)){
      return 0
    }
    return Math.acos((sqr(c) - sqr(a) - sqr(b))/(-2*a*b))
  }
  distance(x = 0, y = x){
    let v = parseVector(x, y);
    return v.sub(this).norm();
  }
  dist(x = 0, y = x){
    return this.distance(x, y)
  }
  addV(d) {
    d = parseNumber(d);
    if (isNaN(d) || this.isNaN)
      throw new NaNError("Vertical Addition");
    return new Vector(this._x, this._y + d);
  }
  addH(d) {
    d = parseNumber(d);
    if (isNaN(d) || this.isNaN)
      throw new NaNError("Horizontal Addition");
    return new Vector(this._x + d, this._y)
  }

  grad(){
    if (this.isNaN)
      throw new NaNError("Gradient", "")

    if (isZero(this._x)) return Infinity
    return this._y / this._x;
  }
  sqrt() {
    if (this.isNaN)
      throw new NaNError("Square Root", "");
    return new Vector(sqrt(this._x), sqrt(this._y))
  }
  norm(){
    if (this.isNaN)
      throw new NaNError("Normal length", "")
    return sqrt(sqr(this._y) + sqr(this._x))
  }
  arg(){
    if (this.isNaN)
      throw new NaNError("Argument", "")
    return atan(this._y, this._x);
  }
  dir(){
    let norm = this.norm();
    if(isZero(norm)) {
      return new Vector(0,0)
    }
    return this.div(norm)
  }
  rotate(theta){
    theta = parseNumber(theta);
    if (this.isNaN || isNaN(theta))
    throw new NaNError("Rotation", "")
    return new Vector(this._x*cos(theta) - this._y*sin(theta), this._x*sin(theta) + this._y*cos(theta))
  }
  lurpTo(v, d){
    v = parseVector(v);
    d = parseNumber(d);
    if (isNaN(d)) d = 0;
    if (d < 0) d = 0;
    if (d > 1) d = 1;

		return this.mul(1 - d).add(v.mul(d));
	}
  distToLine(p1, p2){
    p2 = parseVector(p2);
    let line = p2.sub(p1).rotate(Math.PI/2)
    let d = line.dot(this.sub(p1))/line.norm()
    return abs(d)
  }
  reflect(direction = 'V'){
    let newVector = null
    direction = direction.toUpperCase();
    if ( direction.indexOf('V') !== -1 ){
      newVector = this.mul(new Vector(1, -1));
    }

      if( direction.indexOf('H') !== -1 ){
      newVector = this.mul(new Vector(-1, 1));
    }
    return newVector;
  }

  floor(){
    return new Vector(floor(this._x), floor(this._y))
  }
  ceil(){
    return new Vector(ceil(this._x), ceil(this._y))
  }

  round(n){
    return new Vector(round(this._x, n), round(this._y, n))
  }

  clone() {return new Vector(this._x, this._y)};
  toString(n = DecimalPlaces) {
    return `${round(this._x, n)},${round(this._y, n)}`
  }

  set x(v){
    let n = parseNumber(v);
    // console.log(n);
    this._x = n;
  }
  get x(){return this._x;}
  set y(v){ this._y = parseNumber(v); }
  get y(){return this._y;}
  get isNaN() {return isNaN(this._x) || isNaN(this._y)}
  get isZero(){return (isZero(this._x) && isZero(this._y))}

  static parseVector(x = 0, y = x) {return parseVector;}
  static intersection(a1, b1, a2, b2, onSegment = true) {
    a1 = parseVector(a1);
    b1 = parseVector(b1);
    a2 = parseVector(a2);
    b2 = parseVector(b2);
  	// m = y/x
  	let m1 = b1.sub(a1).grad();
  	let m2 = b2.sub(a2).grad();
  	// c = y - mx
  	let c1 = a1.dot(-m1, 1);
  	let c2 = a2.dot(-m2, 1);

    let isec = new Vector(null);
    if (!isZero(m1 - m2)) {
      let x = (c2 - c1) / (m1 - m2);
      let y = m1 * x + c1;
      isec = new Vector(x, y)
    }

		if (!isec.isNaN) {
			let ab = b1.sub(a1);
			let ai = i.sub(a1);
			let kac = ab.dot(ai);
			let kab = ab.dot(ab);
			if (!(kac > 0 && kab > kac) && onSegment) {
				isec = null;
			}
		} else {
      isec = null
    }

  	return isec;
  }
}

export {Vector, parseVector}
