import { Util } from "../util/contract";

/**
 * AdvancedTokenSale
 *
 * Demonstrates atomic swapping of tokens for satoshis: sales made to a buyer's (public key)
 * Uses TxAdvanced, with external funding (additional input) and a change output
 *
 * Use with: getFundedtxPreimage() and unlockFundedScriptTx()
 */
class AdvancedTokenSale {
	// satoshis / token
	price: int;

	constructor(price: int) {
		this.price = price;
	}

	public buy(
		txPreimage: SigHashPreimage,
		changePKH: Ripemd160,
		changeSats: int,
		buyer: bytes,
		numTokens: int
	) {
		let sigHashType: SigHashType =
			SigHash.ANYONECANPAY | SigHash.ALL | SigHash.FORKID;
		// this ensures the preimage is for the current tx
		assert(Util.checkPreimageSigHashType(txPreimage, sigHashType));

		// we're using only one byte for the number of tokens purchased
		assert(0 < numTokens && numTokens < 128);

		let scriptCode: bytes = Util.scriptCode(txPreimage);
		let scriptLen: int = len(scriptCode);

		let oldBalance: int = Util.value(txPreimage);
		let newBalance: int = oldBalance + numTokens * this.price;

		// data after the OP_RETURN is a growing list of sales entries:
		//     PubKeyA,numTokensPurchased
		//     PubKeyB,numTokensPurchased
		let newSalesEntry: bytes = buyer + num2bin(numTokens, Util.DataLen);

		// expect the latest sales entry to be appended to the previous script/state
		let scriptCode_: bytes = scriptCode + newSalesEntry;

		// output: amount + scriptlen + script
		let counterOutput: bytes = Util.buildOutput(scriptCode_, newBalance);

		// Expect the additional CHANGE output
		let changeScript: bytes = Util.buildPublicKeyHashScript(changePKH);
		// output: amount + scriptlen + script
		let changeOutput: bytes = Util.buildOutput(changeScript, changeSats);

		// expect exactly two outputs
		let hashOutputs: Sha256 = hash256(counterOutput + changeOutput);

		// ensure output matches what we expect:
		//     - amount/balance reflects funds received from sale
		//     - output script is the same as scriptCode, with additional sales entry
		//     - expected change output script is there
		assert(hashOutputs == Util.hashOutputs(txPreimage));
	}
}
