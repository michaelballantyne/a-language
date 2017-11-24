// require: compile/js
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
