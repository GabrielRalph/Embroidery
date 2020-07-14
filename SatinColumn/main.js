let group = document.getElementById('design')
let render = document.getElementById('render')
let node = document.getElementById('node_render')

let tree = new STree(group, render)
tree.VNodeSetup(node)


console.log(tree);
