export class MerkleTree {
	static calculateMerkleRoot(leaf: bytes, merklePath: bytes): bytes {
		let i: int = 0;
		let merklePathLength: int = len(merklePath) / 33;
		let merkleValue: bytes = leaf;
		loop(20)(() => {
			if (i < merklePathLength) {
				let left: int = unpack(merklePath.slice(i * 33 + 32, i * 33 + 33));
				if (left) {
					merkleValue = sha256(
						merkleValue + merklePath.slice(i * 33, i * 33 + 32)
					);
				} else {
					merkleValue = sha256(
						merklePath.slice(i * 33, i * 33 + 32) + merkleValue
					);
				}
				i = i + 1;
			}
		});
		return merkleValue;
	}

	static verifyLeaf(
		leaf: bytes,
		merklePath: bytes,
		merkleRoot: bytes
	): boolean {
		let merkleValue: bytes = MerkleTree.calculateMerkleRoot(leaf, merklePath);
		return merkleValue == merkleRoot;
	}

	static updateLeaf(
		oldLeaf: bytes,
		newLeaf: bytes,
		merklePath: bytes,
		oldMerkleRoot: bytes
	): bytes {
		let i: int = 0;
		let merklePathLength: int = len(merklePath) / 33;
		let oldMerkleValue: bytes = oldLeaf;
		let newMerkleValue: bytes = newLeaf;

		loop(20)(() => {
			if (i < merklePathLength) {
				let left: int = unpack(merklePath.slice(i * 33 + 32, i * 33 + 33));
				let oldNeighbor: bytes = merklePath.slice(i * 33, i * 33 + 32);
				let newNeighbor: bytes =
					oldNeighbor == oldMerkleValue ? newMerkleValue : oldNeighbor;

				if (left) {
					oldMerkleValue = sha256(oldMerkleValue + oldNeighbor);
					newMerkleValue = sha256(newMerkleValue + newNeighbor);
				} else {
					oldMerkleValue = sha256(oldNeighbor + oldMerkleValue);
					newMerkleValue = sha256(newNeighbor + newMerkleValue);
				}
				i = i + 1;
			}
		});

		assert(oldMerkleValue == oldMerkleRoot);

		return newMerkleValue;
	}

	static addLeaf(
		lastLeaf: bytes,
		lastMerklePath: bytes,
		oldMerkleRoot: bytes,
		newLeaf: bytes
	): bytes {
		assert(MerkleTree.verifyLeaf(lastLeaf, lastMerklePath, oldMerkleRoot));

		let i: int = 0;
		let depth: int = len(lastMerklePath) / 33;
		let merkleValue: bytes = newLeaf;
		let lastLeafValue: bytes = lastLeaf;
		let joined: boolean = false;

		loop(20)(() => {
			if (i < depth) {
				let sibling: bytes = lastMerklePath.slice(i * 33, i * 33 + 32);
				let left: int = unpack(lastMerklePath.slice(i * 33 + 32, i * 33 + 33));

				if (left) {
					if (joined) {
						assert(sibling == merkleValue);
						merkleValue = sha256(merkleValue + sibling);
					} else {
						assert(sibling == lastLeafValue);
						merkleValue = sha256(lastLeafValue + merkleValue);
					}
					joined = true;
				} else {
					if (joined) {
						merkleValue = sha256(sibling + merkleValue);
					} else {
						merkleValue = sha256(merkleValue + merkleValue);
						lastLeafValue = sha256(sibling + lastLeafValue);
					}
				}
				i = i + 1;
			}
		});

		if (!joined) {
			merkleValue = sha256(oldMerkleRoot + merkleValue);
		}

		return merkleValue;
	}

	/**
	 *  Makes sure that the new leaf is added at the same depth.
	 */
	static addLeafSafe(
		lastEntry: bytes,
		lastMerklePath: bytes,
		oldMerkleRoot: bytes,
		newLeaf: bytes
	): bytes {
		let lastLeaf: bytes = sha256(lastEntry);
		return MerkleTree.addLeaf(lastLeaf, lastMerklePath, oldMerkleRoot, newLeaf);
	}
}
