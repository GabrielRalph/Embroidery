class SvgElement{
  constructor(el){
    this.el = el;
    this.el.svgPlus = this;
    this.__add_svgPlus_to_children(this.el);
  }

  get children(){
    let children = []
    for (var i = 0; i < this.el.children.length; i++){
      if (this.el.children[i].svgPlus){
        children.push(this.el.children[i].svgPlus)
      }
    }
    return children;
  }
  get parent(){
    if (this.el.parentNode.svgPlus){
      return this.el.parentNode.svgPlus
    }else{
      throw 'The parent of this node is not a SvgPlus'
      return null;
    }
  }

  appendChild(child){
    try{
      if (child instanceof SvgElement){
        this.el.appendChild(child.el)
      }else{
        this.el.appendChild(child)
      }
    }catch(e){
      throw `Error appending child:\n${err}`
    }
  }
  removeChild(child){
    try{
      if (child instanceof SvgElement){
        this.el.removeChild(child.el)
      }else{
        this.el.removeChild(child)
      }
    }catch(e){
      throw `Error removing child:\n${err}`
    }
  }

  getAttribute(name){
    return this.el.getAttribute(name)
  }
  setAttribute(name,value){
    this.el.setAttribute(name,value)
  }

  setProperty(name, value){
    this.el.style.setProperty(name, value)
  }
  getProperty(name){
    this.el.style.getProperty(name)
  }

  set styles(styles){
    if (typeof styles !== 'object'){
      throw `Error setting styles:\nstyles must be set using an object, not ${typeof styles}`
      return
    }
    for (style in styles){
      value = `${styles[style]}`
      if (value != null){
        this.setProperty(style, value)
      }
    }
  }
  set props (props){
    if (typeof props !== 'object'){
      throw `Error setting styles:\nstyles must be set using an object, not ${typeof props}`
      return
    }
    for (prop in props){
      value = props[prop]
      if (prop == 'style'){
        this.styles = value
      }
      if (value != null){
        this.setAttribute(prop,value);
      }
    }
  }
  createChild(name, props = null){
    let child = SVGPlus.create(name, props);
    this.appendChild(child);
    return child;
  }
  setStroke(color, width){
    if (typeof color === 'string'){
      this.setAttribute('stroke',color)
    }else{
      throw `Error calling setStroke:\nThe color property must be a string, not ${typeof color}`
    }
    if(typeof width === 'string' || typeof width === 'number'){
      this.setAttribute('stroke-width', width)
    }else{
      throw `Error calling setStroke:\nThe width property must be a string or number, not ${typeof color}`
    }
  }
  setFill(color){
    if (typeof color === 'string'){
      this.setAttribute('stroke',color)
    }
  }

  __add_svgPlus_to_children(el){
    for (var i = 0; i < el.children.length; i++){
      let child = el.children[i]
      if(!child.svgPlus){
        let plusel = SVGPlus.createSvgPlusElement(child)
        if (child.children.length > 0){
          this.__add_svgPlus_to_children(child)
        }
      }
    }
  }
}

class SvgSvgElement extends SvgElement{
  constructor(el){
    super(el)

  }


}

class SvgGeometry extends SvgElement{
  constructor(el){
    super(el);
  }


  get length(){
    return this.getTotalLength();
  }

  getTotalLength(){
    return this.el.getTotalLength();
  }

  getPointAtLength(length){
    return new Vector(this.el.getPointAtLength(length))
  }
}

class SvgPath extends SvgGeometry{
  constructor(el){
    super(el)
    this.d = new SvgPathD(this.getAttribute('d'));
  }

  set d_string(val){
    if (typeof val === 'string'){
      this.d.d_string = val;
    }
  }
  get d_string(){
    return `${this.d}`
  }

  animate(){

  }

}

class SvgCPoint {
  constructor(string){
    this.cmd_type = '';
    //p => x, y
    this.p = new Vector(0, 0);
    //c1 => x1, y1
    this.c1 = new Vector(0, 0);
    //c2 => x2, y2
    this.c2 = new Vector(0, 0);

    //r => rx, ry
    this.r = new Vector(0, 0);
    this.x_axis_rotation = 0;
    this.large_arc_flag = 0;
    this.sweep_flag = 0;

    this.cmd = string
  }

