import { Util } from "../util/contract";

class RabinSignature {
	public verifySig(sig: int, msg: bytes, padding: bytes, n: int) {
		let h: int = Util.fromLEUnsigned(this.hash(msg + padding));
		assert((sig * sig) % n == h % n);
	}

	hash(x: bytes): bytes {
		// expand into 512 bit hash
		let hx: bytes = sha256(x);
		let idx: int = len(hx) / 2;
		return sha256(hx.slice(0, idx)) + sha256(hx.slice(idx, hx.length));
	}
}
