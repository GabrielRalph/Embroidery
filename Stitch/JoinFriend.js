class JoinFriend{
  constructor(join_sPath){
    // this.toolBox = document.getElementById('tool-box')
    // this.toolBox.style.setProperty('visibility', 'visible')
    this.join_sPath = join_sPath
    this.join_sPath.children.forEach((item) => {
      if (item.mode != 'computed'){
        console.error('This node contains uncomputed children');
      }
    });

    this.max_length = 40;

    this.temp = null;
    this.path_a = null;
    this.path_b = null;

    this.ll_a = null;
    this.ll_b = null;

    this.output_svg = this.join_sPath.sTree.output_svg;
    this.node_svg = this.join_sPath.sTree.node_svg;

    this.node_focus_pannel = null;
    this.path_focus_pannel = null;
    this.createFocusPannel();

    this.addEventListeners()
  }

  setPaths(path_a, path_b){
    this.path_a = path_a;
    this.path_b = path_b;

    path_a.visualizer_path.setStroke('red', '4')
    path_b.visualizer_path.setStroke('red', '4')
    this.focus(false);
    this.focus(true, path_a);
    this.focus(true, path_b);

    let insert_conex = []

    if (this.path_b.isLoop(this.max_length)){
      toolBox.show('joints');

      //Check paths for all posible joins
      let cur_a = this.path_a.start;
      let cur_b = this.path_b.start;
      let a_i = 0;
      let b_i = 0;

      let next = () => {
        if (cur_a != path_a.end){
          cur_a = cur_a.next;
          a_i ++;
          while(cur_b != this.path_b.end){
            cur_b = cur_b.next;
            b_i++;

            let dist = cur_a.point.distance(cur_b.point);

            if (dist < this.max_length){
              let joint = this.path_focus_pannel.createChild('path', {
                d: `M${cur_a.point}L${cur_b.point}`,
                stroke: `rgb(0, 255, 0)`,
                'stroke-width': '1',
                fill: 'none'
              })
              let test = false;
              for (var i = 1; i < joint.getTotalLength(); i+=2){
                let p = joint.getPointAtLength(i);
                let pina = path_a.visualizer_path.isPointInStroke(p)
                let pinb = path_b.visualizer_path.isPointInStroke(p)
                test = pina && pinb
                if (!test){
                  break;
                }
              }
              if(test){
                insert_conex.push({a: cur_a, b: cur_b, a_i:a_i, b_i:b_i});
              }else{
                this.path_focus_pannel.removeChild(joint)
              }
            }
          }
          cur_b = path_b.start
          b_i = 0;
          window.requestAnimationFrame(next)
        }else{
          path_a.visualizer_path.setStroke('red', '1')
          path_b.visualizer_path.setStroke('red', '1')
          this.chooseP1(insert_conex)
        }
      }
      window.requestAnimationFrame(next)
    }
  }

  chooseP1(data){
    if(data.length == 0){
      toolBox.hide();
      alert('no solution');
      this.destroyFocusPannel();
      return
    }

    //Create Toolbox
    toolBox.list = document.createElement('div');
    toolBox.list.setProps({class: 'points'});
    toolBox.curbox = document.createElement('div');
    toolBox.curbox.setProps({class: 'current-point'});
    toolBox.cur = document.createElement('h1');
    toolBox.curbox.appendChild(toolBox.cur);
    toolBox.tool.appendChild(toolBox.curbox)
    toolBox.tool.appendChild(toolBox.list)

    this.pointer = this.path_focus_pannel.createChild('ellipse',{
      fill: 'blue',
      rx: '3',
      ry: '3'
    })

    let lai = -20;
    let linkf = null;
    data.forEach((link) => {
      if (link.a_i != lai){
        let h3 = document.createElement('h3');
        h3.innerHTML = link.a_i;
        toolBox.list.appendChild(h3)

        toolBox.cur.onclick = () => {
          if (linkf != null){
            let aif = linkf.a_i
            let new_data = [];
            data.forEach((link) => {
              if (link.a_i == aif){
                new_data.push(link)
              }
            });
            this.chooseP2(new_data)
          }
        }

        h3.onclick = () => {
          toolBox.cur.innerHTML = link.a_i;
          linkf = link;
          this.pointer.setProps({
            cx: `${link.a.point.x}`,
            cy: `${link.a.point.y}`
          })
        }
        lai = link.a_i
      }
    });
  }

  chooseP2(data){
    let lbi = -20;
    let linkf = null;
    toolBox.list.innerHTML = '';
    toolBox.cur.innerHTML = '';
    data.forEach((link) => {
      if (link.b_i != lbi){
        let h3 = document.createElement('h3');
        h3.innerHTML = link.b_i;
        toolBox.list.appendChild(h3)

        toolBox.cur.onclick = () => {
          if (linkf != null){
            toolBox.hide();
            this.destroyFocusPannel();
            this.path_a.insertLoop(this.path_b, linkf.a, linkf.b_i)
            this.join_sPath.removeChild(this.path_b);
          }
        }

        h3.onclick = () => {
          toolBox.cur.innerHTML = link.b_i;
          linkf = link;
          this.pointer.setProps({
            cx: `${link.b.point.x}`,
            cy: `${link.b.point.y}`
          })
        }
        lbi = link.b_i
      }
    });
  }

  addEventListeners(sPath = null){
    if (sPath == null){
      this.join_sPath.children.forEach((sPath_i) => {
        this.addEventListeners(sPath_i)
      });
    }else{
      sPath.onmouseover = () => {
        sPath.highlight(true);
      }

      sPath.onmouseleave = () => {
        sPath.highlight(false);
      }

      sPath.onclick = () => {
        this.removeEventListeners(sPath);
        sPath.highlight(true, 'rgb(255,100,100)')
        if (this.temp != null){
          this.setPaths(this.temp, sPath);
        }else{
          this.temp = sPath;
          sPath.onclick = () => {
            this.temp = null;
            this.addEventListeners(sPath)
          }
        }
      }
    }
  }

  removeEventListeners(sPath = null){
    if (sPath == null){
      this.join_sPath.children.forEach((sPath_i) => {
        this.removeEventListeners(sPath_i)
      });
    }else{
      let node = sPath.vNode.el;
      let path = sPath.visualizer_group;

      node.onmousemove = null;
      path.onmousemove = null;
      node.onmouseleave = null;
      path.onmouseleave = null;
      node.onclick = null;
      path.onclick = null;
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

  createFocusPannel(){
    let vb = this.node_svg.getViewBox('outline_path')
    this.node_focus_pannel = this.node_svg.createChild('g')
    this.node_focus_pannel.createChild('path', {
      d: vb,
      fill: 'rgba(255,255,255,0.5)',
    })

    vb = this.output_svg.getViewBox('outline_path')
    this.path_focus_pannel = this.output_svg.createChild('g')
    this.path_focus_pannel.createChild('path', {
      d: vb,
      fill: 'rgba(255,255,255,0.5)',
    })

    this.focus(true)
  }
  destroyFocusPannel(){
    this.removeEventListeners();
    this.focus(false)

    this.node_svg.removeChild(this.node_focus_pannel)
    this.output_svg.removeChild(this.path_focus_pannel)
    this.node_focus_pannel = null;
    this.path_focus_pannel = null;
  }

  focus(bool, sPath = null){
    if (sPath == null){
      this.join_sPath.children.forEach((sPath_i) => {
        this.focus(bool, sPath_i)
      });
    }else{
      let node = sPath.vNode.el;
      let path_group = sPath.visualizer_group;
      let group_parent = sPath.visualizer_parent;

      if(bool){
        this.node_svg.removeChild(node);
        this.node_focus_pannel.appendChild(node);

        group_parent.removeChild(path_group);
        this.path_focus_pannel.appendChild(path_group);
      }else{
        sPath.highlight(false)
        if (this.node_focus_pannel.contains(node)){
          this.node_focus_pannel.removeChild(node);
          this.node_svg.appendChild(node);

          this.path_focus_pannel.removeChild(path_group);
          group_parent.appendChild(path_group);
        }else{
          console.log('s');
        }
      }
    }
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

class ToolBox{
  constructor(el){
    this.el = parseElement(el);
    this.templates = {};

    for (var i = 0; i < this.el.children.length; i++){
      let child = this.el.children[i];
      this.templates[child.id] = child.outerHTML;
    }
    this.el.innerHTML = ''

    this._hidden = true;
  }

  _populate(template_name, data = {}){
    if (template_name in this.templates){
      if (data instanceof Object){
        let html = this.templates[template_name];
        //Populate variables
        html = html.replace(/\${(.*)}/g, (outer, key) => {
          if (key in data){
            return data[key]
          }else{
            throw `There is no field in data with the key, ${key}`
          }
        })
        return html
      }else{
        throw 'Invalid Data: data is not of type "Object"'
      }
    }else{
      throw `${template_name} is not a valid template name`
    }
  }

  show(template_name, data){
    this.el.setStyles({'pointer-events': 'all'})
    this.el.innerHTML = this._populate(template_name, data);
    this.tool = this.el.firstChild;
  }
  hide(){
    this.el.innerHTML = ''
    this.el.setStyles({'pointer-events': 'none'})
  }
}

class SJoin{
  constructor(sTree){
    this.sTree = sTree;
    this.children = [];
    this.parent = null;

    this.el = create('g');
  }

  appendChild(child){
    this.children.push(child);
    this.el.appendChild(child.el);
    child.parent = this;
  }
  removeChild(child){
    let newChildren = []
    this.children.forEach((child_i, i) => {
      if (child_i != child){
        newChildren.push(child_i)
      }
    });
    this.el.removeChild(child.el)
    this.children = newChildren;
  }
}
