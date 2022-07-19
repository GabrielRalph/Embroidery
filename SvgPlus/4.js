class PlusError{
  constructor(message, class_name = "Object"){
    this.msg = message;
    this.cls = class_name;
    let stack = new Error('helloworld');
    this.stack = stack.stack
  }

  _parse_stack(){
    let stack = this.stack
    let lines = stack.split('at ');
    let message = '';
    let con = 0;
    let tab = "";
    for (var i = 2; i < lines.length-1; i++){
      let conf = false;

      let clas = null;
      let lctn = null;
      let mthd = null;

      let line = lines[i];
      line = lines[i].replace(/\t|\n|\[.*\] |  +/g, '').replace(/ \((.*)\)/g, (a,b) =>{
        b = b.split('/');
        b = b[b.length - 1];
        b = b.split(':')

        lctn = `${b[0]} line ${b[1]}`;
        return ''
      })
      let parts = line.split(/ |\./g);

      if (parts.length === 3 && parts[1] == "get" || parts[1] == "set"){
        mthd = `${parts[1]}ting ${parts[2]} of ${parts[0]}\t (${lctn})`
      }else if(parts.length == 2){
        mthd = `whilst calling ${parts[1]} of ${parts[0]}\t (${lctn})`
      }
      if (parts[0] === 'new'){
        con++;
        conf = true;
        mthd = `whilst constructing new ${parts[1]}\t (${lctn})`
        clas = parts[1];
      }else if(parts[0] === 'Object'){
        clas = this.cls;
      }else{
        clas = parts[0];
      }
      if ((conf && con == 1)||(!conf)){
        message = mthd + '\n' + tab + message;
      }
      tab += '\t'
      // stack_data.push(this._stack_line_parser(line))
    }
    return 'Error\n' + message + tab + this.msg
  }

  toString(){
    return this._parse_stack()
  }
}

// 2D vector class
let DecimalPlaces = 5;
class Vector{
	constructor(x = 0, y = null){
		try{
			let form_x = this.forMate(x);
			let form_y = this.forMate(y);

			if (form_x.type === 'number' && form_y.type === 'number'){
				this.x = form_x.val;
				this.y = form_y.val;

			}else if (form_x.type === 'number' && form_y.type === null){
				this.x = form_x.val;
				this.y = form_x.val;

			}else if(form_x.type === 'array'){
				try {
					let offset = form_y.type === 'number' ? form_y.val : 0;
					if (offset + 1 >= x.length){
						throw `\nparam1[${offset + 1}] is invalid, param1.length = ${x.length} but param2 = ${offset}`
					}else if (offset < 0){
						throw `\nparam2 must be a postive integer, but param2 = ${offset}`
					}
					this.x = parseFloat(x[offset]);
					this.y = parseFloat(x[1+offset]);


					if (Number.isNaN(this.x)){
						this.x = 0;
						throw `\nparam1[${offset}] is not a valid number (x = 0)`
					}

					if (Number.isNaN(this.y)){
						this.y = 0;
						throw `\nparam1[${offset + 1}] is not a valid number (y = 0)`
					}
				}catch(e){
					e = e.replace(/param1/g, 'Array').replace(/param2/g, 'Offset')
					this.x = 0;
					this.y = 0;
					throw `given: Vector(Array, Offset = 0)${e}`
				}
			}else if (form_y.type === "object" && (form_x.type === 'object' || form_x.type === 'vector')){
				if ('x' in y && 'y' in y){
					let msg = ""

					if (y.x in x){
						this.x = parseFloat(x[y.x]);

						if (Number.isNaN(this.x)){
							this.x = 0;
							throw `given: Vector(Object, Keys)\nObject[Keys.x] is not a valid number (x = 0)`
						}
					}else{
						msg += 'Keys.x is not a key in Object (x = 0)\n'
						this.x = 0;
					}

					if (y.y in x){
						this.y = parseFloat(x[y.y]);

						if (Number.isNaN(this.y)){
							this.y = 0;
							throw `given: Vector(Object, Keys)\nObject[Keys.y] is not a valid number (y = 0)`
						}
					}else{
						msg += 'Keys.y is not a key in Object (y = 0)\n'
						this.y = 0;
					}

					if (msg.length !== 0){
						throw `given: Vector(Object, Keys)\n${msg}`
					}

				}else{
					if (form_x.type === 'vector'){
						this.x = x.x;
						this.y = y.y;
					}else{
						throw `given: Vector(Object, Keys)\nKeys must contain\nx: 'x-key'\ny: 'y-key'`
					}
				}
			}else if (form_x.type === "vector"){
				this.x = x.x;
				this.y = x.y;
			}else if(form_x.type === "object"){
				this.x = parseFloat(x.x);
				this.y = parseFloat(x.y);

				if (Number.isNaN(this.x)){
					this.x = 0;
					throw `given: Vector(Object)\nObject.x is not a valid number (x = 0)`
				}

				if (Number.isNaN(this.y)){
					this.y = 0;
					throw `given: Vector(Object)\nObject.y is not a valid number (y = 0)`
				}
			}else{
				throw `Invalid input (${form_x.type}, ${form_y.type})`
				this.x = 0;
				this.y = 0;
			}
		}catch(e){
			this.x = 0;
			this.y = 0;
			console.error(`error creating vector\n\n${e}\n\nResult: V(${this})`);
		}

    this.decimalPlaces = DecimalPlaces;
	}

