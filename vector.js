class Vector{
	constructor(x = 0, y = 0){
    this.x = x;
    this.y = y;
    if(x instanceof Array){
      this.x = x[y]
      this.y = x[y + 1]
    }else if(x instanceof Vector || x instanceof Object){
      this.x = x.x
      this.y = x.y
    }
		this.x = parseFloat(this.x)
		this.y = parseFloat(this.y)
	}

	round(){
		return new Vector(Math.round(this.x), Math.round(this.y))
	}

	add(p1){
    if(p1 instanceof Vector){
      return new Vector(this.x + p1.x, this.y + p1.y)
    }else{
      return new Vector(this.x + p1, this.y + p1)
    }
	}
	sub(p1){
    if(p1 instanceof Vector){
      return new Vector(this.x - p1.x, this.y - p1.y)
    }else{
      return new Vector(this.x - p1, this.y - p1)
    }
	}
	div(p1){
    if(p1 instanceof Vector){
      return new Vector(this.x / p1.x, this.y / p1.y)
    }else{
      return new Vector(this.x / p1, this.y / p1)
    }
	}
  mul(p1){
    if(p1 instanceof Vector){
      return new Vector(this.x * p1.x, this.y * p1.y)
    }else{
      return new Vector(this.x * p1, this.y * p1)
    }
	}
	assign(){
		return new Vector(this.x, this.y)
	}

	//Redundant
  extend(val){
    return new Vector(this.x*val, this.y*val)
  }
	grad(v2){
		if (v2.x - this.x == 0){
			return Infinity
		}
		return (v2.y - this.y)/(v2.x - this.x)
	}
  setByAngle(Φ, r){
    if (typeof Φ === 'string' || Φ instanceof String){
      let type = Φ.replace(/\d*/, '')
      Φ = parseFloat(Φ.replace(type, ''))
      Φ = type == 'deg'?Φ*Math.PI/180:Φ
    }
    this.x = r*Math.cos(Φ)
    this.y = r*Math.sin(Φ)
  }

  norm(){
    return Math.sqrt(this.y*this.y + this.x*this.x)
  }

  arg(){
    return this.atan(this.y, this.x)
  }

  translatey(yaxis){
    let phi = yaxis.arg()
    let theta = this.arg()
    let psi = theta + Math.PI/2 - phi
    let translation = this.assign()
    return translation.rotate(psi)
  }

	distToLine(p1, p2){
		let line = p2.sub(p1).rotate(Math.PI/2)
	  let d = line.dot(this.sub(p1))/line.norm()
	  return Math.abs(d)
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
	toString(){
		return `${this.x},${this.y}`
	}
}
