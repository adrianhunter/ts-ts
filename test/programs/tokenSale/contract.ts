import { Util } from "../util/contract";

/**
 * A toy token sale
 */
class TokenSale {
	// satoshis / token
	price: int;

	constructor(price: int) {
		this.price = price;
	}

	public buy(buyer: PubKey, numTokens: int, txPreimage: SigHashPreimage) {
		// this ensures the preimage is for the current tx
		assert(Tx.checkPreimage(txPreimage));

		// read previous locking script
		let lockingScript: bytes = Util.scriptCode(txPreimage);
		let scriptLen: int = len(lockingScript);
		let oldBalance: int = Util.value(txPreimage);
		let newBalance: int = oldBalance + numTokens * this.price;

		// write new locking script
		let lockingScript_: bytes =
			lockingScript + buyer + num2bin(numTokens, Util.DataLen);
		let output: bytes = Util.buildOutput(lockingScript_, newBalance);
		assert(hash256(output) == Util.hashOutputs(txPreimage));
	}
}
