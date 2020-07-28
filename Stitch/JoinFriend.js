class JoinFriend{
  constructor(sPaths){
    this.toolBox = document.getElementById('tool-box')
    this.toolBox.style.setProperty('visibility', 'visible')
    this.sPaths = sPaths

    this.sPath = this.sPaths.shift()
    this.sPath_2 = this.sPaths[0];

    this.svg = this.sPath.sTree.output_svg
    this.closest = null;
    this.merger = true;
    this.insert_location = null

    this.cursors = create('g');
    this.svg.appendChild(this.cursors)
    this.addEventListners()
    this.createCursor()
    this.highlight()

  }

  addEventListners(){
    this.svg.onclick = (e) => {
      this.click(e)
    }

    this.svg.onmousemove = (e) => {
      this.mousemove(e)
    }

    this.toolBox.onwheel = (e) => {
      this.wheel(e)
    }

    this.toolBox.onclick = (e) => {
      this.click(e)
    }
  }
  stopEventListners(){
    this.svg.onclick = null
    this.svg.onmousemove = null
  }
  clearCursor(){
    this.svg.removeChild(this.cursors)
    this.toolBox.style.setProperty('visibility', 'hidden')
  }
  createCursor(){

    let avg = this.sPath.start.point
    this.sPath.focus(avg)

    this.cursor = create('ellipse')
    this.cursor.setProps({
      cx: '0',
      cy: '0',
      rx: '5',
      ry: '5',
      fill: 'none',
      stroke: 'green'
    })
    this.cursors.appendChild(this.cursor)
  }

  highlight(){
    this.svg.parentNode.style.setProperty('--hide', 0.2)
    this.sPath.visualizer_path.setProps({
      style: {
        opacity: '1'
      }
    })
    this.sPath_2.visualizer_path.setProps({
      style: {
        opacity: '0.5'
      }
    })
  }
  unhighlight(){
    this.svg.parentNode.style.setProperty('--hide', 1)
    this.sPath.visualizer_path.setProps({
      style: {
        opacity: 'var(--hide)'
      }
    })
    this.sPath_2.visualizer_path.setProps({
      style: {
        opacity: 'var(--hide)'
      }
    })
  }

  wheel(e){
    if(this.closest == null){
      console.log(this.closest);
        this.closest = {
          node: this.sPath.start,
          i: 0,
        }
    }else{
      if (e.deltaY > 0){
        if (this.closest.node == this.sPath.end){
          this.closest.node = this.sPath.start;
          this.closest.i = 0;
        }else{
          this.closest.node = this.closest.node.next;
          this.closest.i ++;
        }
      }else{
        if (this.closest.node == this.sPath.start){
          this.closest.node = this.sPath.start;
          this.closest.i = this.sPath.size - 1;
        }else{
          this.closest.node = this.closest.node.last;
          this.closest.i --;
        }
      }
      this.setCursor(this.closest.node.point)
      this.sPath.focus(this.closest.node.point)
    }
  }

  click(){
    this.unhighlight()
    if (this.merger){
      this.merger = false;

      this.insert_location = this.closest.node

      this.sPath_2 = this.sPath;
      this.sPath = this.sPaths.shift();

      this.cursor.setStroke('#8888FF')
      this.cursor.setFill('#0000FF')
      this.createCursor()
      this.highlight()
    }else{
      this.sPath.rotate(this.closest.i)
      this.sPath_2.insertLoop(this.sPath, this.insert_location)
      this.sPath_2.parent.removeChild(this.sPath)

      if (this.sPaths.length < 1){
        this.stopEventListners()
        this.clearCursor()
        this.sPath_2.parent.set(this.sPath_2)
        this.sPath_2.parent.vNode.update()
      }else{
        this.sPath = this.sPath_2;
        this.merger = true;
        this.highlight()
      }
    }
  }

  mousemove(event){
    let p = this.relMousePoint(event)
    let c = this._closestPoint(p)
    this.closest = c
    this.setCursor(c.node.point)
  }

  relMousePoint(event){
    let m = new Vector(event)
    let vb = this.svg.getAttribute('viewBox').split(' ')
    let vs = new Vector(vb[2], vb[3])
    vb = new Vector(vb[0], vb[1])
    let size = new Vector(this.svg.clientWidth, this.svg.clientHeight);
    let fact = vs.div(size)
    var t = this.svg.getBoundingClientRect().top;
    var l = this.svg.getBoundingClientRect().left;
    let offset = new Vector(l, t)

    let point = m.sub(offset).mul(fact).add(vb)
    return point
  }

  setCursor(p){
    if (this.closest != null){
      let disp = `path-offset: ${this.closest.i}`
      this.toolBox.children[0].innerHTML = disp;
    }
    this.cursor.setProps({
      cx: `${p.x}`,
      cy: `${p.y}`
    })

  }

  _closestPoint(p){
    let i = 0;
    let cur = this.sPath.start
    let d = cur.point.distance(p)
    let soln = {
      node: cur,
      i: 0,
      d: d
    }
    while (cur != this.sPath.end) {
      cur = cur.next;
      i++;
      d = cur.point.distance(p);
      if (d < soln.d){
        soln = {
          node: cur,
          i: i,
          d: d
        }
      }
    }
    return soln
  }
}
