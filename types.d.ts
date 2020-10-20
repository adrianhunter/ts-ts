interface stateOptions {
	size?: int;
	type: "preImage" | "offChain";
}

export global {
	/*~ Here, export things that go in the global namespace, or augment
	 *~ existing declarations in the global namespace
	 */
	// interface String {
	//     fancyFormat(opts: StringFormatOptions): string;

	// }

	export const OpCode = {
		OP_DUP: 1,
		OP_HASH160: 1,
		OP_EQUALVERIFY: 1,

		OP_CHECKSIG: 1,
	};

	export type Ripemd160 = bytes;
	export type Sha256 = bytes;
	export type auto = any;

	export type PubKey = bytes;
	export type PrivKey = bytes;

	export type Sig = bytes;
	// export type byte = any;

	export type bytes = any;

	// export class bytes {
	// 	valueOf(): number {
	// 		return 123;
	// 	}
	// 	slice(a, b) {}
	// }
	export class byte {}

	export type int = number;

	export type bool = boolean;

	export type SigHashPreimage = bytes;
	export function SigHashPreimage(a: any): SigHashPreimage {}
	export type SigHashType = bytes;

	export function SigHashType(a: any): SigHashType {}

	export function b(a: any): bytes {}

	export function pack(a: any): bytes {}

	export function ripemd160(a: any): bytes {
		// return function (fn) {};
	}
	export function loop(times: number) {
		return function (fn) {};
	}

	export function asm<ReturnType>(code): ReturnType {
		return {} as ReturnType;
	}

	export function assert(...args: any) {}

	export function num2bin(a: any, b: any): bytes {}

	export function hash256(a: any): bytes {
		return [];
	}

	export function len(a: any): int {
		return Math.random();
	}

	export function unpack(a: any): int {
		return 1;
	}

	export function hash160(input: any): bytes {
		return "";
	}

	export function checkSig(a: any, b: any): boolean {
		return true;
	}

	export function sha256(a: any): bytes {
		return "";
	}

	export function contract() {
		return function (constructor: Function) {
			// return Reflect.metadata(modelSymbol, {});
		};
	}

	export class HashPuzzleSha256 {
		constructor(a: any) {}
		spend(a: any): boolean {
			return true;
		}
	}

	export class P2PKH {
		constructor(a: any) {}

		spend(a: any, b: any): boolean {
			return true;
		}
	}

	export class Tx {
		static checkPreimage(a: any) {}

		static checkPreimageAdvanced(...a: any): bool {
			return true;
		}
	}

	// export class FOOOO {
	// 	valueOf() {
	// 		return 123
	// 	}
	// }

	const formatMetadataKey = Symbol("state");

	export function state(options?: stateOptions | stateOptions["type"]) {
		return Reflect.metadata(formatMetadataKey, {});
	}

	export function PubKey(a: any): PubKey {}
	export function PrivKey(a: any): PrivKey {}

	export const SigHash = {
		ANYONECANPAY: 1,
		ALL: 1,
		FORKID: 1,
	};
}

export type Ripemd160 = string;

export {};

// let a = new FOOOO();

// a = a + 123;
