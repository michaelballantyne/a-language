// require:
// provide: main
function () {
    const isString = i => typeof i === "string" || i instanceof String

    function parseDecl(name, line) {
        function malformed() {
            throw "malformed " + name + ": " + line;
        }

        const s1 = line.split(":");

        if (s1[0] !== "// " + name) {
            malformed()
        }

        if (s1[1].trim() == "") {
            return [];
        }

        const s2 = s1[1].split(",").map(i => i.trim());

        if (!s2.every(s => /^[a-zA-Z()]+$/.test(s))) {
            malformed()
        }

        return s2;
    }

    //const evaled = eval(text, {console: console, require: require, process: process})

    // source string -> CompiledModule
    function compileJS(source) {
        const lines = source.split('\n');
        const imports = parseDecl("require", lines[0]);
        const exports = parseDecl("provide", lines[1]);


        const module_declaration = CompiledModule(imports, exports, source);

        return module_declaration;
    }

    const fs = require("fs")
    const escodegen = require("escodegen")

    function resolve(name) {
        const text = fs.readFileSync("modules/" + name + ".js").toString();

        return text;
    }


    const CompiledModule = function (imports, exports, body_code) {
        if (imports === undefined || !Array.isArray(imports) || !imports.every(isString) ||
            exports === undefined || !Array.isArray(exports) || !exports.every(isString) ||
                body_code === undefined || !isString(body_code)) {
            throw "Malformed module declaration"
        }

        return {
            imports: imports,
            exports: exports,
            body_code: body_code
        };
    };

    const flatten = function(resolve, main_module_name) {
        const m = compileJS(resolve("testa"))

        function moduleInstance(name, source, deps) {
            return {
                type: 'VariableDeclaration',
                declarations: [{
                    type: "VariableDeclarator",
                    id: {
                        type: "Identifier",
                        name: name
                    },
                    init: {
                        type: "CallExpression",
                        callee: {
                            type: "Literal",
                            verbatim: source
                        },
                        arguments: deps.map(name => ({ type: "Identifier", name: name }))
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
                                    name: final_module_name
                                }
                            }
                        ]
                    }
                }
            };
        }

        if (!(typeof main_module_name === "string" || main_module_name instanceof String)) {
            throw "malformed module name; should be a string: " + asString(module_name);
        }

        function flatten_internal([declarations, visited], module_name) {
            if (visited.has(module_name)) {
                return [declarations, visited];
            }

            const source = resolve(module_name);
            const compiled = compileJS(source);

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
        const tree = wrap(declarations,
                          main_module_name);

                          return escodegen.generate(tree, { verbatim: "verbatim"} )
    }

    function main() {
        const res = flatten(resolve, "all");
        console.log(res);
    }

    return {
        main: main
    }
}
