import * as ts from "typescript";
import * as fs from "fs";
import { utils } from "./utils";
// vscode
// all.
export function compileToScrypt(options: {
	sourceFile: ts.SourceFile;
	ctx: ts.TransformationContext;
	typeChecker: ts.TypeChecker;
}) {
	let result = visitEachNode(options.sourceFile, options);
	let imports = Array.from(result.importStatements.values()).join("\n");
	let contracts = Array.from(result.contracts.values()).join("\n");
	let output = imports + "\n\n" + contracts;
	let outputPath = options.sourceFile.fileName.replace(".ts", ".scrypt");
	fs.writeFileSync(outputPath, output);
}

function visitEachNode(source: ts.SourceFile, options) {
	let result = {
		importStatements: new Map(),
		contracts: new Map(),
	};

	function visit(node: ts.Node) {
		if (ts.isClassDeclaration(node)) {
			let scryptContract = `contract ${node.name?.getText()} {`;

			node.members.forEach((member) => {
				if (ts.isPropertyDeclaration(member)) {
					let stateDeco = utils.getDecorator(member, "state");

					let result = `${tsTypeToScryptType(
						member.type
					)} ${member.name.getText()};`;

					member.modifiers?.forEach((mod) => {
						if (mod.kind == ts.SyntaxKind.StaticKeyword) {
							result = `static ${result}`;
						}
					});

					if (member.initializer) {
						result = result.replace(
							";",
							` = ${tsNodeToScrypt(member.initializer, options).code};`
						);
					}

					if (!stateDeco) {
						scryptContract += `\n\t${result}`;
					}
					// member.decorators?
					// let hastStateDeco = utils.getDecoratorName()
				} else if (ts.isConstructorDeclaration(member)) {
					// member.body
					let functionBody = tsFunctionBodyToScrypt(member.body, {
						ctx: options.ctx,
						indent: 2,
						typeChecker: options.typeChecker,
					});
					scryptContract += `\n\tconstructor(${tsParamsToScryptParams(
						member.parameters,
						{ usedStateProps: functionBody.usedStateProps }
					)}) ${functionBody.code}`;
				} else if (ts.isMethodDeclaration(member)) {
					scryptContract += tsMethodToScrypt(member, options).code;
				}
			});

			let finalContract = scryptContract + "\n}";

			result.contracts.set(node, finalContract);
		} else if (ts.isImportDeclaration(node)) {
			let libName = node.moduleSpecifier.getText().replace(/\-/g, ".");

			libName = libName.replace(/\"/g, "");
			let supportedLibs = ['"util.scrypt"'];

			// if (supportedLibs.includes(libName)) {
			result.importStatements.set(libName, `import "${libName}.scrypt";`);
			// }
		}

		return node;
	}

	let foo = ts.visitEachChild(source, visit, options.ctx);

	return result;
}

function tsTypeToScryptType(someType?: ts.TypeNode): string | null {
	if (!someType) return null;

	if (ts.isTypeReferenceNode(someType)) {
		return someType.typeName.getText();
	} else {
		switch (someType.kind) {
			case ts.SyntaxKind.BooleanKeyword: {
				return "bool";
			}
			default: {
				return null;
			}
		}
	}
}

interface Options {
	ctx: ts.TransformationContext;
	typeChecker: ts.TypeChecker;
	usedStateProps: any;
	indent: number;
}

function tsBinaryExpressionToScrypt(
	node: ts.BinaryExpression,
	options: Options
) {
	let right = tsNodeToScrypt(node.right, options);

	let left = tsNodeToScrypt(node.left, { ...options, right });
	let code = node.getText();
	code = `${left.code} ${node.operatorToken.getText()} ${right.code}`;
	return { code };
}

function tsCallExpressionToScrypt(
	node: ts.CallExpression,
	options: Options
): string {
	let result = node.getText();
	if (ts.isPropertyAccessExpression(node.expression)) {
		if (node.expression.name.text == "slice") {
			let convertedSlice = `${node.expression.expression.getText()}[${node.arguments[0].getText()}:  ${node.arguments[1].getText()}]`;

			result = result.replace(result, convertedSlice);
		} else if (node.expression.name.text == "length") {
			// let convertedLength = `len(${node.expression.expression.getText()})`;
			// result = result.replace(result, convertedLength);
		} else if (node.expression.name.text == "concat") {
			let convertedSlice = `${node.expression.expression.getText()}`;

			result = result.replace(result, convertedSlice);
		}
	}

	node.arguments.forEach((arg) => {
		let _result = tsNodeToScrypt(arg, options);

		if (result.indexOf(arg.getText()) > -1) {
			result = result.replace(arg.getText(), _result.code);
		} else {
			// result += _result.code;
		}
	});

	if (ts.isCallExpression(node.expression)) {
		if (ts.isIdentifier(node.expression.expression)) {
			if (node.expression.expression.escapedText == "loop") {
				result = result.replace("(() => ", "");
				result = result.replace(")(", ")");

				result = result.replace(/\)([^)]*)$/, "$1");
			}
		}
	}

	return result;
}

