let group = document.getElementById('design')
let render = document.getElementById('render')
let node = document.getElementById('node_render')
let tools = document.getElementById('tool-box')
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
// let toolBox = new ToolBox('tool-box');
// toolBox.show('join-mode')
let sTree = new STree('output-svg-box', 'node_render', 'tool-box')

let input_svg = document.getElementById('input-svg-box')
function openSvg(e){
  var reader = new FileReader();
  sTree.download_element = download;
  reader.onload = function(event) {
      input_svg.innerHTML = event.target.result;
      let viewBox = input_svg.children[0].getAttribute('viewBox')
      sTree.output_svg.setAttribute('viewBox',viewBox)
      let group = document.getElementById('EMB');
      if (group){
        sTree.build(group)
      }else{
        throw `No group with id EMB, set main group of designs id to EMB`
      }
  };
  reader.readAsText(e.target.files[0]);
}

let local = window.localStorage.getItem('output')
if (local != null){
  input_svg.innerHTML = local;
  let viewBox = input_svg.children[0].getAttribute('viewBox')
  sTree.output_svg.setAttribute('viewBox',viewBox)
  let groups = input_svg.getElementsByTagName('g');
  sTree.build(groups[0])
}


function saveSvg(e){

  let output = sTree.output_svg.outerHTML;
  // Remove defs
  output = output.replace(/<defs(\s|\S)*?>(\s|\S)*?<\/defs>/g, '')

  // Remove excess white space
  output = output.replace(/ ( +)/g, '').replace(/^(\n)/gm, '')
  output = output.replace(/></g, '>\n<')

  //Autoindent
  output = output.split('\n');
  var depth = 0;
  var newOutput = ''
  for (var i = 0; i < output.length; i++){
    depth += (output[i].search(/<\/(g|svg)>/) == -1)?0:-1;
    for (var j = 0; j < depth; j++){
      newOutput += '\t'
    }
    newOutput += output[i] + '\n';
    depth += (output[i].search(/<(g|svg)(\s|\S)*?>/) == -1)?0:1;
  }

  window.localStorage.setItem('output', newOutput)

  var blob = new Blob([newOutput], {type: "text/plain"});
  var url = null;

  if (url == null){
    url = window.URL.createObjectURL(blob);

    var a = document.createElement("a");
    a.setAttribute('download', 'test.svg')
    a.setAttribute('href', url)
    document.body.appendChild(a);
    a.click()
  }
}
