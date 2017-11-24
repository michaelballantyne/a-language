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
    const bootstrap = (// require: flatten, resolve
    // provide: main
    function (flatten, resolve) {
        const fs = require("fs");
        
        function main(args) {
            const text = flatten.flatten(resolve.resolve, "nodecli")
            fs.writeFileSync("bootfiles/nodecli.js", text)
        }
    
        return { main: main }
    }
    )(flatten, resolve);
    const runner = (// require: compilejs
    // provide: run
    function (compilejs) {
        const subset = function (left, right) {
            for (var elem of left) {
                if (!right.has(elem)) {
                    return false;
                }
            }
            return true;
        }
    
        const run = function(resolve, eval_module, module_name) {
            if (!(typeof module_name === "string" || module_name instanceof String)) {
                throw "malformed module name; should be a string: " + module_name;
            }
    
            const run_module_internal = function (instance_map, module_name) {
                const existing_instance = instance_map[module_name];
                if (existing_instance !== undefined) {
                    return existing_instance;
                }
    
                const module_source = resolve(module_name);
                const module_declaration = compilejs.compileJS(module_source);
    
                const imports = module_declaration.imports
    
                const imports_instantiated =
                    imports.reduce(run_module_internal, instance_map);
    
                const body_function = eval_module(module_declaration.body_code);
                const instance =
                    body_function.apply(undefined, imports.map(i => imports_instantiated[i]));
    
                if (!subset(new Set(module_declaration.exports), new Set(Object.keys(instance)))) {
                    throw "Module instance does not include all keys listed in exports: " + module_name;
                }
    
                return {
                    ...imports_instantiated,
                    [module_name]: instance
                }
            }
    
            return run_module_internal({}, module_name)[module_name];
        }
    
        return { run: run}
    }
    )(compilejs);
    const nodecli = (// require: bootstrap, runner
    // provide: main
    function (bootstrap, runner) {
        const fs = require("fs")
        const vm = require("vm")
    
        function resolve(name) {
            const text = fs.readFileSync("modules/" + name + ".js").toString();
    
            return text;
        }
    
        function eval_module(text) {
            return vm.runInNewContext(text, {console: console, require: require, process: process})
        }
    
        function usage() {
            console.log("Usage: node run.js --bootstrap | --run <module-name> <function>");
            process.exit(1);
        }
    
        function main(args) {
            if (args[0] === "--run") {
                const module_instance = runner.run(resolve, eval_module, args[1])
                module_instance["main"](args.slice(2));
            } else if (args[0] === "--bootstrap") {
                bootstrap.main([])
            } else {
                usage()
            }
        }
    
        return { main: main }
    }
    )(bootstrap, runner);
    return nodecli;
});