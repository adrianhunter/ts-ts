import * as ts from "typescript";
import { tsquery } from "@phenomnomnominal/tsquery";
export function transformCalls(
	node: ts.Node,
	options: { ctx: ts.TransformationContext; typeChecker: ts.TypeChecker }
) {
	function visit(node: ts.Node) {
		if (ts.isBlock(node)) {
			const extraCode: any = [];
			let i = 0;

			function searchStatement(node: ts.Node) {
				if (ts.isNewExpression(node)) {
					extraCode.push({
						code: `{
            let state = {foo: 1};
          
          }`,
						index: i,
					});
				}
				return ts.visitEachChild(node, searchStatement, options.ctx);
			}

			node.statements.forEach((statement, index) => {
				i = index;

				ts.visitEachChild(statement, searchStatement, options.ctx);
			});

			let newStatements = [...node.statements];

			let extraStatements = extraCode.map(({ code, index }) => {
				const ast = tsquery.ast(code);
				const block: any = tsquery(ast, "Block")[0] as ts.Block;
				block.pos = -1;
				block.end = -1;

				newStatements.splice(index + 1, 0, ...block.statements);
			});

			if (extraCode.length) {
			}
			node = ts.factory.updateBlock(node, [...newStatements]);
		}

		return node;
	}

	let result = ts.visitEachChild(node, visit, options.ctx);

	return { result };
}

// function
// function findParent(node: ts.Node): ts.Block {
// 	if (!node.parent) return null;

// 	if (!ts.isBlock(node.parent)) {
// 		return findParent(node.parent);
// 	} else {
// 		return node.parent;
// 	}
// }
