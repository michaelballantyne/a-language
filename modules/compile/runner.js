// require: vendor/immutable, compile/lang
// provide: run
(function (Immutable, lang) {
    const run = function(resolve, eval_module, module_name) {
        if (!(typeof module_name === "string" || module_name instanceof String)) {
            throw "malformed module name; should be a string: " + module_name;
        }

        function load(module_name) {
            const module_source = resolve(module_name);
            const module_declaration = lang.compile_via_lang(module_source, load, (m) => run(resolve, eval_module, m));
            return module_declaration;
        }

        const run_module_internal = function (instance_map, module_name) {
            if (instance_map.has(module_name)) {
                return instance_map;
            }

            const module_declaration = load(module_name)

            const imports = module_declaration.imports

            const imports_instantiated =
                imports.reduce(run_module_internal, instance_map);

            const body_function = eval_module(module_declaration.body_code);
            const instance =
                body_function.apply(undefined, imports.map(i => imports_instantiated.get(i)));

            if (!(Immutable.Collection(module_declaration.exports).isSubset(Immutable.Collection(Object.keys(instance))))) {
                throw "Module instance does not include all keys listed in exports: " + module_name;
            }

            return imports_instantiated.set(module_name, instance);
        }

        const instance_map = run_module_internal(Immutable.Map(), module_name)
        return instance_map.get(module_name);
    }

    return { run: run}
})
