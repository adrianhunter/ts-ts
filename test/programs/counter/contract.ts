import { Util } from "../util/contract";

class Counter {
	public increment(txPreimage: SigHashPreimage, amount: int) {
		assert(Tx.checkPreimage(txPreimage));

		let scriptCode: bytes = Util.scriptCode(txPreimage);
		let scriptLen: int = len(scriptCode);

		// state (i.e., counter value) is at the end
		let counter: int = unpack(scriptCode.slice(scriptLen - Util.DataLen, 0));
		// increment counter
		let scriptCode_: bytes =
			scriptCode.slice(0, scriptLen - Util.DataLen) +
			num2bin(counter + 1, Util.DataLen);
		let output: bytes = Util.buildOutput(scriptCode_, amount);
		// ensure output is expected: amount is same with specified
		// also output script is the same with scriptCode except counter incremented
		assert(hash256(output) == Util.hashOutputs(txPreimage));
	}
}
