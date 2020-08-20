let create = (name, props = null) => {
  if(props == null){
    return document.createElementNS("http://www.w3.org/2000/svg", name);
  }else{
    let el = document.createElementNS("http://www.w3.org/2000/svg", name);
    el.setProps(props);
    return el
  }
}
let parseElement = (elem) => {
  if (elem == null){
    return null
  }
  if (typeof elem === 'string'){
    return parseElement(document.getElementById(elem))
  }else if ((`${elem.constructor}`).indexOf('Element') != -1){
    return elem
  }else{
    throw 'invalid element'
  }
}

SVGElement.prototype.setBackground = function (color){
  this.style.setProperty('background', color)
}

SVGElement.prototype.createChild = function (name, props = null){
  let el = null
  if(props == null){
    el = document.createElementNS("http://www.w3.org/2000/svg", name);
  }else{
    el = document.createElementNS("http://www.w3.org/2000/svg", name);
    el.setProps(props);
  }
  this.appendChild(el)
  return el
}

SVGElement.prototype.setStroke = function (color, width = null){
  this.style.setProperty('stroke', color)
  if (width != null){
    this.style.setProperty('stroke-width', width)
  }
}
SVGElement.prototype.setFill = function (color){
  this.style.setProperty('fill', color)
}


SVGElement.prototype.setStyles = function (styles) {
  for (style in styles){
    value = styles[style]
    if (value != null){
      this.style.setProperty(style, value)
    }
  }
}
Element.prototype.setStyles = function (styles) {
  for (style in styles){
    value = styles[style]
    if (value != null){
      this.style.setProperty(style, value)
    }
  }
}
SVGElement.prototype.getViewBox = function (mode = null) {
  let viewBox_string = this.getAttribute('viewBox');
  let viewBox_array = viewBox_string.split(' ');
  let offset = new Vector(viewBox_array)
  let size = new Vector(viewBox_array, 2)
  if (mode == null){
    return {
      size: size,
      offset: offset
    }
  }else if(mode == 'outline_path'){
    let c2 = new Vector(offset.x, offset.y + size.y);
    let c3 = offset.add(size);
    let c4 = new Vector(offset.x + size.x, offset.y)
    return `M${offset}L${c2}L${c3}L${c4}Z`
  }
}
SVGElement.prototype.getLastChild = function () {
  return this.children[this.children.length - 1]
}
SVGElement.prototype.setProps = function (json) {
  for (var key in json){
    var value = json[key]
    if(typeof value === 'string' || value instanceof String){
      this.setAttribute(key, value)
    }else if(key == 'style'){
      this.setStyles(value)
    }
  }
}
Element.prototype.setProps = function (json) {
  for (var key in json){
    var value = json[key]
    if(typeof value === 'string' || value instanceof String){
      this.setAttribute(key, value)
    }else if(key == 'style'){
      this.setStyles(value)
    }
  }
}
SVGElement.prototype.getScale = function () {
  let oldscale = this.style.transform
  oldscale = oldscale?parseFloat(oldscale.split(/\(|\)/g)[1]):1
  return oldscale
}
SVGPathElement.prototype.start = false
SVGPathElement.prototype.setD = function(string){this.setAttribute('d',string)}
SVGPathElement.prototype.getD = function(){return this.getAttribute('d')}
SVGPathElement.prototype.appendD = function(string){this.setD(this.getD() + string)}
SVGPathElement.prototype.addPoint = function (point, cpoint1 = null, cpoint2 = null){
  if(point instanceof Vector){
    if(!this.start){
      this.setD(`M${point}L${point}`)
      this.start = true
    }else{
      if(cpoint1 instanceof Vector && cpoint2 instanceof Vector){
        this.appendD(`C${cpoint1},${cpoint2},${point}`)
      }else if(cpoint1 instanceof Vector && !(cpoint2 instanceof Vector)){
        this.appendD(`S${cpoint1},${point}`)
      }else if(!(cpoint1 instanceof Vector)){
        this.appendD(`L${point}`)
      }
    }
  }
}


SVGPathElement.prototype.smoothBuffer = []
SVGPathElement.prototype.smoothFactor = 5
SVGPathElement.prototype.smoothSum = 0
SVGPathElement.prototype.addSmoothPoint = function (point){
  if(!this.getD() && this.smoothBuffer.length != 0){
    this.clear()
  }
  if(point instanceof Vector){
    this.smoothSum = point.add(this.smoothSum)
    this.smoothBuffer.push(point)
    if(this.smoothBuffer.length > this.smoothFactor){
      let remove = this.smoothBuffer.shift()
      this.smoothSum = this.smoothSum.sub(remove)
    }
    var smoothPoint = this.smoothSum.div(this.smoothBuffer.length)
    this.addPoint(smoothPoint)
  }
}
SVGPathElement.prototype.clear = function (){
  this.smoothSum = 0;
  this.smoothBuffer = []
}

SVGUseElement.prototype.setParams = function (params){
  this.innerHTML = ''
  for (var name in params){
    this.innerHTML += `<param name = '${name}' value = '${params[name]}' />`
  }
}
