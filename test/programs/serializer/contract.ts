import { Util } from "../util/contract";

// a de/serializer for basic types

export class Reader {
	buf: bytes;
	pos: int;

	constructor(buf: bytes) {
		this.buf = buf;
		this.pos = 0;
	}

	eof(): bool {
		return this.pos >= len(this.buf);
	}

	readBytes(): bytes {
		let ret: bytes = Util.readVarint(this.buf.slice(this.pos, len(this.buf)));
		let l: int = Util.readVarintLen(this.buf.slice(this.pos, len(this.buf)));
		this.pos = this.pos + l;
		return ret;
	}

	readBool(): bool {
		return this.readBytes() != b`00`;
	}

	readInt(): int {
		return unpack(this.readBytes());
	}
}

export class Writer {
	// return VarInt encoding
	static writeBytes(x: bytes): bytes {
		// VarInt encoding
		return Util.writeVarint(x);
	}

	// uses fixed 1 byte to represent a boolean, plus length
	static writeBool(x: bool): bytes {
		return this.writeBytes(x ? b`01` : b`00`);
	}

	// int is little endian
	static writeInt(x: int): bytes {
		return this.writeBytes(pack(x));
	}
}

class Test {
	public main(f: bool, b: bytes, i: int) {
		{
			let buf: bytes = Writer.writeBool(f);

			let r: Reader = new Reader(buf);
			let f_: bool = r.readBool();
			assert(f_ == f);
			assert(r.eof());
		}

		{
			let buf: bytes = Writer.writeBytes(b);

			let r: Reader = new Reader(buf);
			let b_: bytes = r.readBytes();
			assert(b_ == b);
			assert(r.eof());
		}

		{
			let buf: bytes = Writer.writeInt(i);

			let r: Reader = new Reader(buf);
			let i_: int = r.readInt();
			assert(i_ == i);
			assert(r.eof());
		}

		let buf: bytes =
			Writer.writeInt(i) +
			Writer.writeBytes(b) +
			Writer.writeBytes(b) +
			Writer.writeBool(f) +
			Writer.writeInt(i) +
			Writer.writeBytes(b);
		let r: Reader = new Reader(buf);

		let i_: int = r.readInt();
		assert(i_ == i);
		assert(!r.eof());
		let b_: bytes = r.readBytes();
		assert(b_ == b);
		b_ = r.readBytes();
		assert(b_ == b);
		let f_: bool = r.readBool();
		assert(f_ == f);
		i_ = r.readInt();
		assert(i_ == i);
		b_ = r.readBytes();
		assert(b_ == b);
		assert(r.eof());
	}
}
