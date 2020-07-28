let whitelist = {
  class: () => {return true},
  style: () => {return true},
  src: (value) => {
    let valid = 'https://static.planetminecraft.com/';
    let soln = true;
    for (var i = 0; i < valid.length; i++){
      soln &= valid[i] == value[i]
    }
    return soln
  }
}

class SmartParse{
  constructor(whitelist){
    this.whitelist = whitelist;
  }

  parseString(string){
    let temp_output = new DOMParser().parseFromString(`<div>${string}</div>`, 'text/xml')
    let new_output = null;

    if (temp_output.getElementsByTagName('parsererror').length > 0){
      new_output = temp_output.getElementsByTagName('parsererror')[0]
    }else{
      new_output = this._copy(temp_output.firstChild, whitelist)
    }
    return new_output
  }
  _copy(el){
    let transverse = (node) => {
      let root = null;
      if (node.nodeName == '#text'){
        root = document.createElement('TEXT')
        root.innerHTML = node.nodeValue;
      }else{
        root = document.createElement(node.nodeName)
        for (var key in whitelist){
          if (this.whitelist[key] instanceof Function){
            let att_value = node.getAttribute(key);
            if( att_value != null){
              if (this.whitelist[key](att_value)){
                root.setAttribute(key, att_value)
              }
            }
          }
        }
        for (var i = 0; i < node.childNodes.length; i++){
          let child = transverse(node.childNodes[i])
          root.appendChild(child)
        }
      }
      return root
    }
    return transverse(el)
  }
}
