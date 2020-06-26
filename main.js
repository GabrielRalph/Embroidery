let svg = document.getElementById('test')
let cam = new EmbroideryCam(svg)

let test_path2 = document.getElementById('l2')

let test_path3 = document.getElementById('l3')

// cam.runningStitch(test_path2)
v1 = new Vector(100, 100)
v2 = new Vector(772, 14)

let st = cam.camPaths(svg)
// let ls = st[0]
// let ds = []
// for (var i = 1; i < st.length; i++){
//   ds.push(st[i].sub(ls))
//   ls = st[i]
// }
console.log(st);
