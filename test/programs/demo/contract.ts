class Demo {
	x: int;
	y: int;

	constructor(x: int, y: int) {
		this.x = x;
		this.y = y;
	}

	sum(a: int, b: int): int {
		return a + b;
	}

	public add(z: int) {
		assert(z == this.sum(this.x, this.y));
	}

	public sub(z: int) {
		assert(z == this.x - this.y);
	}
}
