import * as ts from "typescript";

export const utils = {
	getDecoratorName(deco: ts.Decorator): string {
		if (ts.isCallExpression(deco.expression)) {
			return deco.expression.expression.getText().trim();
		} else {
			return deco.expression.getText().trim();
		}
	},

	getDecorator(node: ts.Node, decoName: string) {
		return node.decorators?.find((deco) => {
			let name = utils.getDecoratorName(deco);

			return name == decoName;
		});
	},
};
