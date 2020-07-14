let group = document.getElementById('design')
let render = document.getElementById('render')

let mgmt = new StitchMGMT(render)
mgmt.set(group)
mgmt.computeAll((sPath) => {
  console.log(sPath);
})


// compiler.set(group)
// compiler.computeAll((sPaths) => {
//   let parent_path = sPaths[1];
//   // for (var i = 1; i < sPaths.length; i++){
//     let last_offset = parent_path.insertAtIntersection(sPaths[0], 19)
//     console.log(last_offset);
//     sPaths[0].removeVisualizer()
//   // }
// })
