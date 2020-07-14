

class StitchPathx{
  constructor(group){
    this.sPath = new SPath();


    this.max_length = 3;
    this.min_length = 1;
    this.max_var = 0.5;
    this.mode = 'RunningStitch';
    this.loop = null;
    this.order = null;

    this.unit = 0.1;

    this.path = null
    this.path_2 = null;

    this.svg_group = group
    this.assignAttributes()
  }



  addVisualizer(svg){
    this.sPath.setVisualizerSvg(svg)
  }

  assignAttributes(){
    if (this.svg_group.hasAttribute('mode')){
      this.mode = this.svg_group.getAttribute('mode')
    }
    if (this.svg_group.hasAttribute('loop')){
      this.loop = this.svg_group.getAttribute('loop')
    }
    if (this.svg_group.hasAttribute('order')){
      this.order = this.svg_group.getAttribute('order')
    }
    if (this.svg_group.hasAttribute('max_length')){
      this.max_length = parseFloat(this.svg_group.getAttribute('max_length'))
    }
    if (this.svg_group.hasAttribute('min_length')){
      this.min_length = parseFloat(this.svg_group.getAttribute('min_length'))
    }
    if (this.svg_group.hasAttribute('max_var')){
      this.max_var = parseFloat(this.svg_group.getAttribute('max_var'))
    }
    if (this.svg_group.hasAttribute('max_var')){
      this.max_var = parseFloat(this.svg_group.getAttribute('max_var'))
    }
    if (this.svg_group.hasAttribute('stroke')){
      this.sPath.color = this.svg_group.getAttribute('stroke')
    }
  }

  nextStitch(){
    return this['__next' + this.mode]()
  }

  startStitch(){
    this['__start' + this.mode]()
  }

  computeOnAnimationFrame(callback = false){
    this.startStitch()
    if (this.nextStitch()){
      let nextframe = () => {
        if (this.nextStitch()){
          window.requestAnimationFrame(nextframe)
        }else{
          if (callback){
            if(this.loop == 'back'){
              this.sPath.loopBack()
            }

            callback(this.sPath)
          }
        }
      }
      window.requestAnimationFrame(nextframe)
    }
  }

  __addStitch(point){
    this.sPath.push(point)
  }


  //Starts a SatinColumn stitch
  __startSatinColumn(dir = false){
    // Set Paths
    this.path = this.svg_group.getElementsByTagName('path')[0]
    this.path_2 = this.svg_group.getElementsByTagName('path')[1]

    // Setup end points
    this.end = this.path.getTotalLength()
    this.end_2 = this.path_2.getTotalLength()

    // Setup Increments
    let avg_end = (this.end + this.end_2) / 2;
    let stitch_num = avg_end / (this.max_length / this.unit);
    this.inc = this.end / stitch_num;
    this.inc_2 = (dir?-1:1) * this.end_2 / stitch_num;
    // Setup length counters
    this.l = 0
    this.l_2 = dir?this.end_2:0;

    // Direction Correction
    this.end_2 *= dir?0:1

    // Get initial points
    this.s = new Vector(this.path.getPointAtLength(this.l))
    this.s_2 = new Vector(this.path_2.getPointAtLength(this.l_2))

    //Auto direction Correction
    let s_2_opp = new Vector(this.path_2.getPointAtLength(this.end_2))
    let d = this.s.distance(this.s_2)
    let d_opp = this.s.distance(s_2_opp)
    if (d > d_opp){
      this.__startSatinColumn(!dir)
    }else{

      //Add last stitches if direction is correct
      this.__addStitch(this.s)
      this.__addStitch(this.s_2)
    }
  }

  //Computes the next stitch point in a SatinColumn
  __nextSatinColumn(){

    // Increment length counters
    this.l += this.inc;
    this.l_2 += this.inc_2;

    // Get the points at the length of the new length counters
    let s = new Vector(this.path.getPointAtLength(this.l))
    let s_2 = new Vector(this.path_2.getPointAtLength(this.l_2))

    //Get the average perpendicular distance from the new points to the line formed by the old ones
    let d = (s.distToLine(this.s, this.s_2) + s_2.distToLine(this.s, this.s_2))/2;

    this.s = s;
    this.s_2 = s_2;

    //If distance is greater than the min_length factor then add the points
    if(d > (this.min_length / this.unit)){
      this.__addStitch(this.s)
      this.__addStitch(this.s_2)
    }

    //Return false if the whole line has been computed
    if (this.l > this.end){
      return false
    }else{
      return true
    }
  }

