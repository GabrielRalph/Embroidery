class VNode{
  constructor(sPath){
    this.sPath = sPath;
    this.svg = sPath.sTree.node_svg;
    this._pos = null;
    this._width = 0;
    this.rad = 0.3;
    this.colors = {
      join: '#ffd400',
      uncomputed: '#ff3765',
      computed: '#2988ff',
      computing: '#9dc9ff'
    }
  }

  setColor(color){
    if (this.el){
      this.el.setFill(color)
    }
  }


  onClick(){
    let mode = this.sPath.mode;
    if (mode == 'uncomputed'){
      this.sPath.compute(() => {
        this.sPath.sTree.VNodeRender()
      })
    }else if (mode == 'join'){
      if (this.sPath.isComputed()){
        this.setColor('#FFFFFF')
        let join = new JoinFriend(this.sPath)
      }else{
        this.sPath.computeAll()
      }
    }else if(mode == 'computed'){
      tools.style.setProperty('visibility', 'visible')
      let exporter = new DSTExporter(this.sPath.sTree.download_element)
      exporter.exportSPath(this.sPath)
    }
  }

  update(){
    if (this.el){
      this.el.innerHTML = ''
      this.el.appendChild(this.ellipse)
      this.el.appendChild(this.progress)
      this.el.onclick = () => {
        this.onClick()
      }
    }
  }

  get node(){
    this.el = create('g')
    this.update();
    return this.el
  }

  get ellipse(){
    let ellipse = create('ellipse')
    ellipse.setProps({
      fill: this.mode_color,
      cx: `${this.pos.x}`,
      cy: `${this.pos.y}`,
      rx: `${this.rad}`,
      ry: `${this.rad}`,
    })
    return ellipse
  }
  get progress(){
    if (this.sPath.progress < 0.97){
      let path = create('path');
      let progress = this.sPath.progress;
      if(this.sPath.progress != null){
        let p1 = new Vector(0, - this.rad);
        let p2 = p1.rotate(Math.PI*2*progress);
        p1 = p1.add(this.pos)
        p2 = p2.add(this.pos)
        path.setD(`M${this.pos}L${p1}A${this.rad},${this.rad},0,${progress>0.5?'1':'0'},1,${p2}`)
        path.setFill(this.colors['computed'])
      }
      return path
    }else{
      return this.ellipse
    }
  }

  link(parent){
    let c1 = this.pos.sub(new Vector(0, 1))
    let c2 = parent.pos.add(new Vector(0, 1))
    return `<path d = 'M${this.pos}C${c1},${c2},${parent.pos}' fill = 'none' stroke = '#04a2ff' stroke-width = '0.05'/>`
  }

  get mode_color(){
    return this.colors[this.sPath.mode]
  }
  set pos(pos){
    this._pos = pos;
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
}
