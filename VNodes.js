class VNodes{
  constructor(node){

    this.rad = 0.3;
    this.parent = null;
    this.colors = {
      join: '#ffd400',
      computeAll: '#ff4433',
      export: 'teal',
      flatten: '#cdea00',
      uncomputed: '#ff3765',
      computed: '#2988ff',
      computing: '#9dc9ff',
      temp: '#fdeb87'
    }
  }

  set node(node){
    this.color = node.mode;
    this.pos = node.pos;
    this.parent = node.parentNode;
    this.width = node.width;
    this.progress = node.progress;
    node.color = this.color;
  }

  get ellipse(){
    let ellipse = create('ellipse')
    ellipse.setProps({
      fill: this.color,
      cx: `${this.pos.x}`,
      cy: `${this.pos.y}`,
      rx: `${this.rad}`,
      ry: `${this.rad}`,
    })

    return ellipse
  }

  set progress(val){
    this._progress = val;
  }
  get progress(){
    let progress = create('path');
    if(this._progress != null){
      let p1 = new Vector(0, - this.rad);
      let p2 = p1.rotate(Math.PI*2*this._progress);
      p1 = p1.add(this.pos)
      p2 = p2.add(this.pos)
      progress.setD(`M${this.pos}L${p1}A${this.rad},${this.rad},0,${this._progress>0.5?'1':'0'},1,${p2}`)
      progress.setFill(this.colors['computed'])
    }
    return progress
  }

  get link(){
    if(this.parent instanceof SVGGElement && this.parent.pos){
      let c1 = this.pos.sub(new Vector(0, 1))
      let c2 = this.parent.pos.add(new Vector(0, 1))
      c2.x += (c2.x == c1.x)?0.01:0
      let link = create('g')
      let id = + new Date()
      id *= Math.random()
      link.innerHTML += `<linearGradient id="link${id}" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="5%" stop-color = "${this.parent.color}" stop-opacity = "1"/>
        <stop offset="95%" stop-color = "${this.color}" stop-opacity = "1" />
      </linearGradient>`
      let path = link.createChild('path', {
        d: `M${this.pos}C${c1},${c2},${this.parent.pos}`,
        fill: 'none',
        stroke: `url(#link${id})`,
        'stroke-width': '0.05',
        style:{
          'pointer-events': 'none'
        }
      })
      return link
    }else{
      console.log({x:this.parent})
    }
  }

  set pos(pos){
    if (pos instanceof Vector){
      this._pos = pos;
    }
  }
  get pos(){
    return this._pos
  }
  set width(w){
    this._width = w;
  }
  get width(){
    return this._width
  }

  set color(value){
    if (value in this.colors){
      this._color = this.colors[value];
    }else{
      this._color = value;
    }
  }
  get color(){
    return this._color
  }
}
class NodeVisualizer{
  constructor(el){
    this.el = el;
  }
  //Set an SVG Group Element to watch
  set watch(node){
    if(node instanceof SVGGElement){
      this._watch = node
      this.nodeObserver = new MutationObserver(() => {
        this.__updateVNodes();
      })
      this.nodeObserver.observe(node, {attributes: true, childList: true, subtree: true})
      this.__updateVNodes();
    }else if(node === false || node === null){
      this._watch = null;
      if (this.nodeObserver != null){
        this.nodeObserver.disconnect();
        this.nodeObserver = null;
        this.el.innerHTML = ''
      }
    }else{
      this._watch = null;
      throw `Error setting watch:\nMust set watch to an SVG Group Element or false`
    }
  }
  get watch(){
    return this._watch
  }

  //Make sure the node el is set to an SVG element, if not throw an error
  set el(svg_el){
    svg_el = parseElement(svg_el);

    if (svg_el == null){
      this._node_el = null
    }else if (svg_el instanceof SVGSVGElement){
      this._node_el = svg_el;
    }else{
      this._node_el = null;
      throw `Error setting root_el:\nnode_el must be set to an SVGGElement:\n${svg_el} is not an SVG`
    }
  }
  get el(){
    return this._node_el
  }

  __updateVNodes(){
    if (this.watch != null){
      //Get tree diagram positions for nodes
      this.__positionVNodes();

      //Create svg node diagram
      this.__renderVNodes();

    }
  }
  __positionVNodes(){
    //Give the nodes geometric positions depending on there tree structure
    let height = 0;
    let recursiveHelp = (node, level=0, lastWidth=0) => {
      height = height < level? level:height;

      //SJoin - groups of groups
      if (node.sNode instanceof SJoin){
        var width = 0;

        node.forEach((child) => {
          if (child.sNode instanceof SPath || child.sNode instanceof SJoin){
            width += recursiveHelp(child, level + 2, width + lastWidth);
          }
        });

        node.width = width;
        node.pos = new Vector(lastWidth + width/2, level);
        return width

        //SPath - groups of StitchPath geometry
      }else if(node.sNode instanceof SPath){
        node.width = 1;
        node.pos = new Vector(lastWidth + 0.5, level);
        return 1
      }
    }

    if (this.watch != null){
      let width = recursiveHelp(this.watch)

      //Set the viewBox
      this.el.setProps({
        viewBox: `0 -1 ${width} ${height + 2}`
      })
    }
  }
  __renderVNodes(){
    if (this.el == null){
      return
    }
    this.el.innerHTML = '';
    let link_g = this.el.createChild('g');
    let node_g = this.el.createChild('g');
    let vNodes = new VNodes();

    let addNode = (node) => {
      if (node.sNode && (node.sNode instanceof SPath || node.sNode instanceof SJoin)){
        vNodes.node = node;

        //Create node ellipse and attach listeners
        let ellipse = vNodes.ellipse;
        ellipse.onclick = node.onclick;
        ellipse.onmouseover = node.onmouseover;
        ellipse.onmouseleave = node.onmouseleave;
        ellipse.setProps({
          opacity: node.getAttribute('opacity'),
          'pointer-events': node.getAttribute('pointer-events')
        })
        node_g.appendChild(ellipse);

        //If there is a valid parent create a link
        if (node != this.watch){
          link_g.appendChild(vNodes.link);
        }

        //Add a progress indicator if valid
        if (node.progress && node.progress > 0 && node.progress < 0.96){
          node_g.appendChild(vNodes.progress);
        }
      }
    }

    if (this.watch != null){
      addNode(this.watch);
      this.watch.getElementsByTagName('g').forEach((child) => {addNode(child)});
    }
  }
}
