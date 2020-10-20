import { Util } from "../util/contract";

import { MerkleTree } from "../merkleTree/contract";

class merkleToken {
	price!: int;

	public buyMore(
		txPreimage: SigHashPreimage,
		amount: int,
		changePKH: Ripemd160,
		payoutPKH: Ripemd160,
		changeSats: int,
		prevBalance: int,
		merklePath: bytes
	) {
		let sigHashType: SigHashType =
			SigHash.ANYONECANPAY | SigHash.ALL | SigHash.FORKID;
		assert(Util.checkPreimageSigHashType(txPreimage, sigHashType));

		assert(amount > 0);

		let scriptCode: bytes = Util.scriptCode(txPreimage);
		let scriptLen: int = len(scriptCode);

		let balanceTableRoot: bytes = scriptCode.slice(
			scriptLen - 32,
			len(scriptCode)
		);

		let oldLeaf: bytes = sha256(payoutPKH + num2bin(prevBalance, 1));
		let newLeaf: bytes = sha256(payoutPKH + num2bin(prevBalance + amount, 1));
		let newBalanceTableRoot: bytes = MerkleTree.updateLeaf(
			oldLeaf,
			newLeaf,
			merklePath,
			balanceTableRoot
		);

		let newScriptCode: bytes =
			scriptCode.slice(0, scriptLen - 32) + newBalanceTableRoot;

		let cost: int = amount * this.price;

		let newBalance: int = Util.value(txPreimage) + cost;
		let marketOutput: bytes = Util.buildOutput(newScriptCode, newBalance);

		// Expect the additional CHANGE output
		let changeScript: bytes = Util.buildPublicKeyHashScript(changePKH);
		let changeOutput: bytes = Util.buildOutput(changeScript, changeSats);

		let hashOutputs: Sha256 = hash256(marketOutput + changeOutput);

		assert(hashOutputs == Util.hashOutputs(txPreimage));
	}

	public buy(
		txPreimage: SigHashPreimage,
		amount: int,
		changePKH: Ripemd160,
		payoutPKH: Ripemd160,
		changeSats: int,
		lastEntry: bytes,
		lastMerklePath: bytes
	) {
		let sigHashType: SigHashType =
			SigHash.ANYONECANPAY | SigHash.ALL | SigHash.FORKID;
		assert(Util.checkPreimageSigHashType(txPreimage, sigHashType));

		assert(amount > 0);

		let scriptCode: bytes = Util.scriptCode(txPreimage);
		let scriptLen: int = len(scriptCode);

		let balanceTableRoot: bytes = scriptCode.slice(
			scriptLen - 32,
			len(scriptCode)
		);

		// Using the entry makes sure that new Leaf are added at the same depth
		let newLeaf: bytes = sha256(payoutPKH + num2bin(amount, 1));
		let newBalanceTableRoot: bytes = MerkleTree.addLeafSafe(
			lastEntry,
			lastMerklePath,
			balanceTableRoot,
			newLeaf
		);

		let newScriptCode: bytes =
			scriptCode.slice(0, scriptLen - 32) + newBalanceTableRoot;

		let cost: int = amount * this.price;

		let newBalance: int = Util.value(txPreimage) + cost;
		let marketOutput: bytes = Util.buildOutput(newScriptCode, newBalance);

		// Expect the additional CHANGE output
		let changeScript: bytes = Util.buildPublicKeyHashScript(changePKH);
		let changeOutput: bytes = Util.buildOutput(changeScript, changeSats);

		let hashOutputs: Sha256 = hash256(marketOutput + changeOutput);

		assert(hashOutputs == Util.hashOutputs(txPreimage));
	}

	public sell(
		txPreimage: SigHashPreimage,
		amount: int,
		pubKey: PubKey,
		sig: Sig,
		merklePath: bytes,
		oldBalance: int,
		payoutSats: int
	) {
		assert(Tx.checkPreimage(txPreimage));
		assert(amount > 0);

		let scriptCode: bytes = Util.scriptCode(txPreimage);
		let scriptLen: int = len(scriptCode);

		let balanceTableRoot: bytes = scriptCode.slice(
			scriptLen - 32,
			len(scriptCode)
		);

		let address: Ripemd160 = hash160(pubKey);
		assert(checkSig(sig, pubKey));

		let newBalance: int = oldBalance - amount;
		assert(newBalance >= 0);

		let oldEntry: bytes = address + num2bin(oldBalance, 1);
		let newEntry: bytes = address + num2bin(newBalance, 1);

		let newBalanceTableRoot: bytes = MerkleTree.updateLeaf(
			sha256(oldEntry),
			sha256(newEntry),
			merklePath,
			balanceTableRoot
		);

		let newScriptCode: bytes =
			scriptCode.slice(0, scriptLen - 32) + newBalanceTableRoot;
		let credit: int = amount * this.price;
		let newMarketBalance: int = Util.value(txPreimage) - credit;

		let marketOutput: bytes = Util.buildOutput(newScriptCode, newMarketBalance);

		let payoutScript: bytes = Util.buildPublicKeyHashScript(address);
		let payoutOutput: bytes = Util.buildOutput(payoutScript, payoutSats);

		let hashOutputs: Sha256 = hash256(marketOutput + payoutOutput);

		assert(hashOutputs == Util.hashOutputs(txPreimage));
	}
}
