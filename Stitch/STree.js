class STree{
  constructor(output_box, node_svg, tool_box){
    this.box = parseElement(output_box);
    this.toolBox = new ToolBox(tool_box)
    this.output_svg = this.box.getElementsByTagName('svg')[0];
    this.node_svg = parseElement(node_svg);
    this.root = null;
  }

  build(group){
    this.output_svg.innerHTML = '';
    this.node_svg.innerHTML = '';
    this.root = this.__build(group);
    this.output_svg.appendChild(this.root.el)
    this.node_svg.appendChild(this.root.vNode.el)
    this.updateVNodes()
  }

  __build(group, specs = null){
    let paths = []
    let groups = []

    if(group.children.length > 0){
      //Sort children into types
      for (var i = 0; i < group.children.length; i++){
        let child = group.children[i];
        switch (child.nodeName) {
          case 'text':
          specs = this.___textSpecs(child)
          break;

          case 'path':
          paths.push(child)
          break;

          case 'g':
          groups.push(child)
          default:
        }
      }

      //Looking at the number of paths and groups
      let p_cnt = paths.length;
      let g_cnt = groups.length;


      //StitchPath - All paths no groups
      if (p_cnt > 0 && g_cnt == 0){
        let sPath = new SPath(this, group, specs)
        return sPath

        //Join - All groups mo paths
      }else if (p_cnt == 0 && g_cnt > 0){
        let sJoin = new SJoin(this);
        groups.forEach((child_group) => {
          let child = this.__build(child_group, specs)
          console.log(child_group);
          sJoin.appendChild(child)
        });
        if (sJoin.children.length > 1){
          return sJoin
        }else{
          return sJoin.children[0]
        }

        //Invalid - Nothing or a mixture of groups and paths
      }else{
        throw group//`Invalid node: ${p_cnt} groups and ${g_cnt}`
      }
    }
  }

  ___textSpecs(svgTextElement){
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


  updateVNodes(){
    if (this.root instanceof SNode){
      let height = 0;
      let recursiveHelp = (node, level=0, lastWidth = 0) => {
        height = height < level? level:height;
        // Children
        if(node.children.length > 0){

          var width = 0;
          for(var i in node.children){
            width += recursiveHelp(node.children[i], level + 2, width + lastWidth);
          }

          node.width = width;
          node.pos = new Vector(lastWidth + width/2, level);

          return width

          // Leaf
        }else{
          node.width = 1;
          node.pos = new Vector(lastWidth + 0.5, level);
          return 1
        }
      }
      let width = recursiveHelp(this.root.vNode)
      this.node_svg.setProps({
        viewBox: `0 -1 ${width} ${height + 2}`
      })
      let update = (node) => {
        node.__update()
        node.children.forEach((child) => {
          update(child)
        });
      }
      update(this.root.vNode)
    }
  }
}

class STreeNode{
  constructor(sTree){
    this.sTree = sTree;
    this.children = [];
    this.parent = null;
    this.el = create('g')
  }




  // Append a child sNode
  __appendChild(child){
    this.children.push(child);
    child.parent = this;
    this.el.appendChild(child.el);
  }

  // Remove a child sNode
  __removeChild(child){
    let newChildren = [];
    this.el.removeChild(child.el)

    for (var i = 0; i < this.children.length; i++){
      let child_i = this.children[i]
      if (child_i != child){
        newChildren.push(child_i)
      }
    }
    this.children = newChildren

    if (this.children.length == 1){
      this.__set(this.children[0])
    }
  }

  // Set as another sNode
  __set(child){
    let parent = this.parent
    if(parent){
      parent.__appendChild(child)
      parent.__removeChild(this);
    }
  }

  get parent(){
    return this._parent
  }

  set parent(value){
    this._parent = value
  }
}
class SNode extends STreeNode{
  constructor(sTree){
    super(sTree)
    this.vNode = new VNode(this)
  }


  // Append a child sNode
  appendChild(child){
    if (child instanceof VNode){
      this.vNode.__appendChild(child);
      this.__appendChild(child.sNode)
    }else if(child instanceof SPath || child instanceof SJoin){
      this.__appendChild(child);
      this.vNode.__appendChild(child.vNode)
    }
    this.sTree.updateVNodes()
  }

  // Remove a child sNode
  removeChild(child){
    if (child instanceof VNode){
      this.vNode.__removeChild(child);
      this.__removeChild(child.sNode)
    }else if(child instanceof SPath || child instanceof SJoin){
      this.__removeChild(child);
      this.vNode.__removeChild(child.vNode)
    }
    this.sTree.updateVNodes()
  }

  // Se`t as another sNode
  set(child){
    if (child instanceof VNode){
      this.vNode.__set(child);
      this.__set(child.sNode)
    }else if(child instanceof SPath || child instanceof SJoin){
      this.__set(child);
      this.vNode.__set(child.vNode)
    }
    this.sTree.updateVNodes()
  }


  set _onclick(func){
    if(this instanceof SPath){
      this.el.onclick = func;
    }
  }
  set onclick(callback){
    this._onclick = callback;
    this.vNode._onclick = callback;
  }
  get _onclick(){
    return this.el.onclick;
  }
  get onclick(){
    return this._onclick
  }

  set _onmouseover(func){
    if(this instanceof SPath){
      this.el.onmouseover = func;
    }
  }
  get _onmouseover(){
    return this.el.onmouseover;
  }
  set onmouseover(callback){
    this._onmouseover = callback;
    this.vNode._onmouseover = callback;
  }
  get onmouseover(){
    return this._onmouseover
  }

  set _onmouseleave(func){
    if(this instanceof SPath){
      this.el.onmouseleave = func;
    }
  }
  get _onmouseleave(){
    return this.el.onmouseleave;
  }
  set onmouseleave(callback){
    this._onmouseleave = callback;
    this.vNode._onmouseleave = callback;
  }
  get onmouseleave(){
    return this._onmouseleave
  }

  removeEventHandlers(){
    this.__removeEventHandlers();
    this.vNode.removeEventHandlers();
  }
  __removeEventHandlers(){
    this.onclick = null;
    this.onmouseover = null;
    this.onmouseleave = null;
  }


  _highlight(bool, color = 'red', width = '0.1'){
    let node = this.vNode.el;
    let path = this.el;

    if (bool){
      node.setStroke(color, width);
      path.setProps({filter: 'url("#glow")'})
    }else{
      node.setStroke('none');
      path.setProps({filter: ''})
    }
  }
  highlight(bool, color = 'red', width = '0.1'){
    this._highlight(bool, color = 'red', width = '0.1')
    this.children.forEach((sNode) => {
      sNode.highlight(bool, color, width)
    });
  }
  _hover(bool){
    if(bool){
      this.onmouseover = () => {
        this.highlight(true);
      }

      this.onmouseleave = () => {
        this.highlight(false);
      }
    }else{
      this.onmouseover = null;
      this.onmouseleave = null;
    }
  }

  hover(bool){
    this._hover(bool)
    this.children.forEach((sNode) => {
      sNode.hover(bool)
    });
  }
}


class WorkSet{
  constructor(sTree){
    this.sTree = sTree;
    let panel_style = {
      x: '0%',
      y: '0%',
      width: '100%',
      height: '100%',
      fill: 'rgba(255, 255, 255, 0.7)'
    }

    this.el_nodes = sTree.node_svg.createChild('g');
    this.panel_nodes = this.el_nodes.createChild('rect', panel_style)

    this.el_paths_group = sTree.output_svg.createChild('g');
    this.panel_paths = this.el_paths_group.createChild('rect', panel_style)
    this.el_paths = this.el_paths_group.createChild('g')
    this.pointer = this.el_paths_group.createChild('ellipse',{
      fill: 'blue',
      rx: '3',
      ry: '3'
    })

    this.nodes = []
  }

  // params:
  //    sNode: adds an sNode to workSet

  appendNode(sNode){
    if (sNode instanceof SJoin || sNode instanceof SPath){

      sNode.el.parentNode.removeChild(sNode.el);
      sNode.vNode.el.parentNode.removeChild(sNode.vNode.el);

      this.el_paths.appendChild(sNode.el);
      this.el_nodes.appendChild(sNode.vNode.el);

      this.nodes.push(sNode)
    }
  }

  // params:
  //    sNode: removes an sNode from workSet
  //   string:
  //      'all': removes all nodes from the workSet
  removeNode(sNode){
    if (sNode instanceof SJoin || sNode instanceof SPath){
      if (!sNode.parent.el.contains(sNode.el)){
        sNode.parent.el.appendChild(sNode.el)
      }
      if (!sNode.vNode.parent.el.contains(sNode.vNode.el)){
        sNode.vNode.parent.el.appendChild(sNode.vNode.el)
      }

      if (this.el_paths.contains(sNode.el)){
        this.el_paths.removeChild(sNode.el)
      }
      if (this.el_nodes.contains(sNode.vNode.el)){
        this.el_nodes.removeChild(sNode.vNode.el);
      }


      let new_nodes = [];
      this.nodes.forEach((node) => {
        if (node != sNode){
          new_nodes.push(node)
        }
      });
      this.nodes = new_nodes;


    }else if(sNode === 'all'){
      while(this.nodes.length > 0){
        this.removeNode( this.nodes[0] )
      }

    }
  }
  remove(){
    this.removeNode('all')
    if (this.sTree.node_svg.contains(this.el_nodes)){
      this.sTree.node_svg.removeChild(this.el_nodes)
    }
    if(this.sTree.output_svg.contains(this.el_paths)){
      this.sTree.output_svg.removeChild(this.el_paths_group)
    }
  }
  point(point, size = 3, color = 'blue'){
    this.pointer.setProps({
      cx: `${point.x}`,
      cy: `${point.y}`,
      fill: color,
      rx: `${size}`,
      ry: `${size}`
    })
  }
}
