(function () {
    const compile_module = (// require:
    // provide: CompiledModule
    (function () {
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
    })
    )();
    const compile_js = (// require: compile/module
    // provide: compileJS
    (function (compiledmodule) {
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
    
            if (!s2.every(s => /^[a-zA-Z\/]+$/.test(s))) {
                malformed()
            }
    
            return s2;
        }
    
        // source string -> CompiledModule
        function compileJS(source) {
            const lines = source.split('\n');
            const imports = parseDecl("require", lines[0]);
            const exports = parseDecl("provide", lines[1]);
    
    
            const module_declaration = compiledmodule.CompiledModule(imports, exports, source);
    
            return module_declaration;
        }
    
        return { compileJS: compileJS }
    })
    )(compile_module);
    const compile_runner = (// require: compile/js
    // provide: run
    (function (compilejs) {
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
    })
    )(compile_js);
    const node_resolve = (// require:
    // provide: resolve
    (function () {
        const fs = require("fs")
    
        function resolve(name) {
            const text = fs.readFileSync("modules/" + name + ".js").toString();
    
            return text;
        }
    
        return { resolve: resolve }
    })
    )();
    const node_cli = (// require: compile/runner, node/resolve
    // provide: main
    (function (runner, noderesolve) {
        const fs = require("fs");
        const vm = require("vm");
    
        function eval_module(text) {
            return vm.runInNewContext(text, {console: console, require: require, process: process});
        }
    
        function usage() {
            console.log("Usage: node run.js <module-name> <function>");
            process.exit(1);
        }
    
        function main(args) {
            if (args.length >= 2) {
                const module_instance = runner.run(noderesolve.resolve, eval_module, args[0])
                module_instance[args[1]](args.slice(2));
            } else {
                usage();
            }
        }
    
        return { main: main };
    })
    )(compile_runner, node_resolve);
    return node_cli;
});