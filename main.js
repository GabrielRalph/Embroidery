let group = document.getElementById('design')
let render = document.getElementById('render')
let node = document.getElementById('node_render')
let tools = document.getElementById('tool-box')
let input_svg = document.getElementById('input-svg-box')
let download = document.getElementById('download_link')

// setTimeout(() => {
//   tools.style.setProperty('visibility', 'visible')
//   let exporter = new DSTExporter(download)
//   exporter.exportSPath(tree.root)
// }, 2000)


// console.log(tree);
// window.onerror = (err) => {
//   alert(err)
//   console.log(err);
// }

function loadImage(e){
  let tree = new STree(render, node)
  var reader = new FileReader();
  tree.download_element = download;
    reader.onload = function(event) {
        input_svg.innerHTML = event.target.result;
        let groups = input_svg.getElementsByTagName('g');
        tree.build(groups[0])
    };
    reader.readAsText(e.target.files[0]);
}
