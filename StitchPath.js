//StitchPath
//Params:
//       group: SVGGElelement + SvgPlus
//       sPath: SPath
//       specs:
//







class StitchPath{
  constructor(group, sPath, specs = null){
    this.sPath = sPath;

    this.max_length = 3;
    this.min_length = 1;
    this.max_var = 0.5;
    this.mode = 'computed';
    this.loop = null;
    this.order = null;

    this.unit = 0.1;

    this.path = null
    this.path_2 = null;
    this._pgrs = null;

    this.svg_group = group
    this.specs = specs;
    if (group.getAttribute('type') == 'computed'){
      this.mode = 'computed'
    }
  }

  set specs(specs){
    if (specs instanceof SVGTextElement){
      let str = specs.textContent;
      this['mode'] = str.replace(/{((.|\n|\t|\r)*?)}/, (a, b) => {
        let v = b.split(/,|\n/);
        v.forEach((item) => {
          let key = item.replace(/( |\n|\t|\r|(mm))*/g, '').split(':');
          if (key[0]){
            this[key[0]] = key[1];
          }
        });
        return ''
      }).replace(/( |\n|\t|\r|:)*/g, '');
    }else if(specs === null){
      this.mode = 'computed'
    }else{
      throw `specs can only be a SVGTextElement not ${specs}`
    }
  }

  nextStitch(){
    return this['__next' + this.mode]()
  }
  startStitch(){
    this['__start' + this.mode]()
  }

  get progress(){
    let progress = 0;
    if (this.l && this.end){
      progress = this.l/this.end
    }
    if (this.l_2 && this.end_2){
      progress += this.l_2/this.end_2
      progress /= 2;
    }
    if (this._pgrs != null){
      progress = this._pgrs
    }
    return progress
  }

  //Compute
  computeOnAnimationFrame(callback = false){
    this.startStitch()
    if (this.nextStitch()){
      let nextframe = () => {
        if (this.nextStitch()){
          window.requestAnimationFrame(nextframe)
          this.sPath.progress = this.progress
          this.sPath.focus('follow')
        }else{
          if (callback){
            if(this.loop === 'back'){
              console.log(this.mode);
              if (this.mode == 'SatinColumn'){
                this.sPath.staggerBack()
              }else{
                this.sPath.loopBack()
              }
            }else{
            }

            callback()
          }
        }
      }
      window.requestAnimationFrame(nextframe)
    }
  }



  //Add a stitch
  __addStitch(point){
    this.sPath.push(point)
  }

  //Starts a SatinColumn stitch
  __startSatinColumn(dir = false){
    // Set Paths

    this.path = this.svg_group.children[0]
    this.path_2 = this.svg_group.children[1]

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
    this.path = this.svg_group.children[0]

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

  __startcomputed(){
    let d_string = this.svg_group.children[0].getD();
    this.d_array = d_string.replace(/M/, '').split('L');
    this._pgrs_max = this.d_array.length;
  }

  __nextcomputed(){
    let i = 50;
    while(i > 0){
      let d = this.d_array.shift();
      if (d){
        let s = new Vector(d.split(','))
        this._pgrs = (this._pgrs_max - this.d_array.length)/this._pgrs_max;
        this.__addStitch(s)
        return true
      }else{
        return false
      }
      i--;
    }
  }
}
