
function sqr(v){return v*v}
function abs(v){return Math.abs(v)}
function sqrt(v){return Math.sqrt(v)}
function round(v){return Math.round(v)}
function floor(v){return Math.floor(v)}
function roundPoint(point) {
	return [round(point[0]), round(point[1])]
}
function distance([x1, y1], [x2, y2] = [0, 0]) {
	return sqrt( sqr(x2 - x1) + sqr(y2 - y1) )
}


const MAD = 118;
class DSTBuffer{
  constructor(name = "myCam"){
    this.pointBuffer = []
    this.maxX = 0;
    this.maxY = 0;
    this.minX = 0;
    this.minY = 0;
    this.stitchCount = 0;
    this.colorChanges = 0;
    this.lastPoint = [0, 0];
    this.ended = false;

    this.label = name;
    this.name = name;
  }

  get downloadURL(){
    if (!this.ended) this.end();

    let dst = this.buffer;

    let n = dst.length;
    let array = new Uint8Array(n)
    for (var i = 0; i < n; i++){
      if(typeof dst[i] == 'string'){
        array[i] = dst[i].charCodeAt(0)
      }else{
        array[i] = dst[i]
      }
    }

    let dst_blob = new Blob([array], {type: "application/octet-stream"})
    var url = window.URL.createObjectURL(dst_blob);
    return url
  }
  download(name = this.name){
    let a = document.createElement("a");
		a.setAttribute("download", name + ".dst");
		a.href = this.downloadURL
    a.click();
  }

  set label(label){
    this._label = label;
  }
  get label(){ return (`${this._label}`).slice(0, 5)}


  get color(){ return this.colorChanges}

  get header(){
    let buffer = []

    let pushString = (string) => {
      for (var i = 0; i < string.length; i++){
        buffer.push(string[i])
      }
    }

    let push = (value) => {
      if(typeof value == 'string'){
        pushString(value)
      }else{
        buffer.push(value)
      }
    }

    let pad = (value, n) => {
      for(var i = 0; i < n; i++){
        buffer.push(value)
      }
    }

    let add = (info) => {
      info.label = `${info.label}`
      info.value = `${info.value}`
      push(info.label)
      if (info.trail != undefined){
        push(info.value)
        pad(info.trail, info.size - info.value.length)
      }else if(info.lead != undefined){
        pad(info.lead, info.size - info.value.length)
        push(info.value)
      }
      push(0x0D)
    }

    //['LA:', 'ST:', 'CO:', '+X:','-X:', '+Y:', '+Y:', 'AX:', 'AY:', 'MX:', 'MY:', 'PD:']
    add({label: 'LA:', trail: 0x20, value: this.label, size: 16})

    add({label: 'ST:', lead: 0, value: this.stitchCount, size: 7})

    add({label: 'CO:', lead: 0, value: this.colorChanges, size: 3})

    add({label: '+X:', lead: 0, value: this.maxX, size: 5})
    add({label: '-X:', lead: 0, value: this.minX, size: 5})
    add({label: '+Y:', lead: 0, value: this.maxY, size: 5})
    add({label: '-Y:', lead: 0, value: this.minY, size: 5})
    add({label: '+X:', lead: 0, value: this.maxX, size: 5})
    add({label: '-X:', lead: 0, value: this.minX, size: 5})
    add({label: '+Y:', lead: 0, value: this.maxY, size: 5})
    add({label: '-Y:', lead: 0, value: this.minY, size: 5})

    push('AX:+')
    pad(0, 4)
    push('0')
    push(0x0D)

    push('AY:+')
    pad(0, 4)
    push('0')
    push(0x0D)

    push('MX:+')
    pad(0, 4)
    push('0')
    push(0x0D)

    push('MY:+')
    pad(0, 4)
    push('0')
    push(0x0D)

    push('PD:******')
    pad(0x0D, 3)

    pad(0x20, 512 - buffer.length)
    return buffer
  }
  get buffer(){
    return this.header.concat(this.pointBuffer);
  }


	setOrigin(point = [0, 0]) {
		this.lastPoint = roundPoint(point);
	}

	addDstCmd(mode, delta){
		let b = DSTBuffer.decToDst(mode, delta)
    this.pointBuffer.push(b[0]);
    this.pointBuffer.push(b[1]);
    this.pointBuffer.push(b[2]);
	}

	end(){
		this.ended = true;
		this.addDstCmd("end");
	}

	changeColor(){
		this.colorChanges++;
		this.addDstCmd("color");
	}