	forMate(val){
		let type = typeof val;
		let message = "";
		let error = false;
		let new_val = null
		try{
			if (val == null){
				return {type: null, message:"", val: null}
			}
			if (type == 'object'){
				if (val instanceof Array){
					type = 'array'
				}else if(val instanceof Vector){
					type = 'vector'
				}else{
					if ('x' in val && 'y' in val){

						let x = parseFloat(val.x)
						let y = parseFloat(val.y)

						type = 'vector'

						if (Number.isNaN(x)){
							type = 'object'
							message += "val.x is not a valid number\n"
						}else{
						}

						if (Number.isNaN(y)){
							type = 'object'
							message += "val.y is not a valid number\n"
						}else{
						}
					}else{
						type = "object"
					}
				}
			}else if(type == 'string'){
				let temp = parseFloat(val);
				if (!Number.isNaN(temp)){
					val = temp;
					type = 'number'
				}
			}else if(type == 'number' && !Number.isNaN(val)){
				type = 'number'
			}else{
				type = 'invalid'
			}
		}catch(e){
			throw `Error on forMate\n ${e}`
		}
		return {val: val, type: type, message: message}

	}

	round(x = 1){
		return new Vector(Math.round(this.x*Math.pow(10, x))/Math.pow(10, x), Math.round(this.y*Math.pow(10, x))/Math.pow(10, x))
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
	clone(){
		return this.assign();
	}

	assign(){
		return new Vector(this.x, this.y)
	}

	grad(p1 = 0, p2 = null){
		let v2;
		try{
			v2 = new Vector(p1, p2);
		}catch (e){
			v2 = new Vector(1, 1);
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
	reflect(direction){
		let newVector = this.clone();
		if (typeof direction !== "string") return newVector;
		direction = direction.toUpperCase();
		if ( direction.indexOf('V') !== -1 ){
			newVector = newVector.mul(new Vector(1, -1));
		}

	  	if( direction.indexOf('H') !== -1 ){
			newVector = newVector.mul(new Vector(-1, 1));
		}
		return newVector;
	}

	lurpTo(p1, d){
		if (p1 instanceof Vector){
			if (d >= 0 && d <= 1){
				return new Vector (this.x + (p1.x - this.x)*d, this.y + (p1.y - this.y)*d)
			}
		}
	}

	isZero(){
		return (Math.abs(this.x) < 1e-5 && Math.abs(this.y) < 1e-5)
	}

	toString(){
    let v = this.round(this.decimalPlaces);
    return `${v.x},${v.y}`
	}
}


class SvgPlus{
  constructor(el){
    el = SvgPlus.parseElement(el);
    let prototype = Object.getPrototypeOf(this);
    return SvgPlus.extend(el, prototype);
  }

  saveSvg(name = 'default'){
    let output = this.outerHTML;

    // Remove excess white space
    output = output.replace(/ ( +)/g, '').replace(/^(\n)/gm, '')
    output = output.replace(/></g, '>\n<')

    //Autoindent
    output = output.split('\n');
    var depth = 0;
    var newOutput = ''
    for (var i = 0; i < output.length; i++){
      depth += (output[i].search(/<\/(g|svg)>/) == -1)?0:-1;
      for (var j = 0; j < depth; j++){
        newOutput += '\t'
      }
      newOutput += output[i] + '\n';
      depth += (output[i].search(/<(g|svg)(\s|\S)*?>/) == -1)?0:1;
    }

    window.localStorage.setItem('output', newOutput)

    var blob = new Blob([newOutput], {type: "text/plain"});
    var url = null;

    if (url == null){
      url = window.URL.createObjectURL(blob);

      var a = document.createElement('a')
      a.setAttribute('href', url)
      a.setAttribute('download', name + '.svg')
      document.body.prepend(a);
      a.click()
      a.remove();
    }
  }

  watch(config, callback){
    this._mutationObserver = new MutationObserver((mutation, observer) => {
      if (!(callback instanceof Function)){
        if (this.onmutation instanceof Function){
          this.onmutation(mutation, observer);
        }else{
          return;
        }
      }else{
        callback(mutation, observer);
      }
    })

    this._mutationObserver.observe(this, config);
  }

  stopWatch(){
    if (this._mutationObserver instanceof MutationObserver){
      this._mutationObserver.disconnect();
    }
  }

  set styles(styles){
    if (typeof styles !== 'object'){
      throw `Error setting styles:\nstyles must be set using an object, not ${typeof styles}`
      return
    }
    this._style_set = typeof this._style_set != 'object' ? {} : this._style_set;
    for (var style in styles){
      var value = `${styles[style]}`
      if (value != null){
        let set = true;
        try{
          this.style.setProperty(style, value);
        }catch(e){
          set = false;
          throw e
        }
        if (set){
          this._style_set[style] = value;
        }
      }
    }
  }

  get styles(){
    return this._style_set;
  }

  set class(val){
    this.props = {class: val}
  }

  get class(){
    return this.getAttribute('class');
  }

  set props (props){
    if (typeof props !== 'object'){
      throw `Error setting styles:\nstyles must be set using an object, not ${typeof props}`
      return
    }
    this._prop_set = typeof this._prop_set != 'object' ? {} : this._prop_set;
    for (var prop in props){
      var value = props[prop]
      if (prop == 'style' || prop == 'styles'){
        this.styles = value
      }else if (prop == "innerHTML" || prop == "content") {
        this.innerHTML = value;
      }else if (value != null){
        let set = true;
        try{
          this.setAttribute(prop,value);
        }catch(e){
          set = false;
          throw e
        }
        if (set){
          this._prop_set[prop] = value;
        }
      }
    }
  }

  get props(){
    return this._prop_set;
  }

  createChild(){
    return this.makeChild.apply(this, arguments)
  }

  makeChild(){
    let Name = arguments[0];
    let child;

    if (Name instanceof Function && Name.prototype instanceof SvgPlus){
      if (arguments.length > 1){
        child = new Name(arguments[1]);
      }else{
        child = new Name();
      }
    }else{
      child = new SvgPlus(Name);
      try{
        if (arguments[1]){
          child.props = arguments[1];
        }
      }catch(e){
        console.error(e);
      }
    }

    this.appendChild(child);
    return child;
  }

  /**
    Wave transistion

    @param update update(progress) function to be called on each animation frame
      update function will be passed a number from 0 to 1 which will be the
      ellapsed time mapped to a wave.

    @param dir
      true:  0 -> 1,
      false: 1 -> 0

    @param duration in milliseconds


  */
  async waveTransistion(update, duration = 500, dir = false){
    if (!(update instanceof Function)) return 0;

    duration = parseInt(duration);
    if (Number.isNaN(duration)) return 0;

    return new Promise((resolve, reject) => {
      let t0;
      let end = false;

      let next = (t) => {
        let dt = t - t0;

        if (dt > duration) {
          end = true;
          dt = duration;
        }

        let theta = Math.PI * ( dt / duration  +  (dir ? 1 : 0) );
        let progress =  ( Math.cos(theta) + 1 ) / 2;

        let stop = update(progress);

        if (!end && !stop){
          window.requestAnimationFrame(next);
        }else{
          resolve(progress);
        }
      };
      window.requestAnimationFrame((t) => {
        t0 = t;
        window.requestAnimationFrame(next);
      })
    })
  }

  async animateAlgorithm(algorithm){

    if (!(algorithm.begin instanceof Function || aglorthim.start instanceof Function)) throw '' + new PlusError(`Aglorithm's must contain a begin/start function`);
    if (!(algorithm.next instanceof Function || aglorthim.draw instanceof Function)) throw '' + new PlusError(`Aglorithm's must contain a next/draw function`);
    if (!(algorithm.end instanceof Function)) throw '' + new PlusError(`Aglorithm's must contain a end function`);

    let start, next;
    let end = algorithm.end;

    if (aglorthim.begin instanceof Function){
      start = algorithm.begin;
    }else{
      start = algorithm.start;
    }

    if (algorithm.next instanceof Function){
      next = algorithm.next
    }else{
      next = algorithm.draw;
    }

    return new Promise((resolve, reject) => {

      start();
      let i = 0;
      let nextFrame = (t) => {
        if (next(t, i) === true){
          window.requestAnimationFrame(nextFrame);
        }else{
          resolve(end());
        }
        i++;
      }
      window.requestAnimationFrame(nextFrame);
    });
  }

  static make(name){
    if (` animate animateMotion animateTransform circle clipPath
      color-profile defs desc discard ellipse feBlend feColorMatrix
      feComponentTransfer feComposite feConvolveMatrix feDiffuseLighting
      feDisplacementMap feDistantLight feDropShadow feFlood feFuncA
      feFuncB feFuncG feFuncR feGaussianBlur feImage feMerge feMergeNode
      feMorphology feOffset fePointLight feSpecularLighting feSpotLight
      feTile feTurbulence filter foreignObject g hatch hatchpath image
      line linearGradient marker mask mesh meshgradient meshpatch meshrow
      metadata mpath path pattern polygon polyline radialGradient rect
      script set solidcolor stop style svg switch symbol text textPath
      title tspan unknown use view `.indexOf(` ${name} `) != -1){
      return document.createElementNS("http://www.w3.org/2000/svg", name);

    }else{
      return document.createElement(name);
    }
  }

  static parseElement(elem = null) {
    if (elem == null){
      throw `${new PlusError('null element given to parser')}`
    }
    if (typeof elem === 'string'){
      let _elem = null;
      if((/<.*?><.*?>/g).test(elem)){
        try{
          _elem = SvgPlus.parseSVGString(elem)
        }catch(e){
          throw e
        }
      }else{
        _elem = document.getElementById(elem);
      }

      if (_elem == null){
        _elem = SvgPlus.make(elem);
      }


      if (_elem == null){
        throw `${new PlusError(`Could not parse ${elem}.`)}`
        return null
      }else{
        try {
          _elem = this.parseElement(_elem);
        }catch(e){
          throw e
          return null
        }
        return _elem
      }
    }else if (elem instanceof Element){
      return elem
    }else{
      throw 'invalid element'
      return null
    }
  }

  static parseSVGString(string){
    let parser = new DOMParser()
    let doc = parser.parseFromString(string, "image/svg+xml");
    let errors = doc.getElementsByTagName('parsererror');
    if (errors && errors.length > 0){
      throw '' + new PlusError(`${errors[0]}`)
      return null
    }
    return doc.firstChild
  }

  static extend(elem, proto){
    if (proto != Object.prototype){
      let _proto = Object.getPrototypeOf(proto);
      elem = SvgPlus.extend(elem, _proto);
    }else{
      return elem
    }
    let keys = [];
    if (!SvgPlus.is(elem, proto.constructor)){
      keys = Object.getOwnPropertyNames(proto);
    }else {
      console.log("re extend");
    }
    let build = false
    for (let key of keys) {
      var prop = Object.getOwnPropertyDescriptor(proto, key);
      if (key != 'constructor'){
        if (key == 'build'){
          Object.defineProperty(elem, 'plus_constructor', prop);
          build = true;
        }else{
          if (key in elem){
            try {
              elem[key] = proto[key];
            }catch (e){
              throw '' + new PlusError(`The class property ${key} was unable to be set\n${e}`);
            }
          }else{
            Object.defineProperty(elem, key, prop);
          }
        }
      }else{
        if ('__+' in elem){
          if (Array.isArray(elem['__+'])){
            elem['__+'].push(proto.constructor)
          }
        }else{
          elem['__+'] = [proto.constructor]
        }
      }
    }
    if(build){ elem.plus_constructor()}
    return elem;
  }

  static is(element, classDef){
    if (element instanceof Element){
      if ('__+' in element && Array.isArray(element['__+'])){
        for (var instance of element['__+']){
          if (instance === classDef){
            return true;
          }
        }
      }

    }
    return false;
  }

  static defineHTMLElement(classDef){
    let className = classDef.name.replace(/(\w)([A-Z][^A-Z])/g, "$1-$2").toLowerCase();
    let props = Object.getOwnPropertyDescriptors(classDef.prototype);

    let setters = classDef.setters;
    // for (let propName in props) {
    //   let prop = props[propName]
    //   if ("set" in prop && prop.set instanceof Function) {
    //     setters.push(propName);
    //   }
    // }

    let htmlClass = class extends HTMLElement{
      constructor(){
        super();
        new classDef(this);
      }
      connectedCallback(){
        if (this.onconnect instanceof Function) {
          if (this.isConnected) {
            this.onconnect();
          }
        }
      }
      disconnectedCallback(){
        if (this.ondisconnect instanceof Function) {
          this.ondisconnect();
        }
      }

      adoptedCallback(){
        if (this.onadopt instanceof Function) {
          this.onadopt();
        }
      }

      attributeChangedCallback(name, oldv, newv){
        this[name] = newv;
      }

      static get observedAttributes() { return setters; }
    }
    console.log(className+ " custom element defined");
    customElements.define(className, htmlClass);
  }
}

class LinkItem{
  constructor(){
    this._last = null;
    this._next = null;
    this._parent = null;
  }

  set parent(parent){
    this._parent = parent;
  }

  get parent(){
    if (this._parent instanceof LinkList){
      return this._parent;
    }else{
      return null;
    }
  }

  update(){
    // if (this.parent != null){
    //   this.parent.update();
    // }
  }

  set next(next){
    if (next instanceof LinkItem){
      this._next = next;
    }else{
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

class LinkList{
  constructor(){
    this._start = null;
    this._end = null;
    this._length = 0;
    this._onupdate = [];
  }

  get length(){
    return this._length;
  }

  get isEmpty(){return this._length == 0}

  set start(start){
    if (start instanceof LinkItem){
      this._start = start;
    }else{
      this._start = null;
    }
  }

  get start(){
    return this._start;
  }

  set end(end){
    if (end instanceof LinkItem){
      this._end = end;
    }else{
      this._end = null;
    }
  }

  get end(){
    return this._end;
  }

  addUpdateListener(callback){
    if (callback instanceof Function){
      this._onupdate.push(callback)
    }else{
      throw 'addUpdateListener expects a Function as its only parameter'
    }
  }

  update(){
    for(var callback of this._onupdate){
      callback()
    }
  }

  // Pushes LinkItem or LinkList at the end of this list
  push(item){
    if (item instanceof LinkItem){
      if ( this.contains(item) ){
        throw 'The given item is already contained within this list'
        return
      }

      item.clear();
      item.parent = this;

      //if the node was unset <start> => item <= <end>
      if (this.end == null || this.start == null){
        this.start = item; // <start> => item
        this.end = item;   // <end> => end



        //Otherwise end refers to <end> <=> <item>
        //                        <end> => <item>
      }else{
        this.end.link(item);
        this.end = item;
      }

      this._length ++;
    }else if(item instanceof LinkList){
      for (var subItem of item){
        this.push(item);
      }
    }
    this.update();
  }



  // Pop linked item from the end of the list
  pop(){
    if (this.end == null || this.start == null){
      return null
    }else if (this.end == this.start){
      this._length = 0;
      let temp = this.end;
      this.end = null;
      this.start = null;
      temp.parent = null;
      return temp;
    }else{
      this._length --;
      let oldl = this.end;
      let newl = this.end.last
      oldl.break();
      this.end = newl;
      oldl.parent = null;
      return oldl
    }
    this.update();
  }

  // Dequeue linked item from the start of the list
  dequeue(){
    if (this.end == null || this.start == null){
      return null
    }else if (this.end == this.start){
      this._length = 0;

      let temp = this.start;
      this.end = null;
      this.start = null;
      temp.parent = null;
      return temp;
    }else{
      this._length --;

      let oldl = this.start;
      let newl = this.start.next;
      oldl.break();
      this.start = newl;
      oldl.parent = null;
      return oldl
    }
    this.update()
  }

  // Puts LinkList or LinkItem at start of this list
  queue(item){
    if (item instanceof LinkItem){
      if ( this.contains(item) ){
        throw 'The given item is already contained within this list'
        return
      }

      item.clear();
      item.parent = this;

      //not set:  <start> => item <= <end>
      if (this.end == null || this.start == null){
        this.start = item;
        this.end = item;

        // else: <item> <=> <start> | <start> => <item>
      }else{
        item.link(this.start);
        this.start = item;
      }

      this._length ++;

    }else if(item instanceof LinkList){
      for (var subItem of item){
        this.queue(subItem);
      }
    }
    this.update();
  }

  *[Symbol.iterator]() {
    let start = this.start;
    while (start) {
      yield start;
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

  contains(val){
    if (val instanceof LinkItem){
      return val.parent !== null;
    }
    return false;
  }

  clear(){
    this._end = null;
    this._start = null;
    this._length = 0;
    this.update();
  }

  insertAfter(node, before) {
    if (before == this.end) this.push(node);

    node.next = before.next;
    before.next = node;
    node.last = before;
  }
}

class CPoint extends LinkItem{
  constructor(string){
    super();
    this.DPath = null;
    this.precision = 5;
    this.cmd_type = 'L';
    //p => x, y
    this._p = new Vector(0, 0);
    //c1 => x1, y1
    this._c1 = new Vector(0, 0);
    //c2 => x2, y2
    this._c2 = new Vector(0, 0);

    //r => rx, ry
    this._r = new Vector(0, 0);
    this._x_axis_rotation = 0;
    this._large_arc_flag = 0;
    this._sweep_flag = 0;

    this.cmd = string
    // console.log(this.cmd_type, );
  }

  toggleAbsolute(){
    if (this.isAbsolute()){
      this.p = this.relative;
      this.c1 = this.c1.sub(this.lastAbsolute);
      this.c2 = this.c2.sub(this.lastAbsolute);
      this.cmd_type = this.cmd_type.toLowerCase();
    }else{
      this.p = this.absolute;
      this.c1 = this.lastAbsolute.add(this.c1);
      this.c2 = this.lastAbsolute.add(this.c2);
      this.cmd_type = this.cmd_type.toUpperCase();
    }
  }

  clone(){
    return new CPoint(`${this}`);
  }


  get cmd_types(){
    return "MmLlHhVvCcSsQqTtAaZz";
  }
  set cmd_type(type){
    if (typeof type === 'string' && type.length == 1 && this.cmd_types.indexOf(type) !== -1){
      this._cmd_type = type;
      this.update();
    }else{
      this._cmd_type = null;
    }
  }

  get cmd_type(){
    return this._cmd_type;
  }

  get p(){
    return this._p.clone();
  }

  set p(v){
    if (v instanceof Vector){
      this._p = v;
      this.update();
    }
  }

  get c1(){
    return this._c1.clone();
  }

  set c1(v){
    if (v instanceof Vector){
      this._c1 = v;
      this.update();
    }
  }

  get c2(){
    return this._c2.clone();
  }

  set c2(v){
    if (v instanceof Vector){
      this._c2 = v;
      this.update();
    }
  }

  get r(){
    return this._r.clone();
  }

  set r(v){
    if (v instanceof Vector){
      this._r = v;
      this.update();
    }
  }

  get x_axis_rotation(){
    return this._x_axis_rotation;
  }

  set x_axis_rotation(bool){
    if (bool){
      this._x_axis_rotation = 1;
    }else{
      this._x_axis_rotation = 0;
    }
    this.update();
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
    this.update();
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
    this.update();
  }


  get lastAbsolute(){
    if (this.last instanceof CPoint){
      return this.last.absolute
    }else{
      return new Vector(0);
    }
  }

  get lastRelative(){
    if (this.last instanceof CPoint){
      return this.last.relative
    }else{
      return new Vector(0)
    }
  }


  get absolute(){
    if (this.isAbsolute()){
      return this.p;
    }else{
      return this.lastAbsolute.add(this.p)
    }
  }

  get relative(){
    if (this.isAbsolute()){
      return this.p.sub(this.lastAbsolute)
    }else{
      return this.p;
    }
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
  set cmd(string){
    if (string == null){
      return
    }
    if (typeof string != 'string'){
      this.cmd_type = null;
      throw `Error setting cmd:\ncmd must be set a string, not ${typeof string}`
    }
    if (string.length < 1) return

    //Get command type
    let type = string[0];

    this.cmd_type = type;
    if (this.cmd_type == null){
      throw `Error setting cmd:\n${type} is not a valid type`
    }

    //If z, then set cmd_type and return
    if (type == 'z'|| type == 'Z'){
      return
    }

    //Get numbers
    let param_string = string.slice(1);
    let param_floats = [];
    try{
      param_string.replace(/(-?\d*\.?\d+)/g, (num) => {
        param_floats.push(parseFloat(num))
      })
    }catch (err){
      throw `Error setting cmd:\nError parsing params\n${err}`
    }

    //Check if input is valid according to command type
    let error = (num, form) => {return `Error setting cmd:\n${string} is of command type: ${type} which requires ${num} number parameters ${form} but ${param_floats.length} where given ${param_floats}`}
    if (('M|m||L|l||T|t').indexOf(type) != -1){
      if (param_floats.length != 2){
        throw error(2, 'x, y');
      }
      this.p = new Vector(param_floats);
    }else if(type == 'C' || type == 'c'){
      if (param_floats.length != 6){
        throw error(6, '(x1, y1, x2, y2, x, y)')
      }
      this.c1 = new Vector(param_floats)
      this.c2 = new Vector(param_floats, 2)
      this.p = new Vector(param_floats, 4)
    }else if(type == 'H' || type == 'h'){
      if (param_floats.length != 1){
        throw error(1, '(x)')
      }
      this.x = param_floats[0]
    }else if(type == 'V' || type == 'v'){
      if (param_floats.length != 1){
        throw error(1, '(y)')
      }
      this.y = param_floats[0]
    }else if(type == 'S' || type == 's'){
      if (param_floats.length != 4){
        throw error(4, '(x2, y2, x, y)')
      }
      this.c2 = new Vector(param_floats)
      this.p = new Vector(param_floats, 2)
    }else if(type == 'Q' || type == 'q'){
      if (param_floats.length != 4){
        throw error(4, '(x1, y1, x, y)')
      }
      this.c1 = new Vector(param_floats)
      this.p = new Vector(param_floats, 2)
    }else if(type == 'A' || type == 'a'){
      if (param_floats.length != 7){
        throw error(7, '(rx, ry, x-axis-rotation, large-arc-flag, sweep-flag, x, y)')
      }
      this.r = new Vector(param_floats);
      this.x_axis_rotation = param_floats[2];
      this.large_arc_flag = param_floats[3];
      this.sweep_flag = param_floats[4];
      this.p = new Vector(param_floats, 5)
    }

    //If inputs where valid set cmd_type
    this.cmd_type = type;
  }

  //Return String svg-path-command
  get cmd(){
    return this.toString()
  }

  get x(){
    return this.p.x;
  }
  set x(val){
    val = parseFloat(val);
    if (Number.isNaN(val)) return;

    this._p.x = val;
    this.update();
  }
  get y(){
    return this.p.y;
  }
  set y(val){
    val = parseFloat(val);
    if (Number.isNaN(val)) return;

    this._p.y = val;
    this.update();
  }

  _v_s(val){
    return `${this[val].x.toPrecision(this.precision)}${this[val].y>=0?',':''}${this[val].y.toPrecision(this.precision)}`
  }

  isAbsolute(){
    return (this.cmd_type && (this.cmd_type == this.cmd_type.toUpperCase()))
  }

  add(v){
    this.p = this.p.add(v);
    this.c1 = this.c1.add(v);
    this.c2 = this.c2.add(v);
    this.update();
  }
  sub(v){
    this.p = this.p.sub(v);
    this.c1 = this.c1.sub(v);
    this.c2 = this.c2.sub(v);
    this.update();
  }
  div(v){
    this.p = this.p.div(v);
    this.c1 = this.c1.div(v);
    this.c2 = this.c2.div(v);
    this.update();
  }
  mul(v){
    this.p = this.p.mul(v);
    this.c1 = this.c1.mul(v);
    this.c2 = this.c2.mul(v);
    this.update();
  }

  grad(v){
    return this.p.grad(v);
  }

  dist(v){
    return this.p.dist(v);
  }

  distToLine(v){
    return this.p.dist(v);
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
}

class DPath extends LinkList{
  constructor(string = null){
    super();
    if (string != null && typeof string !== 'undefined' && string.length != 0){
      this.d_string = string;
    }
  }

  //Path push functions
    L(v){
      if (v instanceof Vector){
        this.push(new CPoint(`L${v.round(5)}`))
        return this
      }else{
        throw 'Error:\nL takes a single vector parameter';
      }
    }
    l(v){
      if (v instanceof Vector){
        this.push(new CPoint(`l${v.round(5)}`))
        return this
      }else{
        throw 'Error:\nl takes a single vector parameter';
      }
    }

    M(v){
      if (v instanceof Vector){
        this.push(new CPoint(`M${v.round(5)}`))
        return this
      }else{
        throw 'Error:\nM takes a single vector parameter';
      }
    }

    Q(v1, v2){
      if (v1 instanceof Vector && v2 instanceof Vector){
        this.push(new CPoint(`Q${v1.round(5)},${v2.round(5)}`))
        return this
      }else{
        throw 'Error:\nQ takes two vectors as its parameters';
      }
    }
    q(v1, v2){
      if (v1 instanceof Vector && v2 instanceof Vector){
        this.push(new CPoint(`q${v1.round(5)},${v2.round(5)}`))
        return this
      }else{
        throw 'Error:\nq takes two vectors as its parameters';
      }
    }

    S(v1, v2){
      if (v1 instanceof Vector && v2 instanceof Vector){
        this.push(new CPoint(`S${v1.round(5)},${v2.round(5)}`))
        return this
      }else{
        throw 'Error:\nS takes two vectors as its parameters';
      }
    }
    s(v1, v2){
      if (v1 instanceof Vector && v2 instanceof Vector){
        this.push(new CPoint(`s${v1.round(5)},${v2.round(5)}`))
        return this
      }else{
        throw 'Error:\ns takes two vectors as its parameters';
      }
    }

    T(v1){
      if (v1 instanceof Vector){
        this.push(new CPoint(`T${v1.round(5)}`))
        return this
      }else{
        throw 'Error:\nT takes one vectors as its parameters';
      }
    }
    t(v1){
      if (v1 instanceof Vector){
        this.push(new CPoint(`t${v1.round(5)}`))
        return this
      }else{
        throw 'Error:\nt takes one vectors as its parameters';
      }
    }

    __boolHelp(val){
      if (typeof val === 'number'){
        return val > 0 ? 1 : 0;
      }else if (typeof val === 'boolean'){
        return val ? 1 : 0;
      }else {
        return null
      }
    }

    A(r, xar, laf, sf, v1){
      xar = this.__boolHelp(xar);
      laf = this.__boolHelp(laf);
      sf = this.__boolHelp(sf);
      if (r instanceof Vector && v1 instanceof Vector && xar != null && laf != null && sf != null){
        this.push(new CPoint(`A${r.round(5)},${xar},${laf},${sf},${v1.round(5)}`))
        return this
      }else{
        throw 'Error:\nA takes the parameters:\nr: Vector\nx-axis-rotation: Boolean (1,0)/(true,false)\nlarge-arc-flag: Boolean\nsweep-flag: Boolean\nv: Vector';
      }
    }
    a(r, xar, laf, sf, v1){
      xar = this.__boolHelp(xar);
      laf = this.__boolHelp(laf);
      sf = this.__boolHelp(sf);
      if (r instanceof Vector && v1 instanceof Vector && xar != null && laf != null && sf != null){
        this.push(new CPoint(`a${r.round(5)},${xar},${laf},${sf},${v1.round(5)}`))
        return this
      }else{
        throw 'Error:\na takes the parameters:\nr: Vector\nx-axis-rotation: Boolean (1,0)/(true,false)\nlarge-arc-flag: Boolean\nsweep-flag: Boolean\nv: Vector';
      }
    }

    C(v1, v2, v3){
      if (v1 instanceof Vector && v2 instanceof Vector && v3 instanceof Vector){
        this.push(new CPoint(`C${v1.round(5)},${v2.round(5)},${v3.round(5)}`))
        return this
      }else{
        throw 'Error:\nC takes three vectors as its parameters';
      }
    }
    c(v1, v2, v3){
      if (v1 instanceof Vector && v2 instanceof Vector && v3 instanceof Vector){
        this.push(new CPoint(`c${v1.round(5)},${v2.round(5)},${v3.round(5)}`))
        return this
      }else{
        throw 'Error:\nc takes three vectors as its parameters';;
      }
    }

    Z(){
      this.push(new CPoint(`Z`))
      return this
    }

  set d_string(string){
    if (typeof string !== 'string'){
      throw `Error setting d:\nd must be set to a string, not ${typeof string}`
      return
    }
    //Remove white space
    let cmds = string.replace(/( |\n|\t|\r)/g, '');

    //Add split markers
    cmds = cmds.replace(/(M|m|L|l|H|h|V|v|Z|z|C|c|S|s|Q|q|T|t|A|a)/g, '\n$&');
    cmds = cmds.slice(1);
    //Split
    cmds = cmds.split('\n');

    for (var cmd of cmds){
      let error = false;
      let cpoint = null;
      try{
        cpoint = new CPoint(cmd);
      }catch(e){
        console.log(e);
        error = true;
      }
      if (!error) this.push(cpoint);
    }
  }


  makeAbsolute(){
    if (this.isEmpty) return;

    let last = this.start.p;
    for (var point of this){
      if (point.cmd_type == 'V'){
        point.x = last.x;
      }
      if (point.cmd_type == 'H'){
        point.y = last.y;
      }
      if (point.isAbsolute()){
        last = point.p;
      }else{
        point.add(last);
        point.cmd_type = point.cmd_type.toUpperCase();
        last = point.p;
      }
    }
    this.update();
  }

  makeRelative(){
    this.makeAbsolute();
    let cur = this.end;
    while (cur != this.start){
      cur.sub(cur.last.p);
      cur.cmd_type = cur.cmd_type.toLowerCase();
      cur = cur.last;
    }
    this.update();
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

class SvgPath extends SvgPlus{
  constructor(el = null){
    if (el === null) el = 'path';
    super(el);

    this._d = new DPath(this.getAttribute('d'));

    this._d.addUpdateListener(() => {
      this.setAttribute('d', this.d_string);
    })

    this.watch({attributes: true})
  }

  set stroke(stroke){
    this.styles = {
      stroke: stroke
    }
  }

  set fill(fill){
    this.styles = {
      fill: fill
    }
  }

  set strokeWidth(width){
    this.styles = {
      'stroke-width': width
    }
  }


  get d(){
    return this._d;
  }

  onmutation(mutation){
    let d = this.getAttribute('d');
    if (this.d_string !== d){
      this.d_string = d;
    }
  }


  set d_string(val){
    if (typeof val === 'string'){
      this.d.d_string = val;
    }
  }

  get d_string(){
    return `${this.d}`
  }

  static parse_CPoint(){
    let args = arguments[0]

    if (args[0] instanceof CPoint){
      return args[0];
    }
    if (args[0] instanceof DPath){
      return args[0];
    }

    let cmd = ''

    for (var i = 0; i < args.length; i++){
      if (typeof args[i] == 'string' || args[i] instanceof Vector || typeof args[i] === 'number'){
        cmd += (i > 0 && (args[i-1] instanceof Vector || typeof args[i-1] === 'number') )?',':'';
        cmd += `${args[i]}`;
      }
    }

    if (('MmLlHhVvCcSsQqTtAaZz').indexOf(cmd[0]) == -1){
      if (args.length == 1){
        if (args[0] instanceof Vector){
          cmd = 'L' + cmd;
        }else{
          cmd = 'H' + cmd;
        }
      }else if(args.length == 2){
        cmd = 'S' + cmd;
      }else if(args.length == 3){
        cmd = 'C' + cmd;
      }else if(args.length == 5){
        cmd = 'A' + cmd;
      }else if(args.length == 0){
        cmd = 'Z';
      }
    }

    return new CPoint(cmd);
  }

  getVectorAtLength(l){
    return new Vector(this.getPointAtLength(l));
  }

//Path push functions
  L(v){
    this.d.L(v)
    return this;
  }
  l(v){
    this.d.l(v)
    return this
  }

  M(v){
    this.d.M(v)
    return this
  }

  Q(v1, v2){
    this.d.Q(v1, v2)
    return this
  }
  q(v1, v2){
    this.d.q(v1, v2)
    return this
  }

  S(v1, v2){
    this.d.S(v1, v2)
    return this
  }
  s(v1, v2){
    this.d.s(v1, v2)
    return this
  }

  T(v1, v2){
    this.d.T(v1, v2)
    return this
  }
  t(v1, v2){
    this.d.t(v1, v2);
    return this
  }

  A(r, xar, laf, sf, v1){
    this.d.A(r, xar, laf, sf, v1)
    return this
  }
  a(r, xar, laf, sf, v1){
    this.d.a(r, xar, laf, sf, v1)
    return this
  }


  C(v1, v2, v3){
    this.d.C(v1, v2, v3)
    return this
  }
  c(v1, v2, v3){
    this.d.c(v1, v2, v3)
    return this
  }

  Z(){
    this.d.Z()
    return this
  }

  push(val){
    this.d.push(val);
    return this
  }
  queue(val){
    this.d.queue(val);
    return this
  }
  pop(){
    return this.d.pop();
  }
  dequeue(){
    return this.d.dequeue();
  }
  clear(){
    this.d.clear();
  }

  makeAbsolute(){
    this.d.makeAbsolute();
  }

  makeRelative(){
    this.d.makeRelative();
  }

  closest(point){
    let d = Infinity;
    let p = null;
    this.d.forEach((cPoint) => {
      if ( cPoint.dist(point) < d ){
        d = cPoint.dist(point);
        p = cPoint;
      }
    });
    return p;
  }
}


export {SvgPlus, PlusError, SvgPath, LinkItem, LinkList, CPoint, DPath, Vector}
