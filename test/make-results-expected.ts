import fs from "fs";
import glob from "glob";

let programs = glob.sync(__dirname + `/programs/**/contract.scrypt`);

programs.forEach((program) => {
	let reader = fs.createReadStream(program);

	let writer = fs.createWriteStream(
		program.replace("contract.scrypt", "expected.scrypt")
	);

	reader.pipe(writer);
});
