import { Util } from "../util/contract";

/**
 * A toy token example between two holders
 */
class Token {
	public transfer(
		sender: PubKey,
		senderSig: Sig,
		receiver: PubKey,
		value: int /* amount to be transferred */,
		txPreimage: SigHashPreimage,
		amount: int
	) {
		// this ensures the preimage is for the current tx
		assert(Tx.checkPreimage(txPreimage));

		// authorize
		assert(checkSig(senderSig, sender));

		// read previous locking script
		let lockingScript: bytes = Util.scriptCode(txPreimage);
		let scriptLen: int = len(lockingScript);

		let pkStart: int = scriptLen - (Util.PubKeyLen + Util.DataLen) * 2;
		let pk0: PubKey = PubKey(
			lockingScript.slice(pkStart, pkStart + Util.PubKeyLen)
		);
		let balance0: int = unpack(
			lockingScript.slice(
				pkStart + Util.PubKeyLen,
				pkStart + Util.PubKeyLen + Util.DataLen
			)
		);
		let pk1: PubKey = PubKey(
			lockingScript.slice(
				pkStart + Util.PubKeyLen + Util.DataLen,
				pkStart + 2 * Util.PubKeyLen + Util.DataLen
			)
		);
		let balance1: int = unpack(
			lockingScript.slice(scriptLen - Util.DataLen, len(lockingScript))
		);

		// only between two holders
		assert(
			(sender == pk0 && receiver == pk1) || (sender == pk1 && receiver == pk0)
		);

		// transfer
		if (sender == pk0) {
			assert(balance0 >= value);
			balance0 = balance0 - value;
			balance1 = balance1 + value;
		} else {
			assert(balance1 >= value);
			balance1 = balance1 - value;
			balance0 = balance0 + value;
		}

		// write new locking script
		let lockingScript_: bytes =
			lockingScript.slice(0, pkStart) +
			pk0 +
			num2bin(balance0, Util.DataLen) +
			pk1 +
			num2bin(balance1, Util.DataLen);
		let output: bytes = Util.buildOutput(lockingScript_, amount);
		assert(hash256(output) == Util.hashOutputs(txPreimage));
	}
}
