(function () {
    const resolve = (// require:
    // provide: resolve
    function () {
        const fs = require("fs")
    
        function resolve(name) {
            const text = fs.readFileSync("modules/" + name + ".js").toString();
    
            return text;
        }
    
        return { resolve: resolve }
    }
    )();
    const compiledmodule = (// require:
    // provide: CompiledModule
    function () {
        const isString = i => typeof i === "string" || i instanceof String
    
        function CompiledModule(imports, exports, body_code) {
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
        }
    
        return { CompiledModule: CompiledModule }
    }
    )();
    const compilejs = (// require: compiledmodule
    // provide: compileJS
    function (compiledmodule) {
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
    
    
            const module_declaration = compiledmodule.CompiledModule(imports, exports, source);
    
            return module_declaration;
        }
    
        return { compileJS: compileJS }
    }
    )(compiledmodule);
    const escodegen = (// require:
    // provide: generate
    function () {
        return require("escodegen");
    }
    )();
    const flatten = (// require: resolve, compilejs, escodegen
    // provide: flatten, main
    function (resolve, compilejs, escodegen) {
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
    
        function main() {
            const main_module_name = process.argv[2]
            const res = flatten(resolve.resolve, main_module_name);
            console.log(res);
        }
    
        return {
            flatten: flatten,
            main: main
        }
    }
    )(resolve, compilejs, escodegen);
    const runner = (// require:
    // provide:
    function () {
        return {}
    }
    )();
    const main = (// require: resolve, flatten, runner
    // provide: main
    function (resolve, flatten, runner) {
        function usage() {
            console.log("Usage: node boot.js --flatten <module-name> | --run <module-name> <function>");
            process.exit(1);
        }
    
        function main() {
            if (process.argv[2] === "--run") {
                throw "not implemented"
            }
            if (process.argv[2] === "--flatten") {
                console.log(flatten.flatten(resolve.resolve, process.argv[3]))
            }
            else {
                usage()
            }
        }
    
        return { main: main }
    }
    )(resolve, flatten, runner);
    return main;
});
