class SNode{
  constructor(group, sTree){
    this.el = group;
    this.sTree = sTree;
  }
  forEach(callback){
    if (callback instanceof Function){
      this.el.forEach((child) => {
        callback(child)
      });
    }
  }
  removeChild(child){
    this.el.removeChild(child)
  }

  get children(){
    return this.el.children;
  }

  appendChild(el){
    this.el.appendChild(el)
  }
  set type(val){
    if (typeof val === 'string'){
      this.el.setAttribute('type', val);
    }else{
      throw `Error setting type:\ntype must be set to a string`
    }
  }
  get type(){
    this.el.getAttribute('type')
  }
  get mode(){
    return this.el.mode
  }
  set mode(val){
    if (this.el){
      this.el.mode = val
    }
  }
  set onclick(callback){
    if ( callback instanceof Function ){
      this.el.onclick = callback;
      this._onclick = callback;
    }
  }

  get onclick(){
    return this._onclick
  }

  get parentNode(){
    return this.el.parentNode
  }
}
