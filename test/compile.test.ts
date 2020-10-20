import { assert } from "chai";

import fs from "fs";
import glob from "glob";

describe("transpile contracts", async () => {
	let programs = glob.sync(__dirname + `/programs/**/contract.scrypt`);
	programs.forEach((program) => {
		let foo = program.split("/");
		let contractName = foo[foo.length - 2];

		it(`${contractName}`, async () => {
			let compiled = fs.readFileSync(program).toString();

			let expected = fs
				.readFileSync(program.replace("contract.scrypt", "expected.scrypt"))
				.toString();

			assert.equal(compiled, expected);
		});
	});
});
