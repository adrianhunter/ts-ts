import { bsv, compile } from "scryptlib";

import fs from "fs";
import glob from "glob";
import path from "path";

let programs = glob.sync(__dirname + `/test/programs/**/contract.scrypt`);

programs.forEach((program) => {
	// let reader = fs.readFileSync(program);
	let foo = program.split("/");
	let contractName = foo[foo.length - 2];

	let outputDir = path.join(__dirname, `/test/programs/${contractName}`);

	if (!fs.existsSync(outputDir)) {
		fs.mkdirSync(outputDir);
	}

	const result = compile(
		{ path: program },
		{
			desc: true,
			// outputDir,
		}
	);

	if (result.errors.length > 0) {
		console.log(`Contract ${program} compiling failed with errors:`);
		console.log(result.errors);
		throw result.errors;
	}

	console.info(`compiled ${program}`, result.abi);
	// console.log();

	// console.log("result", result);
});
