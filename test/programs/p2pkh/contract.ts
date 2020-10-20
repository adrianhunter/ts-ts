class DemoP2PKH {
	pubKeyHash: Ripemd160;
	constructor(pubKeyHash: Ripemd160) {
		this.pubKeyHash = pubKeyHash;
	}
	public unlock(sig: Sig, pubKey: PubKey) {
		assert(hash160(pubKey) == this.pubKeyHash);
		assert(checkSig(sig, pubKey));
	}
}
