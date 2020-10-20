/**
A Bitcoin contract which is instantiated with a shasum of known data
required to be input to spend the output with the specified public key.
Demo values:
sha256("abc") = 0xba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad
bytes("abc") = 0x616263
**/

// Main Data Check and P2PKH Contract

class HashPuzzleP2PKH {
	pubKeyHash: Ripemd160;
	hash: Sha256;

	// Main function verifies the data matches the provided Sha256Sum and Public Key
	public verify(data: bytes, sig: Sig, pubKey: PubKey) {
		// Initialise Data Check
		let hashPuzzle: HashPuzzleSha256 = new HashPuzzleSha256(this.hash);
		// Initialise P2PKH
		let p2pk: P2PKH = new P2PKH(this.pubKeyHash);
		// Try unlock both contracts
		assert(hashPuzzle.spend(data) && p2pk.spend(sig, pubKey));
	}
}
