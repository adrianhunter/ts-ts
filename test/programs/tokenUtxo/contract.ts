import { Util } from "../util/contract";

/**
 * A token protocol based on UTXO model
 */
class Token {
	public split(
		senderSig: Sig,
		receiver0: PubKey,
		tokenAmount0: int,
		satoshiAmount0: int,
		receiver1: PubKey,
		tokenAmount1: int,
		satoshiAmount1: int,
		txPreimage: SigHashPreimage
	) {
		assert(tokenAmount0 > 0);
		// 1 to 1 transfer when tokenAmount1 is 0
		assert(tokenAmount1 >= 0);

		// this ensures the preimage is for the current tx
		assert(Tx.checkPreimage(txPreimage));

		// read previous locking script
		// locking script = codePart + OP_RETURN + senderPublicKey + balance0 + balance1
		let lockingScript: bytes = Util.scriptCode(txPreimage);
		let scriptLen: int = len(lockingScript);

		let amountStart: int = scriptLen - Util.DataLen * 2;

		let sender: PubKey = PubKey(
			lockingScript.slice(amountStart - Util.PubKeyLen, amountStart)
		);
		// authorize
		assert(checkSig(senderSig, sender));

		let balance0: int = unpack(
			lockingScript.slice(amountStart, amountStart + Util.DataLen)
		);
		let balance1: int = unpack(
			lockingScript.slice(amountStart + Util.DataLen, len(lockingScript))
		);

		// split
		assert(balance0 + balance1 == tokenAmount0 + tokenAmount1);

		// persist contract code part, including op_return itself
		let codePart: bytes = lockingScript.slice(0, amountStart - Util.PubKeyLen);

		// setting first balance as 0 is just a convention, not a assertment
		let outputScript0: bytes =
			codePart +
			receiver0 +
			num2bin(0, Util.DataLen) +
			num2bin(tokenAmount0, Util.DataLen);
		let output0: bytes = Util.buildOutput(outputScript0, satoshiAmount0);
		let outputScript1: bytes =
			codePart +
			receiver1 +
			num2bin(0, Util.DataLen) +
			num2bin(tokenAmount1, Util.DataLen);
		let output1: bytes =
			tokenAmount1 > 0 ? Util.buildOutput(outputScript1, satoshiAmount1) : b``;
		let hashOutputs: Sha256 = hash256(output0 + output1);

		assert(hashOutputs == Util.hashOutputs(txPreimage));
	}

	public merge(
		senderSig: Sig,
		receiver: PubKey,
		prevouts: bytes,
		otherTokenAmount: int,
		satoshiAmount: int,
		txPreimage: SigHashPreimage
	) {
		assert(otherTokenAmount >= 0);

		// this ensures the preimage is for the current tx
		assert(Tx.checkPreimage(txPreimage));

		// this ensures prevouts is the preimage of hashPrevouts
		assert(hash256(prevouts) == Util.hashPrevouts(txPreimage));
		// each outpoint: 32 byte txid + 4 byte index
		let outpointLen: int = 36;
		// ensure only two inputs are present
		assert(len(prevouts) == 2 * outpointLen);

		// read previous locking script
		let lockingScript: bytes = Util.scriptCode(txPreimage);
		let scriptLen: int = len(lockingScript);

		let amountStart: int = scriptLen - Util.DataLen * 2;

		let sender: PubKey = PubKey(
			lockingScript.slice(amountStart - Util.PubKeyLen, amountStart)
		);
		// authorize
		assert(checkSig(senderSig, sender));

		let balance0: int = unpack(
			lockingScript.slice(amountStart, amountStart + Util.DataLen)
		);
		let balance1: int = unpack(
			lockingScript.slice(amountStart + Util.DataLen, len(lockingScript))
		);

		// persist contract code part, including op_return itself
		let codePart: bytes = lockingScript.slice(0, amountStart - Util.PubKeyLen);

		let amountPart: bytes =
			Util.outpoint(txPreimage) == prevouts.slice(0, outpointLen)
				? // input 0
				  num2bin(balance0 + balance1, Util.DataLen) +
				  num2bin(otherTokenAmount, Util.DataLen)
				: // input 1
				  num2bin(otherTokenAmount, Util.DataLen) +
				  num2bin(balance0 + balance1, Util.DataLen);
		// merge
		let outputScript: bytes = codePart + receiver + amountPart;
		let output: bytes = Util.buildOutput(outputScript, satoshiAmount);
		assert(hash256(output) == Util.hashOutputs(txPreimage));
	}

	// burn a token back to normal bitcoins
	public burn(
		senderSig: Sig,
		receiverPkh: Ripemd160,
		satoshiAmount: int,
		txPreimage: SigHashPreimage
	) {
		// this ensures the preimage is for the current tx
		assert(Tx.checkPreimage(txPreimage));

		// read previous locking script
		// locking script = codePart + OP_RETURN + senderPublicKey + balance0 + balance1
		let lockingScript: bytes = Util.scriptCode(txPreimage);
		let scriptLen: int = len(lockingScript);

		let amountStart: int = scriptLen - Util.DataLen * 2;

		let sender: PubKey = PubKey(
			lockingScript.slice(amountStart - Util.PubKeyLen, amountStart)
		);
		// authorize
		assert(checkSig(senderSig, sender));

		// send to a P2PKH script
		let lockingScript_: bytes = Util.buildPublicKeyHashScript(receiverPkh);
		let output: bytes = Util.buildOutput(lockingScript_, satoshiAmount);
		let hashOutputs: Sha256 = hash256(output);
		assert(hashOutputs == Util.hashOutputs(txPreimage));
	}
}
