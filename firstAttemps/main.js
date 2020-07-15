const dl = 0.01
let gradLine = (path, l, dx = 100) => {
  let pp1 = new Vector(path.getPointAtLength(l))
  let pp2 = new Vector(path.getPointAtLength(l + dl))

  let m = pp1.grad(pp2)

  let line = create('path')
  line.setProps({
  stroke: 'blue',
  'stroke-width': '2',
  fill: 'none',
  })
  let p2 = pp1.add(new Vector(dx, dx*m))
  line.addPoint(pp1)
  line.addPoint(p2)
  return line
}
let addPoint = (v, color = 'green') => {
  let point = create('path')
  point.setProps({
    stroke: color,
    'stroke-width': '3',
    'stroke-linecap': 'round',
    d: `M${v.x},${v.y}L${v.x},${v.y}`,
  })
  svg.appendChild(point)
}

let svg = document.getElementById('test')

let distToPoint = (p1, p2, p) =>  {
  let line = p2.sub(p1).rotate(Math.PI/2)
  let d = line.dot(p.sub(p1))/line.norm()
  return Math.abs(d)
}

let design = document.getElementById('design')

// let cam = new EmbroideryCam(svg)

let path = document.getElementById('coral')

let test_path3 = document.getElementById('l3')

// cam.runningStitch(test_path2)
v1 = new Vector(100, 100)
v2 = new Vector(22, 14)

// let stitches = cam.pathToStitch(path)
// console.log(stitches);

let stitchCam = new StitchCam(svg)
let stats = document.getElementById('stats').getElementsByTagName('tbody')[0]
stitchCam.statusTable = stats;

let exporter = new DSTExporter(document.getElementById('download_link'))
stitchCam.done = () => {
  exporter.exportStitchCam(stitchCam)
}
// stitchCam.addPathGroup(design)
// stitchCam.addPath(path)
// stitchCam.start()
// runStitch.res = 0.4
// runStitch.setPath(path)
//
// let step = () => {
//   if(runStitch.nextStitch()){
//     window.requestAnimationFrame(step)
//   }
// }
// these are relative to the viewport



svg.onresize = () => {
}

svg.onmousemove = (e) => {

  var viewBox = svg.getAttribute('viewBox').split(' ')
  var viewportOffset = svg.getBoundingClientRect();
  scale = parseFloat(viewBox[2])/svg.clientWidth

  var point = svg.createSVGPoint();
  point.x = (e.x - viewportOffset.left)*scale + parseFloat(viewBox[0]);
  point.y = (e.y - viewportOffset.top)*scale + parseFloat(viewBox[1]);

  let paths = document.getElementsByTagName('path')
  let found = false
  for (var i = paths.length - 1; i >= 0; i--){
    if (paths[i].isPointInStroke(point) && !found){
      paths[i].setAttribute('filter', 'url(#glow)')
      found = true
    }else{
      if (paths[i] != currentPath){
        paths[i].setAttribute('filter', 'none')
      }
    }
  }
}
let currentPath = null
let inputs = {
  color: document.getElementById('color_input'),
  label: document.getElementById('label_input'),
  res: document.getElementById('res_input'),
  stitchLength: document.getElementById('stitchLength_input'),
  threshold: document.getElementById('threshold_input')
}

let add_path = document.getElementById('add_path')
add_path.style.setProperty('display', 'none')
svg.onclick = (e) => {
  var viewBox = svg.getAttribute('viewBox').split(' ')
  var viewportOffset = svg.getBoundingClientRect();
  scale = parseFloat(viewBox[2])/svg.clientWidth

  var point = svg.createSVGPoint();
  point.x = (e.x - viewportOffset.left)*scale + parseFloat(viewBox[0]);
  point.y = (e.y - viewportOffset.top)*scale + parseFloat(viewBox[1]);

  let paths = document.getElementsByTagName('path')
  for (var i = paths.length - 1; i >= 0; i--){
    if (paths[i].isPointInStroke(point)){
      inputs.color.value = paths[i].getAttribute('stroke')
      if (paths[i].id){
        inputs.label.value = paths[i].id
      }else{
        inputs.label.value = 'untitled path'
      }
      add_path.style.setProperty('display', 'block')
      currentPath = paths[i]
      currentPath.setAttribute('filter', 'url(#glow)')

      for (var j = i-1; j >= 0; j--){
        paths[j].setAttribute('filter', 'none')
      }
      return
    }else{
      paths[i].setAttribute('filter', 'none')
    }
  }
}

let add = () => {
  currentPath['stitchProps'] = {}
  for (var key in inputs){
    if (inputs[key].value.length < 1){
      alert(`${key} has not been set`)
      return
    }else{
      currentPath.stitchProps[key] = inputs[key].value
    }
  }
  add_path.style.setProperty('display', 'none')
  stitchCam.addPath(currentPath)
  currentPath.setAttribute('filter', 'none')
  currentPath = null
}

let cancel = () => {
  currentPath.setAttribute('filter', 'none')
  add_path.style.setProperty('display', 'none')
  currentPath = null
}

// window.onclick = () => {
//   stitchCame()
// }