function tsNodeToScrypt(node: ts.Node | undefined, options) {
	if (!node) return { code: "ERROR" };

	let code = node.getText();

	if (ts.isArrowFunction(node)) {
		code = tsFunctionBodyToScrypt(node.body as ts.Block, options).code;
	} else if (ts.isCallExpression(node)) {
		code = tsCallExpressionToScrypt(node, options);
	} else if (ts.isBinaryExpression(node)) {
		code = tsBinaryExpressionToScrypt(node, options).code;
	} else if (ts.isPropertyAccessExpression(node)) {
		code = tsPropertyAccessExpressionToScrypt(node, options).code;
	} else if (ts.isTaggedTemplateExpression(node)) {
		code = tsTaggedTemplateExpressionToScrypt(node).code;
	} else if (ts.isBinaryExpression(node)) {
		code = tsBinaryExpressionToScrypt(node, options).code;
	} else if (ts.isConditionalExpression(node)) {
		code = `${tsNodeToScrypt(node.condition, options).code} ? ${
			tsNodeToScrypt(node.whenTrue, options).code
		} : ${tsNodeToScrypt(node.whenFalse, options).code}`;
	} else if (ts.isStringLiteral(node)) {
		if (code.startsWith('"')) {
			code = code.replace(/\"/g, "'");
		}
	}

	return { code, node };
}

function tsSliceToScrypt(node: ts.PropertyAccessExpression) {}

function tsMethodToScrypt(
	fun: ts.MethodDeclaration,
	options: { ctx; typeChecker }
) {
	let methodKind = ``;
	let methodType = tsTypeToScryptType(fun.type);

	fun.modifiers?.forEach((mod) => {
		if (mod.kind === ts.SyntaxKind.PublicKeyword) {
			methodKind = "public ";
		} else if (mod.kind === ts.SyntaxKind.StaticKeyword) {
			methodKind = "static ";
		}
	});

	let functionBody = tsFunctionBodyToScrypt(fun.body, {
		ctx: options.ctx,
		indent: 2,
		typeChecker: options.typeChecker,
	});

	let code = `\n\t${methodKind}function ${fun.name.getText()}(${tsParamsToScryptParams(
		fun.parameters,
		{ usedStateProps: functionBody.usedStateProps }
	)})${methodType ? `: ${methodType}` : ""}${functionBody.code}`;

	return { code };
}

function tsFunctionBodyToScrypt(
	body: ts.Block | undefined,
	options: {
		ctx: ts.TransformationContext;
		indent: number;
		typeChecker: ts.TypeChecker;
	}
): { code: string; usedStateProps: Map<any, any> } {
	let returnBody = ``;
	let usedStateProps = new Map();
	if (!body) return { code: "{}", usedStateProps };

	// (options as any) = { ...options, usedStateProps };

	function findPropertyAccess(node: ts.Node) {
		if (ts.isPropertyAccessExpression(node)) {
			const symbol = options.typeChecker.getSymbolAtLocation(node);

			if (symbol) {
				let deco = utils.getDecorator(symbol.valueDeclaration, "state");

				if (deco) {
					usedStateProps.set(symbol, { deco });
				}
			}
		}

		return ts.visitEachChild(node, findPropertyAccess, options.ctx);
	}

	ts.visitEachChild(body, findPropertyAccess, options.ctx);

	function visitor(node) {
		let exprText = node.getText();

		let currentIndent = options.indent;

		let isCallExpression = ts.isCallExpression(node);

		while (currentIndent) {
			returnBody += "\t";
			currentIndent--;
		}
		if (ts.isPropertyAccessExpression(node)) {
			exprText = tsPropertyAccessExpressionToScrypt(node, {
				...options,
				usedStateProps,
			});
		} else if (ts.isCallExpression(node)) {
			exprText = tsCallExpressionToScrypt(node, { ...options, usedStateProps });
		} else if (ts.isExpressionStatement(node)) {
			return ts.visitEachChild(node, visitor, options.ctx);
			// if (ts.isCallExpression(node.expression)) {
			// 	exprText = tsCallExpressionToScrypt(node.expression, options);
			// } else {
			// }
		} else if (ts.isVariableStatement(node)) {
			// let exprText = ``

			node.declarationList.declarations.forEach((decla) => {
				if (decla.initializer && ts.isCallExpression(decla.initializer)) {
					exprText = `${tsTypeToScryptType(
						decla.type
					)} ${decla.name.getText()} = ${tsCallExpressionToScrypt(
						decla.initializer,
						{ ...options, usedStateProps }
					)};`;
				} else {
					exprText = `${tsTypeToScryptType(
						decla.type
					)} ${decla.name.getText()} = ${
						tsNodeToScrypt(decla.initializer, options).code
					};`;
				}
			});
		} else if (ts.isIfStatement(node)) {
			// options.indent++;
			exprText = tsIfStatementToScrypt(node, options).code;

			// let bar = tsBinaryExpressionToScrypt(node, { ...options, usedStateProps })
			// 	.code;
			// exprText = exprText.replace(node.getText(), bar);
		} else if (ts.isTaggedTemplateExpression(node)) {
			let result = tsTaggedTemplateExpressionToScrypt(node);

			exprText = exprText.replace(node.getText(), result.code);
		} else if (ts.isReturnStatement(node)) {
			let result = tsNodeToScrypt(node.expression, {
				...options,
				usedStateProps,
			});

			let isAsm = false;
			if (node.expression && ts.isTaggedTemplateExpression(node.expression)) {
				if (node.expression.tag.getText() == "asm") {
					isAsm = true;
				}
			}

			exprText = exprText.replace(
				node.getText(),
				`${isAsm ? "" : "return "} ${result.code}`
			);
		} else if (ts.isBlock(node)) {
			let result = tsFunctionBodyToScrypt(node, options).code;
			exprText = exprText.replace(node.getText(), result);
		} else if (ts.isBinaryExpression(node)) {
			let result = tsNodeToScrypt(node, options).code;
			exprText = exprText.replace(node.getText(), result);
		}

		exprText = exprText.replace(/assert/g, "require");

		if (!exprText.endsWith(";") && !exprText.endsWith("}")) {
			exprText += ";";
		} else {
		}

		returnBody += exprText + "\n";
		return node;
	}
	ts.SyntaxKind.StaticKeyword;
	ts.visitEachChild(body, visitor, options.ctx);

	let returnVal = ` {\n`;

	returnVal += `\t\t${returnBody}
\t}`;

	return {
		code: ` {
${returnBody}
\t}`,
		usedStateProps,
	};
}

function tsTaggedTemplateExpressionToScrypt(node: ts.TaggedTemplateExpression) {
	let code = node.getText();

	let expr = node.getText();
	let cleanExpr = expr.replace("asm`", "asm {");
	cleanExpr = cleanExpr.replace("`", "\n\t\t}");

	let tagName = node.tag.getText();

	if (tagName == "asm") {
		code = code.replace(expr, cleanExpr);
	} else if (tagName == "b") {
		code = code.replace(expr, expr.replace(/\`/g, "'"));
	}

	return { code };
}

function tsIfStatementToScrypt(node: ts.IfStatement, options) {
	let code = node.getText();

	let condition = tsNodeToScrypt(node.expression, options).code;

	code = code.replace(node.expression.getText(), condition);

	let cleanThenBody = tsFunctionBodyToScrypt(
		node.thenStatement as ts.Block,
		options
	);

	code = code.replace(node.thenStatement.getText(), cleanThenBody.code);
	if (node.elseStatement) {
		if (ts.isIfStatement(node.elseStatement)) {
			let cleanElseBody = tsIfStatementToScrypt(node.elseStatement, options);
			code = code.replace(node.elseStatement.getText(), cleanElseBody.code);
		} else {
			let cleanElseBody = tsFunctionBodyToScrypt(
				node.elseStatement as ts.Block,
				options
			);
			code = code.replace(node.elseStatement.getText(), cleanElseBody.code);
		}
	}

	return { code };
}

function tsPropertyAccessExpressionToScrypt(
	node: ts.PropertyAccessExpression,
	options: {
		ctx;
		typeChecker: ts.TypeChecker;
		usedStateProps?: any;
		right?: ts.Node;
	}
): { code: string; usesStateProp: boolean } {
	let code = node.getText();
	let usesStateProp = false;

	let symbol = options.typeChecker.getSymbolAtLocation(node);

	let stateProp = options.usedStateProps?.get(symbol);
	let propertyName = node.name.escapedText;
	let objectName = node.expression.getText();

	if (propertyName == "length") {
		code = code.replace(`${objectName}.length`, `len(${objectName})`);
	} else if (propertyName == "concat") {
		code = code.replace(`.concat(`, ` +`);
	}

	if (stateProp) {
		usesStateProp = true;
		code = `
\t\trequire(Tx.checkPreimage(txPreimage));
\t\tbytes scriptCode = Util.scriptCode(txPreimage);
\t\tint scriptLen = len(scriptCode);
\t\tint ${propertyName} = unpack(scriptCode[scriptLen - Util.DataLen :]);
\t\tbytes scriptCode_ = scriptCode[: scriptLen - Util.DataLen] + num2bin(${propertyName} + 1, Util.DataLen);
\t\tbytes output = Util.buildOutput(scriptCode_, amount);
\t\trequire(hash256(output) == Util.hashOutputs(txPreimage));`;
	}

	return { code, usesStateProp };
}

function tsParamsToScryptParams(
	params: ts.NodeArray<ts.ParameterDeclaration>,
	options: { usedStateProps }
): string {
	let returnParams = ``;

	params.forEach((param, i) => {
		returnParams += `${tsTypeToScryptType(
			param.type
		)} ${param.name.getText()} ${i < params.length - 1 ? "," : ""}`;
	});

	if (options.usedStateProps.size) {
		returnParams += `, SigHashPreimage txPreImage`;
	}

	return returnParams;
}
