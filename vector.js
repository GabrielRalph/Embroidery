// let v̄ = (x, y) => {
// 	let res;
// 	try {
// 		res = new Vector(x, y);
// 	}catch(e){
// 		throw e;
// 	}
// 	return res;
// }

class Vector{
	constructor(x = 0, y = null){
    this.x = x;
    this.y = y;

		// If the first parameter is an array
    if(x instanceof Array && typeof x !== 'string'){
			try{
				y = y == null ? 0: y;
				y = parseFloat(y);
				if (Number.isNaN(y)){
					throw `\nNumber conversion:\nNumber | parseFloat(String)`
				}

			}catch (e){
				y = 0;
				throw `\nVector Input Format:\n(array: Array, offset: Number)\n${e}`
			}

			if (y >= x.length - 1){
				y = 0;
			}
			//Fill the array using y as an offset, if y is not a number it will be set as Zero
			try{
				this.x = parseFloat(x[y]);
				this.y = parseFloat(x[y + 1]);
				if (Number.isNaN(this.y) || Number.isNaN(this.x)){
					throw `\nNumber conversion:\nNumber | parseFloat(String)`
				}

			}catch(e){
				this.x = 0;
				this.y = 0;
				throw `${e}\nVector Input Format:\n(array, offset*) ==> V ( array[0 + offset*], array[1 + offset*] )\n\n*note: offset - optional, defaults to 0`
			}

		//If x is a vector or object set accordingly
	}else if(x instanceof Vector || x instanceof Object || typeof x === 'object' && x !== null){
			if ('x' in x && 'y' in x){
				try {
					this.x = parseFloat(x.x);
					this.y = parseFloat(x.y);
					if (Number.isNaN(this.y) || Number.isNaN(this.x)){
						throw `\nNumber conversion:\nNumber | parseFloat(String)`
					}

				}catch (e){
					this.x = 0;
					this.y = 0;
					throw `\nVector Input Format:\n(obj)\nobj.x: Number|String(as number)\nobj.y: Number|String`
				}
			}else{
				if (y instanceof Object || typeof y === 'object' && y !== null){
					if (('x' in y && 'y' in y) && (y.x in x && y.y in x)){
						try {
							this.x = parseFloat(x[y.x]);
							this.y = parseFloat(x[y.y]);
							if (Number.isNaN(this.y) || Number.isNaN(this.x)){
								throw `\nNumber conversion:\nNumber | parseFloat(String)`
							}

						}catch (e){
							this.x = 0;
							this.y = 0;
							throw `\nVector Input Format:\n(obj, keys)\nobj[keys.x]: Number|String(as number)\nobj[keys.y]: Number|String`
						}

					}else{
						this.x = 0;
						this.y = 0;
						throw `\nVector Input Format:\n(obj, keys) ==> V ( obj[keys.x], obj[keys.y] )\n(obj) ==> V ( obj.x, obj.y )`
					}
				}else{
					throw `\nVector Input Format:\n(obj, keys) ==> V ( obj[keys.x], obj[keys.y] )\n(obj) ==> V ( obj.x, obj.y )`
				}
			}
    }else if(y === null){
			try {
				this.x = parseFloat(x);
				this.y = this.x;
				if (Number.isNaN(this.y) || Number.isNaN(this.x)){
					throw `\nNumber conversion:\nNumber | parseFloat(String)`
				}

			}catch (e){
				this.x = 0;
				this.y = 0;
				throw `\nVector Input Format:\n(param) ==> V ( param.x, param.y )\n\nor\n\n(param) ==> V (param, param)\nwhere\nparam: Number|String )`
			}
		}else{
			try {
				this.x = parseFloat(this.x);
				this.y = parseFloat(this.y);
				if (Number.isNaN(this.y) || Number.isNaN(this.x)){
					throw `\nNumber conversion:\nNumber | parseFloat(String)`
				}
			}catch (e){
				this.x = 0;
				this.y = 0;
				throw `Valid Vector Input:\n(obj) ==> V ( obj.x, obj.y )\n(obj, keys) ==> V ( obj[keys.x], obj[keys.y] )\n(array, offset*) ==> V ( array[0 + offset*], array[1 + offset*] )\n(num) ==> V (num, num)\n(x, y) ==> V (x, y)\n\nWhere V (Number, Number)\nnumbers as strings accepted`
			}
		}
	}

