class Asm {
	public double(a: int, b: int) {
		return asm`
          OP_DUP
          OP_ADD
          OP_NUMEQUAL
      `;
	}

	equalImpl(a: int): boolean {
		// mix all
		return asm`
          $x
          ab12
          OP_SIZE
          OP_NIP
          OP_MUL
          OP_1
          OP_MUL
          $x
          OP_SUB
          OP_EQUAL
      `;
	}

	public equal(a: int) {
		assert(this.equalImpl(a));
	}

	public p2pkh(sig: Sig, pubKey: PubKey) {
		return asm`
          OP_DUP
          OP_HASH160
          $pkh
          OP_EQUALVERIFY
          OP_CHECKSIG
      `;
	}

	len(b: bytes): int {
		return asm`
          OP_SIZE
          OP_NIP
      `;
	}

	lenFail(b: bytes): int {
		// this is wrong since there are multiple elements on stack upon return
		return asm`
          OP_SIZE
      `;
	}

	public checkLen(b: bytes, l: int) {
		assert(this.len(b) == l);
		assert(this.len(b) == l);
		assert(this.len(b) == l);
	}

	public checkLenFail(b: bytes, l: int) {
		// expect to fail after multiple calls since the stack is messed
		assert(this.lenFail(b) == l);
		assert(this.lenFail(b) == l);
	}
}
