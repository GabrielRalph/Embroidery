let design = document.getElementById('design')
let svg = document.getElementById('test')
let cam = new EmbroideryCam(svg)

let path = document.getElementById('line_1')

let test_path3 = document.getElementById('l3')

// cam.runningStitch(test_path2)
v1 = new Vector(100, 100)
v2 = new Vector(22, 14)
// cam.header({label: 'MYCAM'})
let st = cam.camPaths(design)
let buff = cam.export()
// let bn = cam.decToDst(v2, 'stitch')
// console.log(cam.dstToDec(bn[0], bn[1], bn[2]))
// let test = {
//   colorChanges: 1,
//   label: "MYCAM",
//   maxx: 6,
//   maxy: 7,
//   minx: -6,
//   miny: -7,
//   stitchCount: 3085
// }
//
// let head = new Header(test)
// console.log(head.buffer);
//

// console.log(buff);
// let ls = st[0]
// let ds = []
// for (var i = 1; i < st.length; i++){
//   ds.push(st[i].sub(ls))
//   ls = st[i]
// }
// console.log(st);
let decToDst = (x, y, mode) => {
  let b1 = 0;
  let b2 = 0;
  let b3 = 0;

  if(mode == 'jump'){
    b3 |= (1<<7)
  }else if(mode == 'color'){
    b3 |= (1<<7)|(1<<6)
  }

  let y_sign = y/Math.abs(y);
  y = Math.abs(y)

  //Set Y +-1
  let t1 = y%3;
  if(t1 == 1){
    if(y_sign > 0){
      b1 |= (1<<7)
    }else{
      b1 |= (1<<6)
    }
  }else if(t1 == 2){
    if(y_sign > 0){
      b1 |= (1<<6)
    }else{
      b1 |= (1<<7)
    }
  }

  //Set Y +- 9
  let t9 = Math.ceil(((y - 4)%27)/9);
  if(t9 == 1){
    if(y_sign > 0){
      b1 |= (1<<5)
    }else{
      b1 |= (1<<4)
    }
  }else if(t9 == 2){
    if(y_sign > 0){
      b1 |= (1<<4)
    }else{
      b1 |= (1<<5)
    }
  }

  //Set Y +- 3
  let t3 = Math.ceil(((y - 1)%9)/3);
  if(t3 == 1){
    if(y_sign > 0){
      b2 |= (1<<7)
    }else{
      b2 |= (1<<6)
    }
  }else if(t3 == 2){
    if(y_sign > 0){
      b2 |= (1<<6)
    }else{
      b2 |= (1<<7)
    }
  }

  //Set Y +- 27
  let t27 = Math.ceil(((y - 13)%81)/27);
  if(t27 == 1){
    if(y_sign > 0){
      b2 |= (1<<5)
    }else{
      b2 |= (1<<4)
    }
  }else if(t27 == 2){
    if(y_sign > 0){
      b2 |= (1<<4)
    }else{
      b2 |= (1<<5)
    }
  }

  //Set Y +- 81
  let t81 = Math.ceil(((y - 40)%243)/81);
  if(t81 == 1){
    if(y_sign > 0){
      b3 |= (1<<5)
    }else{
      b3 |= (1<<4)
    }
  }else if(t81 == 2){
    if(y_sign > 0){
      b3 |= (1<<4)
    }else{
      b3 |= (1<<5)
    }
  }


  let x_sign = x/Math.abs(x);
  x = Math.abs(x)

  //Set Y +-1
  t1 = x%3;
  if(t1 == 1){
    if(x_sign > 0){
      b1 |= (1<<0)
    }else{
      b1 |= (1<<1)
    }
  }else if(t1 == 2){
    if(x_sign > 0){
      b1 |= (1<<1)
    }else{
      b1 |= (1<<0)
    }
  }

  //Set Y +- 9
  t9 = Math.ceil(((x - 4)%27)/9);
  if(t9 == 1){
    if(x_sign > 0){
      b1 |= (1<<2)
    }else{
      b1 |= (1<<3)
    }
  }else if(t9 == 2){
    if(x_sign > 0){
      b1 |= (1<<3)
    }else{
      b1 |= (1<<2)
    }
  }

  //Set Y +- 3
  t3 = Math.ceil(((x - 1)%9)/3);
  if(t3 == 1){
    if(x_sign > 0){
      b2 |= (1<<0)
    }else{
      b2 |= (1<<1)
    }
  }else if(t3 == 2){
    if(x_sign > 0){
      b2 |= (1<<1)
    }else{
      b2 |= (1<<0)
    }
  }

  //Set Y +- 27
  t27 = Math.ceil(((x - 13)%81)/27);
  if(t27 == 1){
    if(x_sign > 0){
      b2 |= (1<<2)
    }else{
      b2 |= (1<<3)
    }
  }else if(t27 == 2){
    if(x_sign > 0){
      b2 |= (1<<3)
    }else{
      b2 |= (1<<2)
    }
  }

  //Set Y +- 81
  t81 = Math.ceil(((x - 40)%243)/81);
  if(t81 == 1){
    if(x_sign > 0){
      b3 |= (1<<2)
    }else{
      b3 |= (1<<3)
    }
  }else if(t81 == 2){
    if(x_sign > 0){
      b3 |= (1<<3)
    }else{
      b3 |= (1<<2)
    }
  }

  return {b1: b1, b2: b2, b3: b3}
}
//BYTE	7	    6	   5	   4  	3	    2   	1    	0
//1	    y+1	  y-1	 y+9	 y-9	x-9	  x+9	  x-1	  x+1
//2	    y+3	  y-3	 y+27	 y-27	x-27	x+27	x-3	  x+3
//3	    c0	  c1	 y+81	 y-81	x-81	x+81	set	  set


dstToDec = (b1, b2, b3) => {
  let x = b(b1, 0) - b(b1, 1) + 9*b(b1, 2) - 9*b(b1, 3) + 3*b(b2, 0) -3*b(b2, 1)
  x +=   27*b(b2, 2) - 27*b(b2, 3) + 81*b(b3, 2) - 81*b(b3, 3);
  let y = b(b1, 7) - b(b1, 6) + 9*b(b1, 5) - 9*b(b1, 4) + 3*b(b2, 7) -3*b(b2, 6)
  y += 27*b(b2, 5) - 27*b(b2, 4) + 81*b(b3, 5) -81*b(b3, 4);
  return {x: x, y: y}
}
//
// let b1 = decToDst(-49, -110)
// console.log(b1);
// let dec = dstToDec(b1.b1, b1.b2, b1.b3)
// console.log(dec);
