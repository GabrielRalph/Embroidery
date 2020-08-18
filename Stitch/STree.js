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
    this.importSpecs(input);

    this.output_svg.innerHTML = ''
    this.root.set(new SPath(this))
    this.root.setVisualizerParent(this.output_svg)

    this.output_svg.setProps({viewBox: input.getAttribute('viewBox')})
    this.input_svg = input;
    this.root.build(input);
    this.VNodeRender();
  }

  importSvg(e){
    var reader = new FileReader();
    tree.download_element = download;
      reader.onload = function(event) {
          input_svg.innerHTML = event.target.result;
          let viewBox = input_svg.children[0].getAttribute('viewBox')
          tree.output_svg.setAttribute('viewBox',viewBox)
          let group = document.getElementById('EMB')
          tree.build(group)
      };
      reader.readAsText(e.target.files[0]);
  }

  importSpecs(input){
    this.output_svg.innerHTML = ''
    console.log('s');
    let construct = (group, specs_inherit = null) => {
      let g_cnt = 0;
      let p_cnt = 0;
      for (var i = 0; i < group.children.length; i++){
        let child = group.children[i];
        let name = child.nodeName;
        if (name === 'text'){
          specs_inherit = this.textSpecs(child)
          group.removeChild(child)
        }else if (name === 'path'){
          p_cnt++;
        }else if (name === 'g'){
          g_cnt++;
        }
      }

      if (p_cnt > 0 && g_cnt == 0){
        if (specs_inherit == null){
          console.error('No specification set');
          return
        }else{
          group.setProps(specs_inherit);
        }
      }else if (p_cnt == 0 && g_cnt > 0){
        group.setAttribute('mode', 'join')
        console.log('mode = join');
        for (var i = 0; i < group.children.length; i++){
          let child = group.children[i];
          construct(child, specs_inherit)
        }
      }else{
        console.error(`Invalid Group: ${g_cnt} child groups and ${p_cnt} child paths is not valid`);
        console.error({invalid_group: group});
        return
      }
    }
    construct(input)
  }

  textSpecs(svgTextElement){
    if ((`${svgTextElement.constructor}`).indexOf('SVGTextElement') != -1){
      let str = svgTextElement.textContent;
      let values = {}
      values['mode'] = str.replace(/{((.|\n|\t|\r)*?)}/, (a, b) => {
        let v = b.split(/,|\n/);
        v.forEach((item) => {
          let key = item.replace(/( |\n|\t|\r|(mm))*/g, '').split(':');
          values[key[0]] = key[1];
        });
        return ''
      }).replace(/( |\n|\t|\r|:)*/g, '')

      return (values);
    }else{
      return null
      console.error(`textSpecs can only take an SVGTextElement not ${svgTextElement.constructor}`);
    }
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
