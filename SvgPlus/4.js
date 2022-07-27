import {DPath, CPoint, Vector, LinkListMainMethods, DPathMainMethods, parseNumbers} from "./dpath.js"
const SVGTagNames = {
  animate: true,
  animateMotion: true,
  animateTransform: true,
  circle: true,
  clipPath: true,
  "color-profile": true,
  defs: true,
  desc: true,
  discard: true,
  ellipse: true,
  feBlend: true,
  feColorMatrix: true,
  feComponentTransfer: true,
  feComposite: true,
  feConvolveMatrix: true,
  feDiffuseLighting: true,
  feDisplacementMap: true,
  feDistantLight: true,
  feDropShadow: true,
  feFlood: true,
  feFuncA: true,
  feFuncB: true,
  feFuncG: true,
  feFuncR: true,
  feGaussianBlur: true,
  feImage: true,
  feMerge: true,
  feMergeNode: true,
  feMorphology: true,
  feOffset: true,
  fePointLight: true,
  feSpecularLighting: true,
  feSpotLight: true,
  feTile: true,
  feTurbulence: true,
  filter: true,
  foreignObject: true,
  g: true,
  hatch: true,
  hatchpath: true,
  image: true,
  line: true,
  linearGradient: true,
  marker: true,
  mask: true,
  mesh: true,
  meshgradient: true,
  meshpatch: true,
  meshrow: true,
  metadata: true,
  mpath: true,
  path: true,
  pattern: true,
  polygon: true,
  polyline: true,
  radialGradient: true,
  rect: true,
  script: true,
  set: true,
  solidcolor: true,
  stop: true,
  style: true,
  svg: true,
  switch: true,
  symbol: true,
  text: true,
  textPath: true,
  title: true,
  tspan: true,
  unknown: true,
  use: true,
  view: true,
};
function make(name){
  let element = null;
  if (name in SVGTagNames) {
    element = document.createElementNS("http://www.w3.org/2000/svg", name);
  } else if (typeof name === "string"){
    element = document.createElement(name);
  }
  return element;
}
let points = make("svg");

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
    return make(name);
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
    let p = points.createSVGPoint();
    p.x = v.x;
    p.y = v.y;
    return p;
  }
}

class SvgPath extends SvgPlus{
  constructor(el = 'path'){
    super(el);
    this.decimalPlaces = 3;

    let dpath = new DPath(this.getAttribute('d'));
    this._d = dpath;

    let me = this;
    for (let method of LinkListMainMethods.concat(DPathMainMethods)) {
      if (method in this) console.log(method + " is already a SVGPathElement method");
      this[method] = function () {
        let value = dpath[method].apply(dpath, arguments);
        me.dPathUpdated = true;
        return value;
      }
    }
    dpath.addCmdMethods(this);
  }

  set dPathUpdated(value) {
    if (value && !this.dPathUpdated) {
      this._dPathUpdated = true;
      window.requestAnimationFrame(() => {
        this.update();
        this._dPathUpdated = false;
      })
    }
  }
  get dPathUpdated(){
    return this._dPathUpdated;
  }

  update(decimalPlaces = this.decimalPlaces){
    this.setAttribute("d", this.d.toString(decimalPlaces))
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
  set d_string(val){
    if (typeof val === 'string'){
      this.d.d_string = val;
    }
  }
  get d_string(){
    return `${this.d}`
  }

  static normalise(el) {
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
      let ps = parseNumbers(get("points"));

      let m = "M";
      for (let i = 0; i < ps.lenght; i += 2) {
        let v = new Vector(ps[i], ps[i+1])
        path[m](v);
        m = "L";
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
}


export {SvgPlus, PlusError, SvgPath, CPoint, DPath, Vector}
