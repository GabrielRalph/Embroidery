let group = document.getElementById('design')
let render = document.getElementById('render')
let node = document.getElementById('node_render')
let tools = document.getElementById('tool-box')
let download = document.getElementById('download_link')

let tree = new STree(group, render)
tree.download_element = download;
console.log(tree.download_element);

tree.VNodeSetup(node)


// setTimeout(() => {
//   tools.style.setProperty('visibility', 'visible')
//   let exporter = new DSTExporter(download)
//   exporter.exportSPath(tree.root)
// }, 2000)


console.log(tree);