  //Starts a RunningStitch
  __startRunningStitch(){

    //Set Path
    this.path = this.svg_group.getElementsByTagName('path')[0]

    //Set length counter and end length
    this.l = 0
    this.end = this.path.getTotalLength()

    //Add the first point
    this.s = new Vector(this.path.getPointAtLength(this.l))
    this.__addStitch(this.s)
  }

  //Computes the next running stitch
  __nextRunningStitch(){

    let dl = this.max_length/this.unit;
    let di = this.min_length/this.unit;
    let mr = this.max_var/this.unit;

    if (this.l + dl > this.end){
      this.l = this.end
      this.s = new Vector(this.path.getPointAtLength(this.end))
      this.__addStitch(this.s)
      return false
    }


    // Get a stitch point, s, with a distance of max_length away from the last
    // this will be our initial guess for the next stitch point
    let s_i = new Vector(this.path.getPointAtLength(this.l + dl));


    // Get all the stitch points between the last stitch point and our guess for
    // the next stitch point, s_i, with a spacing of min_length between each other
    for (var i = di; i < dl; i += di){
      let s = new Vector(this.path.getPointAtLength(this.l + i))

      // Get the perpendicular distance from the current point, s to the line
      // between the last point and the guess for the next point
      let d = s.distToLine(this.s, s_i)

      // As we look at the points, d will increase or remain 0. When the d of the
      // point s is just greater than the variance threshold, we set the next stitch
      if (d > mr){
        this.l += i
        this.s = s;
        this.__addStitch(this.s)
        return true
      }
    }

    // If the d never exceeds the threshold the next stitch will be our inititial guess
    this.l += dl
    this.s = s_i
    this.__addStitch(this.s)
    return true
  }
}

class StitchNode{
  constructor(mgmt, value = 'join'){
    this.value = value
    this.children = [];
    this.mgmt = mgmt
  }

  addChild(child){
    this.children.push(child)
  }

  set(groups){
    let children = groups.children;

    for (var i = 0; i < children.length; i++){

      let child = children[i];
      let mode = child.getAttribute('mode');

      if (mode == 'join'){
        let subtree = new StitchNode(mgmt)
        subtree.set(child);
        this.addChild(subtree);


      }else if (mode == 'RunningStitch'||mode == 'SatinColumn') {
        let stitchPath = new StitchPath(child)
        let node = new StitchNode(this.mgmt, stitchPath)
        this.mgmt.size ++;
        stitchPath.addVisualizer(this.mgmt.render_svg)
        this.addChild(node)
      }
    }
  }
  computeAll(){
    this.mgmt.reset_loaded()
    this.__computeAllHelp();
  }

  __computeAllHelp(){
    if (this.value == 'join'){
      //For each child
      for (var i = 0; i < this.children.length; i++){
        let child = this.children[i];
        child.__computeAllHelp()
      }
    }else if (this.value instanceof StitchPath){
      this.value.computeOnAnimationFrame(() => {
        this.mgmt.add_loaded();
      });
    }
  }

  joinPaths(){
    if (this.children.length == 0){
      return this.value.sPath
    }else{
      let firstPath = this.children[0].joinPaths()
      for (var i = 1; i < this.children.length; i++){
        let child = this.children[i]
        let nextPath = child.joinPaths()

        // if (child.value.order == 'true' && this.mgmt.offset instanceof Stitch){
        //   this.mgmt.offset = firstPath.join(nextPath, this.mgmt.offset)
        //   console.log('x');
        // }else{
          this.mgmt.offset = firstPath.join(nextPath)
        // }
        nextPath.removeVisualizer()
      }
      return firstPath
    }
  }
}

class StitchMGMT{
  constructor(render_svg){
    this.render_svg = render_svg
    this.root = null
    this.size = 0;
    this._loaded = 0;
    this.onload = null
    this.offset = null
  }

  add_loaded(val = 1){
    this._loaded += val;
    if (this.size == this._loaded){
      let sPath = this.convert_to_sPath()
      this.onload(sPath)
    }
  }

  convert_to_sPath(){
    let recursiveHelp = (node) => {
      let root_sPath = node.value.sPath
      node.children.forEach((child) => {
        root_sPath.appendChild(recursiveHelp(child))
      })
      return root_sPath
    }
    return recursiveHelp(this.root)
  }

