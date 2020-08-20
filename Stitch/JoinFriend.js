class LoopInsert{
  constructor(sJoin){
    this.sJoin = sJoin;
    this.sTree = sJoin.sTree;
    this.toolBox = this.sTree.toolBox;
    this.toolBox.hide();
    this.max_length = 30;

    //Add sJoin to the workSet
    this.workSet = new WorkSet(this.sTree);
    this.workSet.appendNode(sJoin)

    this.sJoin.onclick = () => {
      console.log('x');
      this.__end()
    }
    this.select_first_sPath();
  }

  select_first_sPath(){
    //Turn hover graphics on
    this.sJoin.hover(true)
    this.sJoin._hover(false)

    this.sJoin.children.forEach((sPath)=>{
      sPath.onclick = () => {
        this.select_second_sPath(sPath)
      }
    });
  }

  set ondone(callback){
    this._ondone = callback
  }
  get ondone(){
    return this._ondone
  }

  select_second_sPath(sPath_a){
    sPath_a.hover(false)
    sPath_a.highlight(true)

    this.sJoin.children.forEach((sPath)=>{
      if(sPath == sPath_a){
        sPath_a.onclick = () => {
          this.select_first_sPath()
        }
      }else{
        sPath.onclick = () => {
          this.compute_possible_links(sPath_a, sPath)
        }
      }
    });
  }

  compute_possible_links(path_a, path_b){


    if ( path_b.isLoop(this.max_length) ){
      this.path_a = path_a;
      this.path_b = path_b;

      this.workSet.removeNode('all');
      this.sJoin.hover(false);
      this.sJoin.highlight(false);
      path_a.highlight(true);
      this.workSet.appendNode(path_a)
      this.workSet.appendNode(path_b)

      this.toolBox.show('joints');

      path_a.setStroke('red', '4')
      path_b.setStroke('red', '4')

      //Check paths for all posible joins
      let cur_a = this.path_a.start;
      let cur_b = this.path_b.start;
      let a_i = 0;
      let b_i = 0;

      let insert_conex = [];

      let next = () => {
        if (cur_a != path_a.end){
          cur_a = cur_a.next;
          a_i ++;
          while(cur_b != this.path_b.end){
            cur_b = cur_b.next;
            b_i++;

            let dist = cur_a.point.distance(cur_b.point);

            if (dist < this.max_length){

              let joint = this.workSet.el_paths.createChild('path', {
                d: `M${cur_a.point}L${cur_b.point}`,
                stroke: `rgb(0, 255, 0)`,
                'stroke-width': '1',
                fill: 'none'
              })

              if(this.__isOverlaping(joint)){
                insert_conex.push({a: cur_a, b: cur_b, a_i:a_i, b_i:b_i});
              }else{
                this.workSet.el_paths.removeChild(joint)
              }
            }
          }
          cur_b = path_b.start
          b_i = 0;
          window.requestAnimationFrame(next)
        }else{
          path_a.setStroke('red', '1')
          path_b.setStroke('red', '1')
          this.chooseP1(insert_conex)
        }
      }
      window.requestAnimationFrame(next)
    }else{
      alert('The second path is not a loop')
    }
  }

  chooseP1(data){
    if(data.length == 0){
      alert('No solutions found')
      this.__end()
    }

    //Create Toolbox
    this.toolBox.list = document.createElement('div');
    this.toolBox.list.setProps({class: 'points'});
    this.toolBox.curbox = document.createElement('div');
    this.toolBox.curbox.setProps({class: 'current-point'});
    this.toolBox.cur = document.createElement('h1');
    this.toolBox.curbox.appendChild(this.toolBox.cur);
    this.toolBox.tool.appendChild(this.toolBox.curbox)
    this.toolBox.tool.appendChild(this.toolBox.list)



    let lai = -20;
    let linkf = null;
    data.forEach((link) => {
      if (link.a_i != lai){
        let h3 = document.createElement('h3');
        h3.innerHTML = link.a_i;
        this.toolBox.list.appendChild(h3)

        this.toolBox.cur.onclick = () => {
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
          this.toolBox.cur.innerHTML = link.a_i;
          this.workSet.point(link.a)
          linkf = link;
        }
        lai = link.a_i
      }
    });
  }

  chooseP2(data){
    let lbi = -20;
    let linkf = null;
    this.toolBox.list.innerHTML = '';
    this.toolBox.cur.innerHTML = '';
    data.forEach((link) => {
      if (link.b_i != lbi){
        let h3 = document.createElement('h3');
        h3.innerHTML = link.b_i;
        this.toolBox.list.appendChild(h3)

        this.toolBox.cur.onclick = () => {
          if (linkf != null){
            this.workSet.remove()
            this.sJoin.hover(false)
            this.sJoin.highlight(false)
            this.sJoin.removeEventHandlers();
            this.toolBox.hide();

            this.path_a.insertLoop(this.path_b, linkf.a, linkf.b_i)
            // console.log(this.path_b);
            this.sJoin.removeChild(this.path_b);
            this.ondone();
          }
        }

        h3.onclick = () => {
          this.toolBox.cur.innerHTML = link.b_i;
          linkf = link;
          this.workSet.point(link.b)
        }
        lbi = link.b_i
      }
    });
  }

  __end(){
    this.toolBox.hide()
    this.sJoin.hover(false)
    this.sJoin.highlight(false)
    this.sJoin.removeEventHandlers();
    this.workSet.remove()
    this.ondone()
  }

  __isOverlaping(joint){
    for (var i = 1; i < joint.getTotalLength(); i+=2){
      let p = joint.getPointAtLength(i);
      let pina = this.path_a.visualizer_path.isPointInStroke(p)
      let pinb = this.path_b.visualizer_path.isPointInStroke(p)

      if (!(pina && pinb)){
        return false
      }
    }
    return true
  }
}
class MovePath{

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
