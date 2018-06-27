// require: vendor/immutable, compile/lang, vendor/escodegen, compile/js
// provide: flatten
(function (Immutable, lang, escodegen, compilejs) {
    function escapeModuleName(name) {
        return name.replace("/", "_");
    }

    function moduleInstance(name, source, deps) {
        return {
            type: 'VariableDeclaration',
            declarations: [{
                type: "VariableDeclarator",
                id: {
                    type: "Identifier",
                    name: escapeModuleName(name)
                },
                init: {
                    type: "CallExpression",
                    callee: {
                        type: "Literal",
                        verbatim: source
                    },
                    arguments: deps.map(name => ({ type: "Identifier", name: escapeModuleName(name) }))
                }
            }],
            kind: "const"
        };
    }

    function wrap(declarations, final_module_name) {
        return {
            type: "ExpressionStatement",
            expression: {
                type: "FunctionExpression",
                id: null,
                params: [],
                body: {
                    type: "BlockStatement",
                    body: [
                        ...declarations,
                        {
                            type: "ReturnStatement",
                            argument: {
                                type: "Identifier",
                                name: escapeModuleName(final_module_name)
                            }
                        }
                    ]
                }
            }
        };
    }

    function flatten(platform, runner, main_module_name) {
        if (!(typeof main_module_name === "string" || main_module_name instanceof String)) {
            throw "malformed module name; should be a string: " + asString(module_name);
        }

        function flatten_internal([declarations, visited], module_name) {
            if (visited.has(module_name)) {
                return [declarations, visited];
            }

            const source = platform.resolve(module_name);
            const compiled = compilejs.compile_js(source);
            //const compiled = runner.load(module_name);

            const [declarationsAfterImports, visitedAfterImports] =
                compiled.imports.reduce(flatten_internal, [declarations, visited])

            const declarationCode = moduleInstance(module_name, compiled.body_code, compiled.imports);
            return [
                declarationsAfterImports.push(declarationCode),
                visitedAfterImports.add(module_name)
            ];
        }

        const [declarations,] = flatten_internal([Immutable.List(), Immutable.Set()], main_module_name);
        const tree = wrap(declarations.toArray(), main_module_name);

        return escodegen.generate(tree, { verbatim: "verbatim"} )
    }

    return {
        flatten: flatten
    }
})
