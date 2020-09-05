class STree{
  constructor(node_svg = null){
    this.nodeVisualizer = new NodeVisualizer(node_svg);
    this.el = null;
    this.size = 100;
  }

  error(e){
    alert(e)
  }

  __parseElementFromString(string){
    let doc = new DOMParser().parseFromString(string, 'image/svg+xml');
    let errors = doc.getElementsByTagName('parsererror');
    if (errors.length > 0){
      let error = errors[0];
      let error_str = ''
      for (var i = 0; i < error.children.length; i++){
        if (error.children[i].firstChild.nodeName == '#text'){
          let value = error.children[i].firstChild.nodeValue;
          error_str += `${value.indexOf('Below is a rendering') == -1?value + '\n':''}`
        }
      }
      throw `Error parsing element from string:\n${error_str}`
    }else{
      let svgs = doc.getElementsByTagName('svg');
      if (svgs.length == 0){
        throw `Error parsing element from string:\nno svg given`
      }else{
        return svgs[0]
      }
    }
  }
  openSvg(svgBox){
    svgBox = parseElement(svgBox);
    let input = document.body.createChild('INPUT', {type: 'file'});
    input.oninput = (e) => {
      handle(e)
    }

    input.click();
    let handle = (e) => {
        var reader = new FileReader();

      reader.onload = (event) => {
        input.parentNode.removeChild(input);
        svgBox.innerHTML = '';
        try {
          let svg = this.__parseElementFromString(event.target.result)
          svgBox.appendChild(svg)
          this.el = svg
        }catch (err){
          svgBox.innerHTML = ''
          this.error(`Error opening svg:\n${err}`)
        }
      }
      reader.readAsText(e.target.files[0]);
    }
  }

  saveSvg(){
    let output = sTree.el.outerHTML;
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

      var a = document.body.createChild("a", {download: 'filename.svg', href: url});
      a.click()
      a.parentNode.removeChild(a)
    }
  }

  getSpecs(group){
    let parent = group.parentNode;
    if (parent instanceof SVGGElement){
      for(var i = 0; i < parent.children.length; i++){
        let child = parent.children[i]
        if (child instanceof SVGTextElement){
          return child
        }
      }
      return this.getSpecs(parent)
    }
  }


  //Make sure that el is set to an SVG element with a valid group
  set el(svg_el){
    svg_el = parseElement(svg_el);

    //svg_el is a null value
    if (svg_el == null){
      this._el = null
      this.root_el = null

    //svg_el is an SVGSVGElement
    }else if (svg_el instanceof SVGSVGElement){

      // Check if the element has any SVGGElements inside it
      let groups = svg_el.getElementsByTagName('g');
      if (groups.length == 0){
        this._el = null;
        throw `Error setting el:\nThe Svg does not contain any SVG Group elements`

      //Get the root group - first group with id: STree, if none the first group
      }else{
        let root = groups[0];
        for (var i = 0; i < groups.length; i++){
          if (groups[i].id == 'STree'){
            group = groups[i];
            break;
          }
        }

        try {
          this.root_el = root;
          this._el = svg_el;
          this.addUserControls()
        }catch(e){
          throw `Error setting el:\n${e}`
        }
      }
    }else{
      this._el = null;
      this.root_el = null;
      throw `Error setting el:\nel must be set to an SVGSVGElement:\n${svg_el} is not an SVG`
    }
  }
  get el(){
    return this._el
  }

  set root_el(group_el){
    group_el = parseElement(group_el);

    if (group_el == null){
      this._root_el = null
      this.nodeVisualizer.watch = false;
    }else if (group_el instanceof SVGGElement){
      try {
        this._root_el = this.__validate(group_el)
        this.nodeVisualizer.watch = this.root_el;
      }catch(e){
        this._root_el = null;
        this.nodeVisualizer.watch = false;
        throw `Error setting root_el:\n${e}`
      }
    }else{
      this._root_el = null;
      this.nodeVisualizer.watch = false;
      throw `Error setting root_el:\nnode_el must be set to an SVGGElement:\n${svg_el} is not an SVG`
    }
  }
  get root_el(){
    return this._root_el;
  }

  get parentNode(){
    return this.el.parentNode
  }

  set size(size){
    size = parseFloat(size);
    if (typeof size === 'number' && size){
      this._size = size;
      if (this.el != null){
        this.el.setProps({style:{width: `${this._size}vmax`}})
      }
    }else{
      this.size = 100;
      throw `Error setting size:\n${size} is not a valid number`
    }
  }
  get size(){
    return this._size;
  }

  addUserControls(){
    if (this.el == null){
      return
    }
    let svg_size = new Vector(this.el.clientWidth, this.el.clientHeight);
    let box = this.el.parentNode;
    let box_size = new Vector(box.clientWidth, box.clientHeight);
    let scrollloc = svg_size.sub(box_size).div(2)
    box.scrollTo(scrollloc.x, scrollloc.y)

    this.el.onwheel = (e) => {
      e.preventDefault()
      this.size += e.deltaY*0.01;
    }

    let clicks = 0;
    this.el.onclick = () => {
      clicks ++;
      setTimeout(() => {
        if (clicks > 2 && !this.root_el.sNode.isComputed()){
          this.root_el.sNode.computeAll();
        }
        clicks = 0;
      }, 600)
    }

    this.el.ondblclick = (e) => {
      e.preventDefault();
      this.size = 100;
    }
    this.el.onmousedown = () => {
      this.el.onmousemove = (e) => {
        let move = new Vector(this.parentNode.scrollLeft, this.parentNode.scrollTop);
        let pos = move.sub(new Vector(e.movementX, e.movementY))
        this.parentNode.scrollTo(pos.x, pos.y)
      }
    }
    this.el.onmouseup = () => {
      this.el.onmousemove = null;
    }
    this.el.onmouseleave = () => {
      this.el.onmousemove = null;
    }
  }
  __validate(root){
    if (root instanceof SVGGElement){
      try {
        this.__validate_node(root);
        let groups = root.getElementsByTagName('g');
        groups.forEach((group) => {
          this.__validate_node(group);
        });
        return root
      }catch(e){
        throw `Error calling validate:\n${e}`
      }
    }else{
      throw `Error calling validate:\nvalidate requires SVGGElement\nnot ${group}`
    }
  }
  __validate_node(node){
    try {
      let type = this.__getSNodeType(node);
      switch (type) {
        case 'SPath':
        node.sNode = new SPath(node, this)
        break;

        case 'SJoin':
        node.sNode = new SJoin(node, this)
        break;

        case 'stupid':
        let child = node.children[0]
        node.parentNode.replaceChild(child, node);
        validate_node(child);
        break;

        default:
        node.parentNode.removeChild(node)
      }
    }catch(e){
      throw `Error calling validate_node:\n${e}`
    }
  }
  //Given an SVG Group Element
  //return the node type of the group based on its children.
  //Returns:
  //  SPath: only geometry elements and none or one text element.
  //  SJoin: only group elements and none or one text element.
  //  stupid: only one group element and none or one text element.
  //  empty: nothing.

  //  Catch: if neither of the above results is returned an error is thrown
  __getSNodeType(group){
    if (group instanceof SVGGElement){
      let geometry_cnt = 0;
      let group_cnt = 0;
      let text_cnt = 0;

      group.forEach((child) => {
        if (child instanceof SVGGElement) {
          group_cnt++;
        }else if(child instanceof SVGGeometryElement){
          geometry_cnt++;
        }else if(child instanceof SVGTextElement){
          text_cnt++;
        }else{
          throw `Error calling getSNodeType:\ngetSNodeType can only take SVG G Elements\nInvalid element <${child.nodeName}>`
          return
        }
      })

      if ((geometry_cnt > 0) && (group_cnt == 0) && (text_cnt == 0||text_cnt == 1)){
        return 'SPath'
      }else if((group_cnt > 0) && (geometry_cnt == 0) && (text_cnt == 0||text_cnt == 1)){
        return 'SJoin'
      }else if((group_cnt == 1) && (geometry_cnt == 0) && (text_cnt == 0||text_cnt == 1)){
        return 'stupid'
      }else if(group_cnt == 0&&geometry_cnt == 0&&text_cnt == 0){
        return 'empty'
      }else{
        throw `Error calling getSNodeType:\ninvalid mixture of children\nGroup:${group_cnt}\nGeometry: ${geometry_cnt}\nText: ${text_cnt}`
      }
    }else{
      throw `Error calling getSNodeType:\ngetSNodeType requires SVGGElement\nnot ${group}`
    }
  }

}
