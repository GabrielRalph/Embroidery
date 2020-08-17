class STree{
  constructor(output_svg, node_svg){
    this.box = document.getElementById('output-svg-box');
    this.output_svg = output_svg
    this.node_svg = node_svg
    this.root = new SPath(this)
    this.root.setVisualizerParent(output_svg)
    this.VNodeRender()
  }

  build(input){
    this.output_svg.innerHTML = ''
    this.root.set(new SPath(this))
    this.root.setVisualizerParent(this.output_svg)
    this.output_svg.setProps({viewBox: input.getAttribute('viewBox')})
    this.input_svg = input;
    this.root.build(input);
    this.VNodeRender();
  }

  // VNodeSetup(svg){
  //   this.VNodeRender()
  // }

  VNodeRender(){
    let height = 0;

    let recursiveHelp = (node, level=0, lastWidth = 0) => {
      height = height < level? level:height;

      // Children
      if(node.children.length > 0){

        var width = 0;
        for(var i in node.children){
          width += recursiveHelp(node.children[i], level + 2, width + lastWidth);
        }

        node.vNode.width = width;
        node.vNode.pos = new Vector(lastWidth + width/2, level);

        return width

        // Leaf
      }else{
        node.vNode.width = 1;
        node.vNode.pos = new Vector(lastWidth + 0.5, level);
        return 1
      }
    }
    let width = recursiveHelp(this.root)
    this.node_svg.setProps({
      viewBox: `0 -1 ${width} ${height + 2}`
    })

    this.node_svg.innerHTML = ''
    let links = create('g')
    this.node_svg.appendChild(links)
    let recursiveHelp2 = (node) => {
      this.node_svg.appendChild(node.vNode.node)
      if (node.parent){
        links.innerHTML += node.vNode.link(node.parent.vNode)
      }
      for (var i = 0; i < node.children.length; i++){
        recursiveHelp2(node.children[i])
      }
    }
    recursiveHelp2(this.root)
  }


}
