import { Util } from "../util/contract";

/**
 * A non-fungible token enforced by miners at layer 1
 */
class SPVToken {
	// prevTx: tx being spent by the current tx
	// prevPrevTx: tx being spent by prevTx
	public transfer(
		senderSig: Sig,
		receiver: PubKey,
		satoshiAmount: int,
		txPreimage: SigHashPreimage,
		prevTx: bytes,
		prevPrevTx: bytes
	) {
		// constants
		let TxIdLen: int = 32;
		let TokenIdLen: int = TxIdLen;
		let PrevTxIdIdx: int = 5;
		let UnlockingScriptIdx: int = 41;
		// uninitialized token ID
		let NullTokenId: bytes = num2bin(0, TokenIdLen);

		assert(Tx.checkPreimage(txPreimage));

		// read previous locking script: codePart + OP_RETURN + tokenID + ownerPublicKey
		let lockingScript: bytes = Util.scriptCode(txPreimage);
		let scriptLen: int = len(lockingScript);

		// constant part of locking script: upto OP_RETURN
		let constStart: int = scriptLen - TokenIdLen - Util.PubKeyLen;
		let constPart: bytes = lockingScript.slice(0, constStart);

		let sender: PubKey = PubKey(
			lockingScript.slice(constStart + TokenIdLen, lockingScript.length)
		);
		// authorize
		assert(checkSig(senderSig, sender));

		let outpoint: bytes = Util.outpoint(txPreimage);
		let prevTxId: bytes = outpoint.slice(0, TokenIdLen);
		assert(hash256(prevTx) == prevTxId);

		let tokenId: bytes = lockingScript.slice(
			constStart,
			constStart + TokenIdLen
		);
		if (tokenId == NullTokenId) {
			// get prevTxId and use it to initialize token ID
			tokenId = prevTxId;
		} else {
			/*
			 * validate not only the parent tx (prevTx), but also its parent tx (prevPrevTx)
			 */

			// TODO: assume 1 input, to extend to multiple inputs
			let prevPrevTxId: bytes = prevTx.slice(
				PrevTxIdIdx,
				PrevTxIdIdx + TxIdLen
			);
			assert(hash256(prevPrevTx) == prevPrevTxId);

			let unlockingScriptLen: int = Util.readVarintLen(
				prevPrevTx.slice(UnlockingScriptIdx, len(prevPrevTx))
			);

			// TODO: only validate output 0 here, to extend to multiple outputs
			let lockingScriptIdx: int =
				UnlockingScriptIdx +
				unlockingScriptLen +
				Util.InputSeqLen +
				1 /* output count length */ +
				Util.OutputValueLen;
			let prevLockingScript: bytes = Util.readVarint(
				prevPrevTx.slice(lockingScriptIdx, len(prevPrevTx))
			);
			// ensure prev tx uses the same contract code
			assert(len(prevLockingScript) == len(lockingScript));
			assert(prevLockingScript.slice(0, constStart) == constPart);
			// belongs to the same token
			let prevTokenId: bytes = prevLockingScript.slice(
				constStart,
				constStart + TokenIdLen
			);
			assert(prevTokenId == tokenId || prevTokenId == NullTokenId);
		}

		// validate parent tx
		let outputScript: bytes = constPart + tokenId + receiver;

		let output: bytes = Util.buildOutput(outputScript, satoshiAmount);
		assert(hash256(output) == Util.hashOutputs(txPreimage));
	}
}
