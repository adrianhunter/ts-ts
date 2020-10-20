import { Util } from "../util/contract";

class TicTacToe {
	alice: PubKey;
	bob: PubKey;

	static TURNLEN: int = 1;
	static BOARDLEN: int = 9;
	static EMPTY: byte = "00";
	static ALICE: byte = "01";
	static BOB: byte = "02";

	public move(n: int, sig: Sig, amount: int, txPreimage: SigHashPreimage) {
		assert(Tx.checkPreimage(txPreimage));
		assert(n >= 0 && n < TicTacToe.BOARDLEN);

		let scriptCode: bytes = Util.scriptCode(txPreimage);
		let scriptLen: int = len(scriptCode);

		let boardStart: int = scriptLen - TicTacToe.BOARDLEN;
		// state: turn (1 byte) + board (9 bytes)
		let turn: int = unpack(
			scriptCode.slice(boardStart - TicTacToe.TURNLEN, boardStart)
		);
		let board: bytes = scriptCode.slice(boardStart, len(scriptCode));

		// not filled
		assert(board[n] == TicTacToe.EMPTY);

		let play: byte = turn == 0 ? TicTacToe.ALICE : TicTacToe.BOB;
		let player: PubKey = turn == 0 ? this.alice : this.bob;

		// ensure it's player's turn
		assert(checkSig(sig, player));
		// make the move
		board[n] = play;

		let outputs: bytes = b``;
		if (this.won(board, play)) {
			// winner takes all
			let playerPKH: Ripemd160 = ripemd160(sha256(player));
			let outputScript: bytes = Util.buildPublicKeyHashScript(playerPKH);
			let output: bytes = Util.buildOutput(outputScript, amount);
			outputs = output;
		} else if (this.full(board)) {
			// draw: equally split, i.e., both outputs have the same amount
			let alicePKH: Ripemd160 = ripemd160(sha256(this.alice));
			let aliceScript: bytes = Util.buildPublicKeyHashScript(alicePKH);
			let aliceOutput: bytes = Util.buildOutput(aliceScript, amount);

			let bobPKH: Ripemd160 = ripemd160(sha256(this.bob));
			let bobScript: bytes = Util.buildPublicKeyHashScript(bobPKH);
			let bobOutput: bytes = Util.buildOutput(bobScript, amount);

			outputs = aliceOutput + bobOutput;
		} else {
			// update state: next turn & next board
			let scriptCode_: bytes =
				scriptCode.slice(0, scriptLen - TicTacToe.BOARDLEN) +
				num2bin(1 - turn, TicTacToe.TURNLEN) +
				board;
			let output: bytes = Util.buildOutput(scriptCode_, amount);
		}

		assert(hash256(outputs) == Util.hashOutputs(txPreimage));
	}

	// does play win after current move?
	won(board: bytes, play: byte): bool {
		// three in a row, a column, or a diagnoal
		return (
			(board[0] == play && board[1] == play && board[2] == play) ||
			(board[3] == play && board[4] == play && board[5] == play) ||
			(board[6] == play && board[7] == play && board[8] == play) ||
			(board[0] == play && board[3] == play && board[6] == play) ||
			(board[1] == play && board[4] == play && board[7] == play) ||
			(board[2] == play && board[5] == play && board[8] == play) ||
			(board[0] == play && board[4] == play && board[8] == play) ||
			(board[2] == play && board[4] == play && board[6] == play)
		);
	}

	// is board full?
	full(board: bytes): bool {
		let full: bool = true;
		let i: int = 0;

		loop(9)(() => {
			if (full) {
				if (board[i] == TicTacToe.EMPTY) {
					full = false;
				}
			}
			i = i + 1;
		});

		return full;
	}
}
