export class Util {
	// number of bytes to denote some numeric value
	static DataLen: int = 1;
	// number of bytes to denote length serialized state, including varint prefix (1 byte) + length (2 bytes)
	static StateLen: int = 3;

	// number of bytes to denote input sequence
	static InputSeqLen: int = 4;
	// number of bytes to denote output value
	static OutputValueLen: int = 8;
	// number of bytes to denote a public key (compressed)
	static PubKeyLen: int = 33;
	// number of bytes to denote a public key hash
	static PubKeyHashLen: int = 20;

	// convert signed integer `n` to unsigned integer of `l` bytes, in little endian
	static toLEUnsigned(n: int, l: int): bytes {
		// one extra byte to accommodate possible negative sign byte
		let m: bytes = num2bin(n, l + 1);
		// remove sign byte
		return m.slice(0, len(m) - 1);
	}

	// convert bytes to unsigned integer, in sign-magnitude little endian
	static fromLEUnsigned(b: bytes): int {
		// append positive sign byte. This does not hurt even when sign bit is already positive
		return unpack(b + b`00`);
	}

	// build P2PKH script from public key hash
	static buildPublicKeyHashScript(pubKeyHash: Ripemd160): bytes {
		return (
			OpCode.OP_DUP +
			OpCode.OP_HASH160 +
			pack(Util.PubKeyHashLen) /* "OP_PUSHDATA0" */ +
			pubKeyHash +
			OpCode.OP_EQUALVERIFY +
			OpCode.OP_CHECKSIG
		);
	}

	// build a tx output from its script and satoshi amount
	static buildOutput(outputScript: bytes, outputSatoshis: int): bytes {
		return (
			num2bin(outputSatoshis, Util.OutputValueLen) +
			Util.writeVarint(outputScript)
		);
	}

	// wrapper for OP_PUSH_TX with customized sighash type
	static checkPreimageSigHashType(
		txPreimage: SigHashPreimage,
		sigHashType: SigHashType
	): bool {
		// The following arguments can be generated using sample code at
		// https://gist.github.com/scrypt-sv/f6882be580780a88984cee75dd1564c4.js
		let privKey: PrivKey = PrivKey(
			0x621de38d9af72be8585d19584e3954d3fd0dc9752bb9f9fb28c4f9ed7c1e40ea
		);
		let pubKey: PubKey = PubKey(
			b`02773aca113a3217b67a95d5b78b69bb6386ed443ea5decf0ba92c00d179291921`
		);
		// invK is the modular inverse of k, the ephemeral key
		let invK: int = 0xa2103f96554aba49bbf581738d3b5a38c5a44b6238ffb54cfcca65b8c87ddc08;
		// r is x coordinate of R, which is kG
		let r: int = 0x00f0fc43da25095812fcddde7d7cd353990c62b078e1493dc603961af25dfc6b60;
		// rBigEndian is the signed magnitude representation of r, in big endian
		let rBigEndian: bytes = b`00f0fc43da25095812fcddde7d7cd353990c62b078e1493dc603961af25dfc6b60`;

		return Tx.checkPreimageAdvanced(
			txPreimage,
			privKey,
			pubKey,
			invK,
			r,
			rBigEndian,
			sigHashType
		);
	}

	// serialize state size in fixed length
	static encodeStateSize(state: bytes): bytes {
		return num2bin(len(state), Util.StateLen - 1 /* varint prefix byte */);
	}

	/*
	 * VarInt (variable integer) is used to encode fields of variable length in a bitcoin transaction
	 * https://learnmeabitcoin.com/technical/varint
	 */
	// read a VarInt field from the beginning of 'b'
	static readVarint(b: bytes): bytes {
		let l: int = 0;
		let ret: bytes = b``;
		let header: byte = b[0];

		if (header == "fd") {
			l = this.fromLEUnsigned(b.slice(1, 3));
			ret = b.slice(3, 3 + l);
		} else if (header == "fe") {
			l = this.fromLEUnsigned(b.slice(1, 5));
			ret = b.slice(5, 5 + l);
		} else if (header == "ff") {
			l = this.fromLEUnsigned(b.slice(1, 9));
			ret = b.slice(9, 9 + l);
		} else {
			l = this.fromLEUnsigned(b.slice(0, 1));
			ret = b.slice(1, 1 + l);
		}

		return ret;
	}

