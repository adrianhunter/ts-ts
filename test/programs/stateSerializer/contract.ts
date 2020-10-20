import { Util } from "util.scrypt";

import { Reader, Writer } from "../serializer/contract";

/*
 * test state serializing/deserializing
 */
class StateSerializer {
	public mutate(txPreimage: SigHashPreimage, amount: int) {
		assert(Tx.checkPreimage(txPreimage));

		let scriptCode: bytes = Util.scriptCode(txPreimage);
		let scriptLen: int = len(scriptCode);

		// locking script: code + opreturn + data(state + state_len)

		// read state length
		let lb: bytes = scriptCode.slice(
			scriptLen - Util.StateLen,
			len(scriptCode)
		);
		let lr: Reader = new Reader(lb);
		let stateLen: int = lr.readInt();
		assert(stateLen == 7);

		// read state
		let stateStart: int = scriptLen - stateLen - Util.StateLen;
		let state: bytes = scriptCode.slice(stateStart, len(scriptCode));
		let r: Reader = new Reader(state);
		let counter: auto = r.readInt();
		assert(counter == 11);
		let b: auto = r.readBytes();
		assert(b == b`1234`);
		let flag: bool = r.readBool();
		assert(flag);

		// serialize state
		let stateBuf: bytes =
			Writer.writeInt(counter + 1) +
			Writer.writeBytes(b + b`ff`) +
			Writer.writeBool(!flag);
		// serialize state size
		let lenBuf: bytes = Writer.writeBytes(Util.encodeStateSize(stateBuf));

		let scriptCode_: bytes =
			scriptCode.slice(0, stateStart) + stateBuf + lenBuf;
		let output: bytes = Util.buildOutput(scriptCode_, amount);
		assert(hash256(output) == Util.hashOutputs(txPreimage));
	}
}
