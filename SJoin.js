class SJoin extends SNode{
  constructor(group, sTree){
    super(group, sTree)
    this.onclick = () => {
      this[this.mode]()
    }
    let mode = this.mode;
    this.max_length = 20;
    this.tol = 5
  }

  get mode(){
    let mode = ''
    if (!this.isComputed()){
      mode = 'computeAll'
    }else if(this.sPaths.length == this.el.getElementsByTagName('g').length){
      if (this.sTree.root_el == this.el){
        mode = 'export'
      }else{
        mode = 'join'
      }
    }else{
      let only_g = true;
      this.forEach((child) => {
        if (child.sNode){
          only_g &= (child.sNode instanceof SJoin)
        }
      });
      if (only_g){
        mode = 'flatten'
      }else{
        mode = 'temp'
      }
    }
    this.el.mode = mode;
    return mode
  }

  set mode(val){
    this.el.mode = val
  }

  flatten(){
    let groups = this.el.getElementsByTagName('g');
    let sPaths = this.sPaths;
    this.el.innerHTML = '';
    sPaths.forEach((sPath) => {
      this.el.appendChild(sPath)
    });
    this.___updateAllSJoinModes()
  }
  ___updateAllSJoinModes(){
    let mode = this.sTree.root_el.sNode.mode;
    let groups = this.sTree.root_el.getElementsByTagName('g');
    for (var i = 0; i < groups.length; i++){
      if (groups[i].sNode instanceof SJoin){
        let mode = groups[i].sNode.mode;
      }
    }
  }
  get sPaths(){
    let sPaths = []
    let groups = this.el.getElementsByTagName('g');
    groups.forEach((group) => {
      if ((!group.sNode && (this.sTree.__getSNodeType(group) == 'SPath'))||(group.sNode && group.sNode instanceof SPath)){
        sPaths.push(group)
      }
    });
    return sPaths;
  }

  isComputed(){
    let computed = true;
    let sPaths = this.sPaths;
    sPaths.forEach((sPath) => {
      computed &= (sPath.mode == 'computed');
    });
    return computed;
  }

  computeAll(){
    this.sPaths.forEach((sPath) => {
      sPath.sNode.compute(() => {
        this.___updateAllSJoinModes()
      });
    });
  }

  export(){
    let sPaths = this.sPaths;
    switch (sPaths.length) {
      case 0:
        throw `Error calling export:\nEmpty node`
        break;
      case 1:
        console.log('cam');
        break;
      default:
        this._arrange(sPaths)
        this.animate()
    }
  }

  _arrange(sPaths, i = 0){
    let a = sPaths[i];
    let c = sPaths[i + 1];
    if (i + 2 >= sPaths.length){
      if (i == 0){
        this._rotateBothToShortestPath(a.sNode, c.sNode);
      }else{
        this._rotateToShortestPath(a.sNode, c.sNode);
      }
    }else{
      let b = sPaths[i + 2];
      if (i == 0){
        this._rotateBothToShortestPath(a.sNode, b.sNode);
      }else{
        this._rotateToShortestPath(a.sNode, b.sNode);
      }
      this._rotateToShortestPathToLink(a.sNode,b.sNode,c.sNode);
    }

    if (i + 3 < sPaths.length){
      this._arrange(sPaths, i + 2)
    }
  }

  _rotateToShortestPath(a, b){
    let stp = a.end.point;
    let min_d = Infinity;
    let min_d_i = 0;
    b.forEveryStitch((cur, i) => {
      let d = stp.distance(cur.point);
      if (d < min_d){
        min_d = d;
        min_d_i = i;
      }
    })
    b.rotate(min_d_i)
  }
  _rotateBothToShortestPath(a, b){
    let min_d = Infinity;
    let min_d_i_a = 0;
    let min_d_i_b = 0;
    a.forEveryStitch((cur_a, i_a) => {
      b.forEveryStitch((cur_b, i_b) => {
        let d = cur_a.point.distance(cur_b.point);
        if (d < min_d){
          min_d = d;
          min_d_i_a = i_a;
          min_d_i_b = i_b;
        }
      })
    })
    a.rotate(min_d_i_a);
    b.rotate(min_d_i_b);
  }

  _rotateToShortestPathToLink(a, b, c){
    let min_d = Infinity;
    let min_d_i_c = 0;
    c.forEveryStitch((cur_c, i_c) => {
      let d = cur_c.point.distToLine(a.end.point, b.start.point);
      if (d < min_d){
        min_d = d;
        min_d_i_c = i_c;
      }
    })
    c.rotate(min_d_i_c);
  }

  animate(){
    let sPaths = this.sPaths;
    let i = 0;
    let cur_path = sPaths[i].sNode;
    let cur_s = cur_path.start;

    let p = this.sTree.el.createChild('path',{
      stroke: 'blue',
      'stroke-width': '2',
      fill: 'none'
    })

    let next = () => {
      p.addPoint(cur_s.point)
      cur_s = cur_s.next;
      if (cur_s == cur_path.end || cur_s.next == null){
        p.addPoint(cur_s.point)
        i++;
        if (i < sPaths.length){
          cur_path = sPaths[i].sNode;
          cur_s = cur_path.start;
          window.requestAnimationFrame(next)
        }else{
          let exp = new DSTExporter();
          exp.exportSJoin(this);
          exp.download();
        }
      }else {
        window.requestAnimationFrame(next)
      }
    }
    window.requestAnimationFrame(next)
  }

  join(sPaths = this.sPaths){
    if (sPaths.length > 1){
      let path_a = sPaths.shift();
      let path_b = sPaths.shift();
      this.__findLinks(path_a.sNode, path_b.sNode, (links) => {

        //No link found
        if (links.length == 0){
          sPaths.unshift(path_a);
          if (sPaths.length > 1){
            this.join(sPaths);
          }else{
            alert('No Solutions');

          }

          //Links Found
        }else{
          //Insert loop
          let linkf = links[links.length -1];
          path_a.sNode.insertLoop(path_b.sNode, linkf.a, linkf.b_i)

          if ( this.sPaths.length > 1){
            this.join(this.sPaths)
          }else{
            path_a.sNode.animate();
            this.___updateAllSJoinModes()
          }
        }

      })
    }else{
      this.tol += 1;
      throw `No solution`
    }

  }
  ___isOverlaping(path_a, path_b, joint){
    for (var i = 1; i < joint.getTotalLength(); i+=2){
      let p = joint.getPointAtLength(i);
      let pina = path_a.visualizer_path.isPointInStroke(p)
      let pinb = path_b.visualizer_path.isPointInStroke(p)

      if (!(pina && pinb)){
        return false
      }
    }
    return true
  }
  __findLinks(path_a, path_b, callback){

      let link_finder_group = this.sTree.el.createChild('g')
      path_a.el.setStroke('red',`${this.tol}`);
      path_b.el.setStroke('red',`${this.tol}`);

      //Check paths for all posible joins
      let cur_a = path_a.start;
      let cur_b = path_b.start;
      let a_i = 0;
      let b_i = 0;

      let links = [];
      let next = () => {
        if (cur_a != path_a.end){
          cur_a = cur_a.next;
          a_i ++;
          while(cur_b != path_b.end){
            cur_b = cur_b.next;
            b_i++;

            let dist = cur_a.point.distance(cur_b.point);

            if (dist < this.max_length){

              let joint = link_finder_group.createChild('path', {
                d: `M${cur_a.point}L${cur_b.point}`,
                stroke: `rgb(0, 255, 0)`,
                'stroke-width': '1',
                fill: 'none'
              })

              if(this.___isOverlaping(path_a, path_b, joint)){
                links.push({a: cur_a, b: cur_b, a_i:a_i, b_i:b_i});
              }
            }
          }
          cur_b = path_b.start
          b_i = 0;
          window.requestAnimationFrame(next)
        }else{
          path_a.el.setStroke('red',`1`);
          if (links.length == 0){
            path_b.el.setStroke('red',`1`);
          }
          this.sTree.el.removeChild(link_finder_group)
          if ( callback instanceof Function){
            callback(links)
          }
        }
      }
      window.requestAnimationFrame(next)
  }
}
