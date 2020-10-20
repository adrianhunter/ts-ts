let Reflect = {
	metadata(args?: any, foo?: any) {
		return function (target: any, key: string) {};
		// return function() {}
	},
};

export class Contract {
	async sync() {}

	static async query() {}
}

// var x = new NumberWrapper(1);

// // The right-hand side of an arithmetic operation
// // must be of type 'any', 'number' or an enum type.
// console.log(2 + x);