  addStitchPoint(point = [0, 0]){
		point = roundPoint(point);
		let [lx, ly] = this.lastPoint;
		let [x, y] = point;
		let delta = [x - lx, y - ly];
		let [dx, dy] = delta;

		// check for maximum delta
    if (Math.abs(dx) > MAD || Math.abs(dy) > MAD) {
      throw `[${this.stitchCount + 1}] exceeds maximum axis delta (${MAD}) ${dx}, ${dy}`
    }


		//update bounds
    this.minX = x<this.minX?x:this.minX;
    this.minY = y<this.minY?y:this.minY;
    this.maxX = x>this.maxX?x:this.maxX;
    this.maxY = y>this.maxY?y:this.maxY;

		this.stitchCount++;
		this.lastPoint = [x, y];
		this.addDstCmd("stitch", delta);
  }

  jumpTo(point, stitch = true){
		point = roundPoint(point);
		let [lx, ly] = this.lastPoint;
		let [x, y] = point;
		let [dx, dy] = [x - lx, y - ly];

		let [ix, iy, n] = DSTBuffer.getJumpInterval([dx, dy]);
		while (n > 0) {
			this.addDstCmd("jump", [ix, iy])
			lx += ix;
			ly += iy;
			n--;
		}
		// jump the remaining delta
		this.addDstCmd("jump", [x - lx, y - ly]);
		this.lastPoint = [x, y];
		// add stitch point
		if (stitch) {
			this.addStitchPoint(point);
		}
  }

	static getJumpInterval(delta) {
		let [dx, dy] = delta;
		let ix = 0;
		let iy = 0;
		let n = 0;
		if (abs(dx) > MAD || abs(dy) > MAD) {
			if (abs(dx) > abs(dy)) {
				ix = dx < 0 ? -MAD : MAD;
				n = floor(dx / ix);
				iy = round(dy / n);
				iy = iy > MAD ? MAD : iy < -MAD ? -MAD : iy;
			} else {
				iy = dy < 0 ? -MAD : MAD;
				n = floor(dy / iy);
				ix = round(dx / n);
				ix = ix > MAD ? MAD : ix < -MAD ? -MAD : ix;
			}
		}
		return [ix, iy, n]
	}