  //Set Svg Command Point
  //  svg-path-command: String
  //    String Format:
//                    'M x, y' or 'm dx, dy'
//                    'L x, y' or 'l dx, dy'
//                    'H x' or 'h dx'
//                    'V y' or 'v dy'
//                    'C x1, y1, x2, y2, x, y' or 'c dx1, dy1, dx2, dy2, dx, dy'
//                    'Q x1, y1, x, y' or 'q dx1 dy1, dx dy'
//                    'T x, y' or 't dx, dy'
//                    'A rx ry x-axis-rotation large-arc-flag sweep-flag x y' or 'a rx ry x-axis-rotation large-arc-flag sweep-flag dx dy'
  set cmd(string){
    if (typeof string != 'string'){
      this.cmd_type = null;
      throw `Error setting cmd:\ncmd must be set a string, not ${typeof string}`
      return
    }

    //Get command type
    let type = string[0];


    //If z, then set cmd_type and return
    if (type == 'z'|| type == 'Z'){
      this.cmd_type = type;
      return
    }
    if (('MmLlHhVvCcSsQqTtAa').indexOf(type) == -1){
      this.cmd_type = null;
      throw `Error setting cmd:\n${type} is not a valid type`
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
      return
    }

    //Check if input is valid according to command type
    let error = (num, form) => {return `Error setting cmd:\n${string} is of command type: ${type} which requires ${num} number parameters ${form} but ${param_floats.length} where given ${param_floats}`}
    if (('M|m||L|l||T|t').indexOf(type) != -1){
      if (param_floats.length != 2){
        throw error(2, 'x, y');
        return
      }
      this.p = new Vector(param_floats);
    }else if(type == 'C' || type == 'c'){
      if (param_floats.length != 6){
        throw error(6, '(x1, y1, x2, y2, x, y)')
        return
      }
      this.c1 = new Vector(param_floats)
      this.c2 = new Vector(param_floats, 2)
      this.p = new Vector(param_floats, 4)
    }else if(type == 'H' || type == 'h'){
      if (param_floats.length != 1){
        throw error(1, '(x)')
        return
      }
      this.x = param_floats[0]
    }else if(type == 'V' || type == 'v'){
      if (param_floats.length != 1){
        throw error(1, '(y)')
        return
      }
      this.y = param_floats[0]
    }else if(type == 'S' || type == 's'){
      if (param_floats.length != 4){
        throw error(4, '(x2, y2, x, y)')
        return
      }
      this.c2 = new Vector(param_floats)
      this.p = new Vector(param_floats, 2)
    }else if(type == 'Q' || type == 'q'){
      if (param_floats.length != 4){
        throw error(4, '(x1, y1, x, y)')
        return
      }
      this.c1 = new Vector(param_floats)
      this.p = new Vector(param_floats, 2)
    }else if(type == 'A' || type == 'a'){
      if (param_floats.length != 7){
        throw error(7, '(rx, ry, x-axis-rotation, large-arc-flag, sweep-flag, x, y)')
        return
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
    this.p.x = val;
  }
  get y(){
    return this.p.y;
  }
  set y(val){
    this.p.y = val;
  }

  _v_s(val){
    return `${this[val].x}${this[val].y>0?',':''}${this[val].y}`
  }

  toString(){
    let cmr = (v) =>{
      if (v.x > 0){
        return ','
      }else{
        return ''
      }
    }
    switch (this.cmd_type.toUpperCase()) {
//    Move: x, y
      case 'M': return `${this.cmd_type}${this._v_s('p')}`;

//    Line: x, y
      case 'L': return `${this.cmd_type}${this._v_s('p')}`;

//    Horizontal Line: x
      case 'H': return `${this.cmd_type}${this.x}`;

//    Vertical Line: y
      case 'V': return `${this.cmd_type}${this.y}`;

//    Bézier Curve: x1, y1, x2, y2, x, y
      case 'C': return `${this.cmd_type}${this._v_s('c1')}${cmr(this.c2)}${this._v_s('c2')}${cmr(this.p)}${this._v_s('p')}`;

//    Reflection Bézier: x2, y2, x, y
      case 'S': return `${this.cmd_type}${this._v_s('c2')}${cmr(this.p)}${this._v_s('p')}`;

//    Quadratic Curve: x1, y1, x, y
      case 'Q': return `${this.cmd_type}${this._v_s('c1')}${cmr(this.p)}${this._v_s('p')}`;

//    Quadratic Curve String: x, y
      case 'T': return `${this.cmd_type}${this._v_s('c1')}${cmr(this.p)}${this._v_s('p')}`;

//    Arc: rx, ry, x-axis-rotation, large-arc-flag, sweep-flag, x, y
      case 'A': return `${this.cmd_type}${this._v_s('r')},${x_axis_rotation},${large_arc_flag},${sweep_flag}${cmr(this.p)}${this._v_s('p')}`;

//    Close:
      case 'Z': return `${this.cmd_type}`
    }
  }
}
class SvgDPath{
  constructor(string){
    this.length = 0;
    this.d_string = string;
  }

  set d_string(string){
    if (typeof string !== 'string'){
      throw `Error setting d:\nd must be set to a string, not ${typeof string}`
      return
    }
    //Remove white space
    let cmds = string.replace(/(\n|\t|\r)/g, '');

    //Add split markers
    cmds = cmds.replace(/(M|m|L|l|H|h|V|v|Z|z|C|c|S|s|Q|q|T|t|A|a)/g, '\n$&');
    cmds = cmds.slice(1);
    //Split
    cmds = cmds.split('\n');

    this.length = 0;
    cmds.forEach((cmd) => {
      let scmd = new SvgPathCmd(cmd);
      this[this.length] = scmd;
      this.length++;
    });
  }

  toString(){
    let str = ''
    for (var i = 0; i < this.length; i++){
      str += `${this[i]}`
    }
    return str
  }
}

//LinkItem
class LinkItem{
  constructor(){
    this.last = null;
    this.next = null;
  }

  //Link this item to another item
  // <this> <=> <l2>
  link(l2){
    if (l2 instanceof LinkItem){
      this.next = l2;
      l2.last = this
    }
  }

//  Disconect an item
//  PARAMS: dir (
//    both: disconects both the previous node and the next
//    next: disconect the next node
//    last: disconect the last node
//  )
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
}

//LinkList
class LinkList{
  constructor(){
    this.start = null;
    this.end = null;
    this.length = 0;
  }

  // Connect an item or list to the end of this list
  push(item){
    if (item instanceof LinkItem){
      if (this.contains(item)){
        throw `Error pushing to linked list:\nCannot push an item contained in this list, remove the item first\nLIST'S SHOULD NOT CONTAIN OTHER LISTS ITEMS`
        return
      }

      this.length++;

      //if the node was unset <start> => item <= <end>
      if (this.end == null || this.start == null){
        this.start = item; // <start> => item
        this.end = item;   // <end> => end

      //Otherwise end refers to <end> <=> <item>
      //                        <end> => <item>
      }else{
        this.end.link(item)
        this.end = item;
      }
    }else if(item instanceof LinkList){
      if (this.contains(item)){
        throw `Error pushing to linked list:\nCannot push a list that contains an items in this list\nLIST'S SHOULD NOT CONTAIN OTHER LISTS ITEMS`
        return
      }

      this.length += item.length
      //if node not set <start> => <item.start>  <item.end> <= <end>
      if (this.end == null || this.start == null){
        this.start = item.start;
        this.end = item.end;

      //Else      <end> <=> item
      //          item <= <end>
      }else{
        this.end.link(item.start)
        this.end = item.end;
      }
    }else{
      throw `Error pushing to linked list:\nThe item given is not a LinkList or LinkItem`
    }
  }

  // Connect an item or list to the start of this list
  queue(item){
    if (item instanceof LinkItem){
      if (this.contains(item)){
        throw `Error queueing to linked list:\nCannot queue an item contained in this list, remove the item first`
        return
      }

      this.length ++;

      //not set:  <start> => item <= <end>
      if (this.end == null || this.start == null){
        this.start = item;
        this.end = item;

        // else: <item> <=> <start> | <start> => <item>
      }else{
        item.link(this.start)
        this.start = item;
      }


    }else if(item instanceof LinkList){
      if (this.contains(item)){
        throw `Error queueing to linked list:\nCannot queue a list that contains items in this list`
        return
      }

      this.length += item.length;

      // <start> => item <= <end>
      if (this.start == null){
        this.start = item.start;
        this.end = item.end;

        // item <=> <start> | <start> => item
      }else{
        item.end.link(start)
        this.start = item.start;
      }
    }else{
      throw `Error queueing to linked list:\nThe item given is not a LinkList or LinkItem`
    }
  }

  // Remove a linked item from the end of the list
  pop(){
    if (this.end == null || this.start == null){
      return null
    }else if (this.end == this.start){
      let end = this.end;
      thid.end = null;
      this.start = null;
      return end;
    }else{
      let oldl = this.end;
      let newl = this.end.last;
      oldl.break();
      this.end = newl;
      return oldl
    }
  }

  // Remove a linked item from the start of the list
  dequeue(){
    if (this.end == null || this.start == null){
      return null
    }else if (this.end == this.start){
      let start = this.start
      thid.end = null;
      this.start = null;
      return start;
    }else{
      let oldl = this.start;
      let newl = this.start.next;
      oldl.break();
      this.start = newl;
      return oldl
    }
  }

  // Remove an item
  remove(item){
    if (item instanceof LinkItem){
      if (this.contains(item)){
        if (item.last == null || item == this.start){
          this.dequeue()
        }else if(item.next == null || item == this.end){
          this.pop()
        }else{
          this.length --;
          let last = item.last;
          let next = item.next;
          item.break();
          last.link(next);
          return item
        }
      }else{
        throw `Error removing an item:\nItem given is not contained in this list`
        return null
      }
    }else{
      throw `Error removing an item:\nItem given is not a LinkItem`
      return null
    }
  }

  // Visit each node and call the visit function visit(item, i)
  forEach(visit){
    if (visit instanceof Function){

      if (this.end == null || this.start == null){
        return
      }else if(this.end == this.start){
        visit(this.end);
      }else{
        let cur = this.start;
        let i = 0;
        visit(cur, i);
        while ( cur != this.end && cur != null){
          cur = cur.next;
          i++;
          visit(cur, i);
        }
      }
    }else{
      throw `Error calling forEach:\n${visit} is not a Function`
    }
  }

  // Check if an item is inside this LinkList
  contains(item){
    if (item instanceof LinkItem){
      let contains = false;
      this.forEach((node) => {
        contains |= (node === item)
      })
      return contains
    }else if(item instanceof LinkList){
      let contains = false;
      item.forEach((node) => {
        contains |= this.contains(node)
      })
      return contains
    }else{
      throw `Error calling contains:\nThe item given is not a LinkItem`
      return false
    }
  }

  // Connect a LinkList or LinkItem after given location
  putAfter(item, location){
    if (item instanceof LinkItem || item instanceof LinkList){
      if (this.contains(location)){
        if (location.next == null || location == this.end){
          this.push(item)
        }else if(location.last == null || location == this.start){
          this.queue(item)
        }else{
          if (this.contains(item)){
            throw `Error calling putAfter:\nCannot put an item contained inside this list`
            return
          }
          if (item instanceof LinkItem){
            this.length++;
            let next = location.next;
            location.link(item);
            item.link(next);
          }else{
            this.length += item.length;
            let next = location.next;
            location.link(item.start);
            item.end.link(next);
          }
        }
      }else{
        throw `Error calling putAfter:\nThe location is not in the linked list`
      }
    }else{
      throw `Error calling putAfter:\nThe item given is not a LinkList or LinkItem`
    }
  }

  // Connect the end and start
  // <end> next <=> last <start>
  set loop(val = false){
    if (typeof val === 'boolean'){
      if (val) {
        if (!(this.end == null || this.start == null)){
          this.end.link(this.start);
        }
      }else{
        if (this.end == null || this.start == null){
          this.end.break('next')
        }
      }
      this._loop = true;
    }else{
      throw `Error setting loop:\nLoop can be either set true or false`
    }
  }
  get loop(){
    return this._loop
  }

  rotate(x = 1){
    if (typeof x !== 'number'){
      throw `Error rotating list:\nrotate takes a number`
      return
    }else if ((this.end == this.start) || (this.end == null || this.start == null)){
      return
    }

    let old_loop = this.loop;
    let dir = (x > 0);
    x = Math.abs(x);
    this.loop = true;

    while (x > 0){
      if (dir){
        this.end = this.end.next;
        this.start = this.start.next;
      }else{
        this.end = this.end.last;
        this.start = this.start.last;
      }
      x--;
    }

    this.loop = old_loop;
  }
}

let SVGPlus = {
  getElementById: function(id){
    let el = document.getElementById(id);
    return this.createSvgPlusElement(el)
  },
  createSvgPlusElement: function(el){
    if (el instanceof SVGElement || ((`${el}`).indexOf('SVG') != -1)){
      if (el instanceof SVGPathElement || ((`${el}`).indexOf('SVGPathElement') != -1)){
        return new SvgPath(el)
      }else{
        return new SvgElement(el)
      }
    }else{
      throw 'el not svg'
    }
    return null
  },
  create: function(name, props = null) {
    if(props == null){
      let el = document.createElementNS("http://www.w3.org/2000/svg", name);
      return this.createSvgPlusElement(el)
    }else{
      let el = document.createElementNS("http://www.w3.org/2000/svg", name);
      el = this.createSvgPlusElement(el)
      el.props = props;
      return el
    }
  },
  parseElement: function(elem) {
    if (elem == null){
      return null
    }
    if (typeof elem === 'string'){
      return this.parseElement(document.getElementById(elem))
    }else if (elem instanceof Element){
      return elem
    }else{
      return null
      throw 'invalid element'
    }
  },
  importFromObject: function(el, callback){
    el = this.parseElement(el);
    console.log(`${el}`);
    let id = el.id;
    el.onload = () => {
      let svg = el.contentDocument.all[0];
      svg.setAttribute('id', id)
      let parent = el.parentNode;
      parent.removeChild(el);
      parent.appendChild(svg)
      if ((`${svg}`).indexOf('SVGSVGElement') != -1){
        let svgplus = new SvgSvgElement(svg)
        if (callback instanceof Function){
          callback(svgplus)
        }
      }
    }
  }
}
