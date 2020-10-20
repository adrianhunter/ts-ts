class Ackermann {
	a!: int;
	b!: int;

	ackermann(m: int, n: int): int {
		let stk: bytes = num2bin(m, 1);
		loop(14)(() => {
			if (len(stk) > 0) {
				let top: bytes = stk.slice(0, 1);
				m = unpack(top);

				stk = stk.slice(1, len(stk));

				if (m == 0) {
					n = n + m + 1;
				} else if (n == 0) {
					n = n + 1;
					m = m - 1;
					// push
					stk = num2bin(m, 1) + stk;
				} else {
					stk = num2bin(m - 1, 1) + stk;
					stk = num2bin(m, 1) + stk;
					n = n - 1;
				}
			}
		});

		return n;
	}

	public unlock(y: int) {
		assert(y == this.ackermann(this.a, this.b));
	}
}