	// number of bytes of the VarInt field read from the beginning of 'b'
	static readVarintLen(b: bytes): int {
		let len: int = 0;
		let header: byte = b[0];

		if (header == "fd") {
			len = 3 + this.fromLEUnsigned(b.slice(1, 3));
		} else if (header == "fe") {
			len = 5 + this.fromLEUnsigned(b.slice(1, 5));
		} else if (header == "ff") {
			len = 9 + this.fromLEUnsigned(b.slice(1, 9));
		} else {
			len = 1 + this.fromLEUnsigned(b.slice(0, 1));
		}

		return len;
	}

	// convert 'b' to a VarInt field, including the preceding length
	static writeVarint(b: bytes): bytes {
		let n: int = len(b);

		let header: bytes = b``;

		if (n < 0xfd) {
			header = this.toLEUnsigned(n, 1);
		} else if (n < 0x10000) {
			header = b`fd` + this.toLEUnsigned(n, 2);
		} else if (n < 0x100000000) {
			header = b`fe` + this.toLEUnsigned(n, 4);
		} else if (n < 0x10000000000000000) {
			header = b`ff` + this.toLEUnsigned(n, 8);
		}

		return header + b;
	}

	/*
	 * utils to parse every filed of a sighash preimage
	 * Note: only to be used after preimage is validated
	 * spec is at https://github.com/bitcoin-sv/bitcoin-sv/blob/master/doc/abc/replay-protected-sighash.md
	 */
	static nVersion(preimage: SigHashPreimage): bytes {
		return preimage.slice(0, 4);
	}

	static hashPrevouts(preimage: SigHashPreimage): bytes {
		return preimage.slice(4, 36);
	}

	static hashSequence(preimage: SigHashPreimage): bytes {
		return preimage.slice(36, 68);
	}

	static outpoint(preimage: SigHashPreimage): bytes {
		return preimage.slice(68, 104);
	}

	// scriptCode is just scriptPubKey if there is no CODESEPARATOR in the latter
	static scriptCode(preimage: SigHashPreimage): bytes {
		return Util.readVarint(preimage.slice(104, len(preimage)));
	}

	static valueRaw(preimage: SigHashPreimage): bytes {
		let l: int = len(preimage);
		return preimage.slice(l - 52, l - 44);
	}

	static value(preimage: SigHashPreimage): int {
		return Util.fromLEUnsigned(Util.valueRaw(preimage));
	}

	static nSequenceRaw(preimage: SigHashPreimage): bytes {
		let l: int = len(preimage);
		return preimage.slice(l - 44, l - 40);
	}

	static nSequence(preimage: SigHashPreimage): int {
		return Util.fromLEUnsigned(Util.nSequenceRaw(preimage));
	}

	static hashOutputs(preimage: SigHashPreimage): bytes {
		let l: int = len(preimage);
		return preimage.slice(l - 40, l - 8);
	}

	static nLocktimeRaw(preimage: SigHashPreimage): bytes {
		let l: int = len(preimage);
		return preimage.slice(l - 8, l - 4);
	}

	static nLocktime(preimage: SigHashPreimage): int {
		return Util.fromLEUnsigned(Util.nLocktimeRaw(preimage));
	}

	static sigHashType(preimage: SigHashPreimage): SigHashType {
		let l: int = len(preimage);
		return SigHashType(preimage.slice(l - 4, len(preimage)));
	}

	// used only for testing
	public testPreimageParsing(preimage: SigHashPreimage) {
		assert(Tx.checkPreimage(preimage));
		let preimage_: SigHashPreimage = SigHashPreimage(
			Util.nVersion(preimage) +
				Util.hashPrevouts(preimage) +
				Util.hashSequence(preimage) +
				Util.outpoint(preimage) +
				Util.writeVarint(Util.scriptCode(preimage)) +
				Util.valueRaw(preimage) +
				Util.nSequenceRaw(preimage) +
				Util.hashOutputs(preimage) +
				Util.nLocktimeRaw(preimage) +
				Util.sigHashType(preimage)
		);
		assert(preimage == preimage_);
	}
}