  reset_loaded(){
    this._loaded = 0;
  }

  set(groups){
    this.root = new StitchNode(this)
    this.root.set(groups)
  }
  computeAll(callback){
    if (callback instanceof Function){
      this.onload = callback
    }
    this.root.computeAll()
  }
}
//  Node graph is an object that handles rendering tree's of nodes
class NodeGraphs{

  /*
    Params:
      jsonTree: a tree represented as a json object in the format
        node = {
          "a": interger_value,
          "b": interger_value,
          children: [node1, node2, ...] or [] if leaf,
        }
  */
  constructor(jsonTree, id, node_margin = {x: 20, y:100}, node_size = 50){
    this.tree = jsonTree;
    this.margin = node_margin;
    this.size = node_size;
    this.html = '';
    this.height = 0;
    this.width = 0;
    this.renderNodes(id)
  }


  // rendres nodes to the element with id = elementID

  renderNodes(elementID){
    this.width = this.positionNodes(this.tree);
    this.html = this.drawHTMLnodes(this.tree);
    this.html = '<svg style = "margin: '+ this.margin.y/2 +'px 0"  width = "'+(this.width*(this.margin.x + this.size) + this.size)+'" height = "'+(this.height*(this.margin.y + this.size)+ this.size)+'" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">'+this.html+'</svg>';
    document.getElementById(elementID).innerHTML = this.html;
    this.height = 0;
  }

  // Creates the svg path for a single node and a connection to its parent
  drawSVGnode(node, parent){
    var path = '<svg onclick = "testyFunction({x:'+node.x+', y:'+node.y+', a:'+node.a+', b:'+node.b+'})" width = "'+this.size+'" height = "'+this.size+'" x = "'+node.x*(this.size + this.margin.x)+'" y = "'+node.y*(this.size + this.margin.y)+'" id = "node"><path d = "m 0 '+this.size/2+' l '+this.size+' 0 a '+this.size/2+' '+this.size/2+' 0 0 1 -'+this.size+' 0"/><path d = "m '+this.size+' '+this.size/2+' l -'+this.size+' 0 a '+this.size/2+' '+this.size/2+' 0 0 1 '+this.size+' 0"/><text x = "'+this.size/2+'" y = "'+this.size*0.3+'" dominant-baseline="middle" text-anchor="middle">'+node.a+'</text><text x = "'+this.size/2+'" y = "'+this.size*0.75+'" dominant-baseline="middle" text-anchor="middle">'+node.b+'</text></svg>\n'
    if(parent){
      path += '<path d = "M '+(parent.x*(this.size + this.margin.x) + this.size/2)+' '+(parent.y*(this.size + this.margin.y) + this.size)+' C '+(parent.x*(this.size + this.margin.x) + this.size/2)+' '+((parent.y*(this.size + this.margin.y) + node.y*(this.size + this.margin.y) + this.size)/2)+', '+(node.x*(this.size + this.margin.x)+this.size/2)+' '+((parent.y*(this.size + this.margin.y) + node.y*(this.size + this.margin.y) + this.size)/2)+', '+(node.x*(this.size + this.margin.x)+this.size/2)+' '+node.y*(this.size + this.margin.y)+'" stroke = "red" fill = "transparent" stroke-width = "'+this.size/15+'px"/>'
    }
    return path
  }


  //Creates svg node and parent connection paths for each node in the tree
  drawHTMLnodes(tree, parent){
    if(tree.children.length > 0){
      var html = ''
      for(var i in tree.children){
        html += this.drawHTMLnodes(tree.children[i], tree);
      }
      return html + this.drawSVGnode(tree, parent);
    }else{
      console.log();
      return this.drawSVGnode(tree, parent);
    }
  }

  //Calculates the horizontal (x) and vertical (y) position to render tree with children going down from parents
  positionNodes(tree, level=0, lastWidth = 0){

    this.height = this.height < level? level:this.height;
    if(tree.children.length > 0){
      var width = 0;
      for(var i in tree.children){
        width += this.positionNodes(tree.children[i], level + 1, width + lastWidth);
      }
      tree.width = width;
      tree.y = level;
      tree.x = lastWidth + width/2;
      return width
    }else{
      tree.y = level;
      tree.width = 1;
      tree.x = lastWidth + 0.5;
      return 1
    }
  }
}