	round(){
		return new Vector(Math.round(this.x), Math.round(this.y))
	}



	add(p1 = 0, p2 = null){
		let v2;
		try{
			v2 = new Vector(p1, p2);
		}catch (e){
			throw `Error on add:\n\n${e}`
		}
		return new Vector(this.x + v2.x, this.y + v2.y)
	}
	sub(p1 = 0, p2 = null){
		let v2;
		try{
			v2 = new Vector(p1, p2);
		}catch (e){
			throw `Error on sub:\n\n${e}`
		}
		return new Vector(this.x - v2.x, this.y - v2.y)
	}

	mul(p1 = 0, p2 = null){
		let v2;
		try{
			v2 = new Vector(p1, p2);
		}catch (e){
			throw `Error on mul:\n\n${e}`
		}
		return new Vector(this.x * v2.x, this.y * v2.y)
	}

	div(p1 = 0, p2 = null){
		let v2;
		try{
			v2 = new Vector(p1, p2);
		}catch (e){
			v2 = new Vector(1, 1);
			throw `Error on div:\n\n${e}`
		}
		return new Vector(this.x / v2.x, this.y / v2.y)
	}

	addV(y){
		if (typeof y === 'number'){
			return this.add(0, y);
		}
	}
	addH(x){
		if (typeof x === 'number'){
			return this.add(x, 0);
		}
	}


	assign(){
		return new Vector(this.x, this.y)
	}

	grad(p1 = 0, p2 = null){
		let v2;
		try{
			v2 = new Vector(p1, p2);
		}catch (e){
			throw `Error on grad:\n\n${e}`
		}

		if (v2.x - this.x == 0){
			return 10000000000
		}
		return (v2.y - this.y)/(v2.x - this.x)
	}

  norm(){
    return Math.sqrt(this.y*this.y + this.x*this.x)
  }

  arg(){
    return this.atan(this.y, this.x)
  }

	distToLine(p1, p2){
		if (p1 instanceof Vector && p2 instanceof Vector){
			let line = p2.sub(p1).rotate(Math.PI/2)
			let d = line.dot(this.sub(p1))/line.norm()
			return Math.abs(d)
		}else{
			return null
		}
	}

	// (x + iy)*(cos(t) + isin(t)) = xcos(t) - ysin(t) + i(xsin(t) + ycos(t))
  rotate(theta){
    return new Vector(this.x*Math.cos(theta) - this.y*Math.sin(theta), this.x*Math.sin(theta) + this.y*Math.cos(theta))
  }

  angleBetween(p2){
    let a = this.norm()
    let b = p2.norm()
    let c = this.distance(p2)
    if (a == 0||b == 0||c==0){return 0}
    return Math.acos((c*c - a*a - b*b)/(-2*a*b))
  }

  atan(rise, run){
    if(run == 0 && rise == 0){
      // console.error('Undefined angle for atan(0/0)');
      return 0
    }
    let theta = Math.atan(Math.abs(rise)/Math.abs(run))
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

  dir(){
    if(this.norm() == 0){return new Vector(0,0)}
    return this.div(this.norm())
  }
  dot(p2){
    return this.x*p2.x + this.y*p2.y
  }
	dist(p2){
		return this.distance(p2)
	}
  distance(p2){
    return Math.sqrt((this.x - p2.x)*(this.x - p2.x) + (this.y - p2.y)*(this.y - p2.y))
  }

	getPointAtDiv(p1, d){
		if (p1 instanceof Vector){
			if (d >= 0 && d <= 1){
				return new Vector (this.x + (p1.x - this.x)*d, this.y + (p1.y - this.y)*d)
			}
		}
	}
	isZero(){
		return (this.x == 0 && this.y == 0)
	}
	toString(){
		return `${this.x},${this.y}`
	}
}
