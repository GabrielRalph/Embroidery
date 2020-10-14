let sTree = new STree('node-svg');
sTree.el = document.getElementById('EMB');
window.onerror = (err) => {
  alert(err)
}
let box = sTree.el.parentNode;
console.log({b: box});
sTree.el.scrollIntoView({block: 'center', inline: 'center'});
class CtxMenu{
  constructor(parent = document.body){
    this.el = document.createElement('DIV');
    this.el.setProps({class: 'ctx-menu'})
    this.parent = parseElement(parent);
    this.__attachRightClickEvent();
  }

  set hide(val){
    this._hide = val
    if(val){
      if (this.parent.contains(this.el)){
        this.parent.removeChild(this.el)
      }
    }else{
      this.parent.appendChild(this.el)
    }
  }
  get hide(){
    return this._hide;
  }

  __attachRightClickEvent(){
    this.parent.addEventListener('contextmenu', (ev) => {
        ev.preventDefault();
        this.location = ev;
        this.hide = false;
        this.__attachMoveAwayEvent();
        return false;
    }, false);
  }
  __attachMoveAwayEvent(){
    this.parent.addEventListener('mousemove', (ev) => {
      let over = false;
      ev.path.forEach((path) => {
        if (path.className == 'ctx-menu'){
          over = true;
        }
      });
      let p = new Vector(ev);
      let d = p.distance(this.location);

      if (!over && d > 75){
        this.hide = true;
        this.parent.onmousemove = null;
      }
    })
  }

  set options(ops){
    if (ops instanceof Object){
      this._options = {};
      for (name in ops){
        if (ops[name] instanceof Function){
          this._options[name] = ops[name]
        }else{
          throw `${ops[name]} is not a valid function`
        }
      }
    }else{
      throw `Options must be an Object in form\n{\noption_name: callback,\noption_name2: callback2\n}`
    }
    this.el.innerHTML = ''
    for (name in this._options){
      this.el.createChild('H1', {textContent: name, onclick: this._options[name]})
    }
  }
  get options(){
    return this._options
  }

  set location(location){
    if (location.x && location.y){
      this._location = new Vector(location);
      this.el.setProps({style: {top: `${location.y}px`, left: `${location.x}px`}})
    }else{
      throw `Location must be a vector with x, and y coordinates`
    }
  }
  get location(){
    return this._location
  }
}

let ctxMenu = new CtxMenu();
ctxMenu.options = {
  'Open Svg': () => {
    try{
      sTree.openSvg('svg-box')
    }catch(e){
      console.log('x');
    }

  },
  'Save Svg': () => {
    sTree.saveSvg()
  }
}