	static decToDst(mode = 'stitch', delta = [0, 0]){
		let [x, y] = delta;
		let b1 = 0;
		let b2 = 0;
		let b3 = (1<<0)|(1<<1);

		if (mode == 'color'){
			b3 |= (1<<7)|(1<<6)
			return [b1, b2, b3];
		}else if (mode == 'end') {
			b3 = 243;
			return [b1, b2, b3];
		}

		if(mode == 'jump'){
			b3 |= (1<<7)
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

		return [b1, b2, b3]
	}
	static dstToDec(b1, b2, b3){
		let b = (b, c) => {
			return ((b>>c)&1)
		}
		let x = b(b1, 0) - b(b1, 1) + 9*b(b1, 2) - 9*b(b1, 3) + 3*b(b2, 0) -3*b(b2, 1)
		x +=   27*b(b2, 2) - 27*b(b2, 3) + 81*b(b3, 2) - 81*b(b3, 3);
		let y = b(b1, 7) - b(b1, 6) + 9*b(b1, 5) - 9*b(b1, 4) + 3*b(b2, 7) -3*b(b2, 6)
		y += 27*b(b2, 5) - 27*b(b2, 4) + 81*b(b3, 5) -81*b(b3, 4);
		return {x: x, y: y}
	}
}

const name = "Export DST";

const properties = {
	origin: {
		type: "vector",
		default: "center"
	},
	back_stitch_length: {
		type: "string",
		default: "2"
	},
	back_stitch_repeats: {
		type: "string",
		default: "1"
	}
};

const icon = `
<svg viewBox="0 0 100 60">
<path class="i-stitch-d" d="M40.299,24.941c-16.546,7.097-2.207,29.377-37.398,29.377"/>
<g class = "i-color-f">
<path d="M57.425,26.775c-0.158,0-0.303,0.016-0.44,0.047c-0.391,0.051-1.127,0.019-1.768-0.04v-0.017
c0-0.644,0.043-1.359,0.129-2.133c0.097-0.911,0.159-2.198,0.191-3.937c0.037-2.215,0.092-2.686,0.103-2.753
c0.056-0.238,0.125-0.678,0.17-1.991l0.068-2.133l-0.775-0.54c-0.39-0.283-0.788-0.426-1.183-0.426
c-0.688,0-1.198,0.445-1.585,0.855c-0.098,0.109-0.186,0.199-0.268,0.27c-0.043,0.037-0.08,0.068-0.112,0.089l-0.849,0.511
c-0.231,0.155-0.537,0.3-0.898,0.428c-0.404,0.139-0.681,0.252-0.891,0.37c-0.358,0.023-0.704,0.136-1.009,0.329
c-0.517,0.324-0.813,0.834-0.813,1.398c0,0.335,0.104,0.84,0.543,1.272c0.255,0.293,0.49,0.468,0.76,0.571
c0.313,0.119,0.651,0.129,1.061,0.025c0.287-0.078,0.547-0.198,0.775-0.354c0.087-0.04,0.216-0.086,0.337-0.13
c0.292-0.084,0.619-0.216,1-0.408c0.002-0.001,0.004-0.001,0.005-0.002c-0.032,0.66-0.061,1.58-0.084,2.882
c-0.04,3.609-0.185,4.376-0.231,4.531c-0.082,0.24-0.113,0.528-0.113,1.026v0.022l-0.365-0.011
c-0.706-0.032-1.091-0.047-1.156-0.047c-0.554,0-1.014,0.102-1.431,0.327c-0.641,0.365-0.992,0.989-0.938,1.633
c0.043,0.822,0.498,1.437,1.211,1.644c0.236,0.069,0.578,0.131,2.142,0.131c1.082,0,1.492,0.024,1.635,0.038
c0.358,0.125,0.768,0.131,1.244,0.021l0.166-0.036c0.068,0.003,0.217,0.017,0.414,0.037c0.764,0.097,1.395,0.153,1.881,0.167
c0.239,0.017,0.519,0.026,0.844,0.026c0.457,0,0.982-0.039,1.408-0.334c0.257-0.181,0.688-0.611,0.688-1.465
C59.292,27.552,58.525,26.775,57.425,26.775z M49.094,17.634C49.094,17.634,49.094,17.634,49.094,17.634l-0.002,0.003
L49.094,17.634z"/>
<path d="M71.109,13.259c-0.077-0.245-0.25-0.598-0.761-1.431c-0.579-0.94-0.809-1.221-0.944-1.357
c-0.333-0.354-0.784-0.65-1.344-0.88c-1.037-0.424-1.928-0.437-2.47-0.072c-0.272,0.077-0.562,0.249-0.995,0.537
c-1.184,0.784-2.105,2.019-2.693,3.565c-0.06,0.119-0.132,0.292-0.208,0.514l-0.057,0.168c-0.098,0.201-0.151,0.426-0.16,0.687
c-0.032,0.143-0.11,0.397-0.227,0.764c-0.236,0.743-0.375,1.241-0.435,1.569c-0.054,0.292-0.122,0.859-0.198,1.691
c-0.047,0.466-0.07,0.988-0.07,1.563c0,0.962,0.06,1.686,0.198,2.269c0.115,0.402,0.376,0.952,0.829,1.742
c0.104,0.176,0.18,0.314,0.23,0.439c0.105,0.25,0.275,0.549,0.518,0.911c0.248,0.372,0.506,0.72,0.891,0.894
c0.028,0.02,0.055,0.041,0.074,0.056c0.552,0.481,1.28,0.725,2.164,0.725c0.611,0,1.161-0.126,1.598-0.357
c0.526-0.254,1.057-0.627,1.605-1.126c0.275-0.241,0.464-0.42,0.563-0.528c0.172-0.186,0.323-0.418,0.457-0.703
c0.054-0.112,0.122-0.22,0.208-0.334c1.044-1.41,1.697-3.484,1.998-6.372c0.033-0.413,0.047-0.732,0.047-0.955
c0-1.66-0.219-2.859-0.644-3.618C71.197,13.452,71.139,13.332,71.109,13.259z M67.092,22.603c-0.269,0.392-0.507,0.705-0.721,0.947
c-0.056,0.065-0.2,0.209-0.546,0.441c-0.098,0.067-0.181,0.122-0.251,0.16c-0.087,0.008-0.172,0.023-0.254,0.043
c-0.026-0.008-0.054-0.022-0.084-0.044c-0.075-0.083-0.165-0.23-0.295-0.449c-0.694-1.132-0.846-1.514-0.877-1.606
c-0.04-0.119-0.132-0.509-0.132-1.56c0-0.847,0.05-1.652,0.151-2.393c0.119-0.89,0.238-1.146,0.236-1.146c0,0,0,0,0,0.001
c0.079-0.132,0.164-0.313,0.358-0.842c0.16-0.434,0.251-0.742,0.263-0.824c0.023-0.078,0.062-0.188,0.119-0.337l0.139-0.357
c0.331-0.798,0.754-1.391,1.287-1.805c0.007,0,0.014,0,0.021,0c0.208-0.001,0.319,0.015,0.327,0.008
c0.085,0.061,0.327,0.277,0.669,0.923c0.064,0.128,0.164,0.311,0.3,0.555c0.096,0.169,0.164,0.289,0.202,0.374l0.172,0.384
c0.053,0.121,0.097,0.249,0.131,0.384c0.046,0.185,0.096,0.411,0.148,0.679c0.056,0.276,0.084,0.53,0.084,0.755
c0,0.395-0.048,0.983-0.141,1.75l-0.002,0.015c-0.223,2.027-0.552,2.691-0.686,2.89c-0.119,0.177-0.249,0.371-0.321,0.604
C67.33,22.254,67.23,22.403,67.092,22.603z"/>
<path d="M84.436,28.483c-0.158,0-0.303,0.016-0.44,0.047c-0.391,0.051-1.127,0.019-1.767-0.04v-0.017
c0-0.644,0.043-1.359,0.129-2.133c0.097-0.91,0.159-2.197,0.191-3.935c0.037-2.214,0.092-2.685,0.103-2.752
c0.056-0.238,0.125-0.678,0.17-1.99l0.068-2.132l-0.775-0.54c-0.39-0.283-0.787-0.426-1.182-0.426
c-0.688,0-1.197,0.445-1.585,0.855c-0.098,0.109-0.186,0.199-0.268,0.27c-0.043,0.037-0.079,0.068-0.112,0.089l-0.848,0.51
c-0.231,0.155-0.537,0.3-0.898,0.428c-0.404,0.139-0.681,0.252-0.891,0.369c-0.358,0.023-0.704,0.136-1.009,0.329
c-0.517,0.324-0.812,0.833-0.812,1.397c0,0.335,0.104,0.84,0.543,1.271c0.255,0.292,0.489,0.468,0.76,0.571
c0.313,0.119,0.651,0.129,1.061,0.025c0.287-0.078,0.546-0.197,0.775-0.354c0.087-0.04,0.216-0.086,0.337-0.13
c0.292-0.084,0.619-0.216,1-0.407c0.002-0.001,0.004-0.001,0.005-0.002c-0.032,0.66-0.061,1.58-0.084,2.881
c-0.04,3.608-0.185,4.374-0.231,4.529c-0.082,0.24-0.113,0.528-0.113,1.025v0.022l-0.365-0.011
c-0.705-0.032-1.09-0.047-1.155-0.047c-0.554,0-1.013,0.102-1.431,0.327c-0.641,0.365-0.991,0.989-0.938,1.633
c0.043,0.822,0.498,1.436,1.211,1.644c0.236,0.069,0.578,0.131,2.141,0.131c1.082,0,1.492,0.024,1.634,0.038
c0.358,0.125,0.768,0.131,1.243,0.02l0.166-0.036c0.068,0.003,0.217,0.017,0.414,0.037c0.764,0.097,1.395,0.153,1.88,0.167
c0.238,0.017,0.519,0.026,0.843,0.026c0.457,0,0.981-0.039,1.407-0.334c0.257-0.181,0.688-0.611,0.688-1.464
C86.303,29.26,85.535,28.483,84.436,28.483z M76.108,19.345C76.108,19.345,76.109,19.346,76.108,19.345l-0.002,0.003L76.108,19.345
z"/>
<path d="M96.99,38.775c-0.151,0-0.29,0.015-0.42,0.045c-0.376,0.05-1.075,0.018-1.689-0.039v-0.017
c0-0.615,0.042-1.298,0.123-2.038c0.093-0.87,0.152-2.099,0.183-3.76c0.036-2.115,0.088-2.566,0.098-2.63
c0.053-0.227,0.12-0.648,0.163-1.902l0.065-2.037l-0.74-0.516c-0.373-0.27-0.752-0.407-1.13-0.407
c-0.657,0-1.144,0.425-1.514,0.817c-0.094,0.104-0.178,0.19-0.256,0.258c-0.042,0.036-0.076,0.065-0.107,0.085l-0.81,0.488
c-0.221,0.148-0.513,0.287-0.858,0.409c-0.386,0.133-0.65,0.241-0.851,0.353c-0.342,0.022-0.673,0.13-0.964,0.314
c-0.494,0.31-0.776,0.796-0.776,1.335c0,0.32,0.1,0.802,0.519,1.215c0.243,0.279,0.468,0.447,0.726,0.545
c0.3,0.114,0.622,0.122,1.013,0.024c0.274-0.075,0.522-0.189,0.74-0.338c0.083-0.038,0.206-0.082,0.322-0.124
c0.279-0.08,0.591-0.206,0.955-0.389c0.002-0.001,0.004-0.001,0.005-0.002c-0.031,0.631-0.058,1.509-0.081,2.752
c-0.038,3.447-0.177,4.179-0.221,4.327c-0.078,0.23-0.108,0.505-0.108,0.98v0.021l-0.349-0.01c-0.674-0.03-1.042-0.045-1.104-0.045
c-0.529,0-0.968,0.097-1.367,0.312c-0.612,0.349-0.947,0.945-0.896,1.56c0.042,0.785,0.476,1.372,1.157,1.571
c0.225,0.066,0.552,0.125,2.046,0.125c1.034,0,1.425,0.023,1.562,0.036c0.342,0.12,0.733,0.125,1.188,0.02l0.159-0.034
c0.065,0.003,0.208,0.016,0.395,0.035c0.73,0.093,1.333,0.146,1.797,0.16c0.228,0.016,0.496,0.025,0.806,0.025
c0.437,0,0.937-0.037,1.344-0.319c0.246-0.173,0.657-0.584,0.657-1.399C98.774,39.517,98.04,38.775,96.99,38.775z M89.033,30.044
C89.034,30.044,89.034,30.044,89.033,30.044l-0.002,0.003L89.033,30.044z"/>
</g>
</svg>
`

const pattern = /^r?(\([sl\(\)]+\))|([sl])$/

function parseProperties(props, parser) {
	let v = props.origin;
	if (!parser.isVector(v)) {
		parser.error("Invalid origin vector", "origin")
	}

	let bsl = parseInt(props.back_stitch_length);
	if (Number.isNaN(bsl)) parser.error("Back stitch length not a number.", "back_stitch_length");
	else if (bsl < 0) parse.error("Back stitch length must be at least 0", "back_stitch_length");
	props.back_stitch_length = bsl;

	let bsr = parseInt(props.back_stitch_repeats);
	if (Number.isNaN(bsr)) parser.error("Back stitch length not a number.", "back_stitch_repeats");
	else if (bsr < 1) parser.error("Back stitch repeats must be at least 0", "back_stitch_length");
	props.back_stitch_repeats = bsr;
	parser.error();
}

function run(params) {
  let geo = params.input;
  let output = params.guides.makeStitchVisualiser();
  let props = params.props;

	let bsl = props.back_stitch_length;
	let bsr = props.back_stitch_repeats;
	let origin = props.origin.round();

	let dst = new DSTBuffer();
	dst.setOrigin([origin.x, origin.y*-1]);




	let lastPoint = origin;
	function addStitch(p, color = null){
		output.addStitch(lastPoint, p, color);
		lastPoint = p;
		dst.addStitchPoint([p.x, p.y*-1]);
	}

	function jumpTo(p, stitch = true) {
		output.addMove(lastPoint, p);
		lastPoint = p;
		dst.jumpTo([p.x, p.y*-1], stitch);
	}


	let bsn = bsl*bsr
	function backstich(cpoint, dir = true){
		let cur = cpoint;
		let i = 0;
		let rps = 0;

		for (let r = 0; r < bsr; r++) {
			let i = 0;
			while (i < bsl && cur[dir ? "next" : "last"] != null) {
				cur = cur[dir ? "next" : "last"];
				addStitch(cur.p, "#3335");
				i++;
			}
			while (i > 0) {
				cur = cur[dir ? "last" : "next"];
				addStitch(cur.p, "#3335")
				i--;
			}
		}
	}

	let paths = geo.querySelectorAll(".spath,.spath-loop");
  return {
    *[Symbol.iterator]() {
			for (let path of paths) path.working = true;

			let color = null;
			for (let path of paths) {
				path.working = true;
				if (color != null && color != path.color) {
					dst.changeColor();
				}

				color = path.color;
				let cur = path.dpath.start;
				jumpTo(cur.p);
				yield 0;

				backstich(cur);
				yield 0;

				while (cur.next != null) {
					cur = cur.next;
					try {
						addStitch(cur.p, color);
					} catch(e) {
						jumpTo(cur.p);
						backstich(cur);
					}
					yield 0;
					// for (let i = 0; i < 8; i++) yield 0;
				}
				backstich(cur, false);
				yield 0;
			}

			for (let i = 0; i < 100; i++) yield 0;

			for (let path of paths) path.working = false;
			dst.download();
    }
  }
}

export {name, properties, run, pattern, icon}
