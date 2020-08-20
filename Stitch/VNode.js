class VNode extends STreeNode{
  constructor(node){
    super(node.sTree);
    this.sNode = node;
    this.node_el = this.el.createChild('g')

    this.rad = 0.3;
    this.colors = {
      join: '#ffd400',
      uncomputed: '#ff3765',
      computed: '#2988ff',
      computing: '#9dc9ff'
    }

    this.color = 'join';
    this._pos = new Vector(0,0);
    this._width = 0;

  }

  appendChild(child){
    if (child instanceof VNode){
      this.__appendChild(child);
      this.sNode.__appendChild(child.sNode)
    }else if(child instanceof SPath || child instanceof SJoin){
      this.__appendChild(child.vNode);
      this.sNode.__appendChild(child)
    }
    this.sTree.updateVNodes()
  }
  removeChild(child){
    if (child instanceof VNode){
      this.__removeChild(child);
      this.sNode.__removeChild(child.sNode)
    }else if(child instanceof SPath || child instanceof SJoin){
      this.__removeChild(child.vNode);
      this.sNode.__removeChild(child)
    }
    this.sTree.updateVNodes()
  }
  set(child){
    if (child instanceof VNode){
      this.__set(child);
      this.sNode.__set(child.sNode)
    }else if(child instanceof SPath || child instanceof SJoin){
      this.__set(child.vNode);
      this.sNode.__set(child)
    }
    this.sTree.updateVNodes();
  }


  __update(){
    this.node_el.innerHTML = ''
    if(this.parent != null){
      this.node_el.appendChild(this.link)
    }
    this.node_el.appendChild(this.ellipse)
    this.ellipse_el.onclick = this.onclick
    this.ellipse_el.onmouseover = this.onmouseover
    this.ellipse_el.onmouseleave = this.onmouseleave
    this.node_el.appendChild(this.progress)
    this.node_el.onclick = this.onclick;
    this.node_el.onmouseover = this.onmouseover;
    this.node_el.onmouseleave = this.onmouseleave;
  }


  get ellipse(){
    this._ellipse = create('ellipse')
    this._ellipse.setProps({
      fill: this.color,
      cx: `${this.pos.x}`,
      cy: `${this.pos.y}`,
      rx: `${this.rad}`,
      ry: `${this.rad}`,
    })
    return this._ellipse
  }
  get ellipse_el(){
    return this._ellipse;
  }

  get progress(){
    if (this.sNode.progress < 0.97){
      this._progress = create('path');
      let progress = this.sNode.progress;
      if(this.sNode.progress != null){
        let p1 = new Vector(0, - this.rad);
        let p2 = p1.rotate(Math.PI*2*progress);
        p1 = p1.add(this.pos)
        p2 = p2.add(this.pos)
        this._progress.setD(`M${this.pos}L${p1}A${this.rad},${this.rad},0,${progress>0.5?'1':'0'},1,${p2}`)
        this._progress.setFill(this.colors['computed'])
      }
    }else{
      this._progress = this.ellipse;
    }
    return this._progress
  }
  get link(){
    if(this.parent != null){
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
    }
  }


  set _onclick(callback){
    this.temp_onclick = callback
    if(this.ellipse_el){
      this.ellipse_el.onclick = this.temp_onclick
    }
  }
  set onclick(callback){
    // this._onclick = callback;
    this._onclick = callback;
    this.sNode._onclick = callback;
  }
  get onclick(){
    return this.temp_onclick
  }

  set _onmouseover(callback){
    this.temp_onmouseover = callback
    if(this.ellipse_el){
      this.ellipse_el.onmouseover = this.temp_onmouseover
    }
  }
  set onmouseover(callback){
    this._onmouseover = callback;
    this.sNode._onmouseover = callback;
  }
  get onmouseover(){
    return this.temp_onmouseover
  }

  set _onmouseleave(callback){
    this.temp_onmouseleave = callback
    if(this.ellipse_el){
      this.ellipse_el.onmouseleave = this.temp_onmouseleave
    }
  }
  set onmouseleave(callback){
    this._onmouseleave = callback;
    this.sNode._onmouseleave = callback;
  }
  get onmouseleave(){
    return this.temp_onmouseleave
}

  removeEventHandlers(){
    if (this.ellipse_el){
      this.ellipse_el.onclick = null;
      this.ellipse_el.onmouseover = null;
      this.ellipse_el.onmouseleave = null;
    }
    this._onclick = null;
    this._onmouseover = null;
    this._onmouseleave = null;
    this.sNode.__removeEventHandlers();
  }


  setColor(color){
    if (this.el){
      this.el.setFill(color)
    }
    this._update()
  }
  get mode_color(){
    return this.colors[this.sNode.mode]
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
