let create = (name) => {
  return document.createElementNS("http://www.w3.org/2000/svg", name);
}

SVGElement.prototype.setBackground = function (color){
  this.style.setProperty('background', color)
}
SVGElement.prototype.setStroke = function (color){
  this.style.setProperty('stroke', color)
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
