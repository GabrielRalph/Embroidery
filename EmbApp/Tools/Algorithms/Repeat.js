const name = "Set Repeats";

const properties = {
	repeats: {
		type: "string",
		default: "0",
	}
};

const icon = `
<svg viewBox="0 0 100 60">
<path class = "i-stitch-d" d="M40.99,4.03c20.77-2.12,45.43,8.12,45.43,20.1,0,19.09-23.41,27.61-42.21,29.34-15.67,1.45-37.94-2.68-40.2-13.06C1.94,30.88,12.58,21.93,22.43,17.4c3.61-1.66,11.01-7.73,28.9-6.12,8.66,.78,28.23,5.87,26.45,16.87s-18.34,16.9-34.87,17.52"/>
</svg>
`

const pattern = /[ls]/

const COLOR = "#506bffb5"

function parseProperties(props, parser) {
	let num = parseFloat(props.repeats);
	if (Number.isNaN(num)) {
		parser.error("repeats", "repeats not a number");
	}
	parser.throw();
	props.repeats = num;
}

function run(params) {
  let spath = params.input;
  let output = params.guides;
  let props = params.props;

	spath.repeats = props.repeats;
  // return {
  //   *[Symbol.iterator]() {
	// 	}
  // };
}

export {name, properties, parseProperties, run, pattern, icon}
