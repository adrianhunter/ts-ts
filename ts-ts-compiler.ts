import * as ts from "typescript";
import glob from "glob";
import path from "path";
import { compileToScrypt } from "./compile-ts-to-scrypt";
import { transformCalls } from "./transform-calls";
export default function (
	program: ts.Program,
	pluginOptions: { include: string }
) {
	return (ctx: ts.TransformationContext) => {
		let foo = path.resolve(process.cwd(), pluginOptions.include);

		// let nice = process.cwd() + pluginOptions.modelFiles
		let files = glob.sync(foo);

		let typeChecker = program.getTypeChecker();

		return (sourceFile: ts.SourceFile) => {
			if (files.includes(sourceFile.fileName)) {
				function visitor(node: ts.Node): ts.Node {
					// if (ts.isCallExpression(node)) {
					//     return ts.createLiteral('call');

					// }

					if (ts.isClassDeclaration(node)) {
					} else {
						// "./dist"
						let { result } = transformCalls(node, { ctx, typeChecker });

						node = result;
					}

					return ts.visitEachChild(node, visitor, ctx);
				}

				compileToScrypt({ sourceFile, ctx, typeChecker });

				let foo = ts.visitEachChild(sourceFile, visitor, ctx);

				program.emit;

				return foo;
			} else {
				return sourceFile;
			}
		};
	};
}
