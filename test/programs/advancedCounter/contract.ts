import { Util } from "../util/contract";

/**
 * Demonstrates TxAdvanced, with external funding (additional input) and a change output
 */
class AdvancedCounter {
	public increment(
		txPreimage: SigHashPreimage,
		amount: int,
		changePKH: Ripemd160,
		changeSats: int
	) {
		let sigHashType: SigHashType =
			SigHash.ANYONECANPAY | SigHash.ALL | SigHash.FORKID;
		// this ensures the preimage is for the current tx
		assert(Util.checkPreimageSigHashType(txPreimage, sigHashType));

		let scriptCode: bytes = Util.scriptCode(txPreimage);
		let scriptLen: int = len(scriptCode);

		// state (i.e., counter value) is at the end
		let counter: int = unpack(scriptCode.slice(scriptLen - Util.DataLen, 0));

		// Expect the counter to be incremented in the new transaction state
		let scriptCode_: bytes =
			scriptCode.slice(0, scriptLen - Util.DataLen) +
			num2bin(counter + 1, Util.DataLen);

		let counterOutput: bytes = Util.buildOutput(scriptCode_, amount);

		// Expect the additional CHANGE output
		let changeScript: bytes = Util.buildPublicKeyHashScript(changePKH);
		let changeOutput: bytes = Util.buildOutput(changeScript, changeSats);

		// output: amount + scriptlen + script
		let hashOutputs: Sha256 = hash256(counterOutput + changeOutput);

		// ensure output matches what we expect:
		//     - amount is same as specified
		//     - output script is the same as scriptCode except the counter was incremented
		//     - expected CHANGE output script is there
		assert(hashOutputs == Util.hashOutputs(txPreimage));
	}
}
123;
