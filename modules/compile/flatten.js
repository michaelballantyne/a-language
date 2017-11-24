// require: compile/js, vendor/escodegen
// provide: flatten
(function (compilejs, escodegen) {
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

    function flatten(resolve, main_module_name) {
        if (!(typeof main_module_name === "string" || main_module_name instanceof String)) {
            throw "malformed module name; should be a string: " + asString(module_name);
        }

        function flatten_internal([declarations, visited], module_name) {
            if (visited.has(module_name)) {
                return [declarations, visited];
            }

            const source = resolve(module_name);
            const compiled = compilejs.compileJS(source);

            const [declarations2, visited2] =
                compiled.imports.reduce(flatten_internal, [declarations, visited])

            const newVisited = new Set(visited2)
            newVisited.add(module_name);

            return [
                [...declarations2,
                    moduleInstance(module_name, compiled.body_code, compiled.imports)],
                    newVisited
            ];
        }

        const [declarations, ignore] = flatten_internal([[], new Set()], main_module_name);
        const tree = wrap(declarations, main_module_name);

        return escodegen.generate(tree, { verbatim: "verbatim"} )
    }

    return {
        flatten: flatten
    }
})
