#lang js
// require: vendor/immutable, compile/lang
// provide: make_runner
(function (Immutable, lang) {
    function make_runner(platform) {
        var declaration_cache = Immutable.Map()

        function load(module_name) {
            if (declaration_cache.has(module_name)) {
                return declaration_cache.get(module_name);
            } else {
                const module_source = platform.resolve(module_name);
                const module_declaration = lang.compile_via_lang(module_source, {load: load, run: run});

                module_declaration.body_function = platform.eval_module(module_declaration.body_code);

                declaration_cache = declaration_cache.set(module_name, module_declaration);
                return module_declaration;
            }
        }

        function run(module_name) {
            if (!(typeof module_name === "string" || module_name instanceof String)) {
                throw "malformed module name; should be a string: " + module_name;
            }

            const run_module_internal = function (instance_map, module_name) {
                if (instance_map.has(module_name)) {
                    return instance_map;
                }

                const module_declaration = load(module_name)

                const imports_instantiated =
                    module_declaration.imports.reduce(run_module_internal, instance_map);

                const instance =
                    module_declaration.body_function.apply(undefined, module_declaration.imports.map(i => imports_instantiated.get(i)));

                if (!(Immutable.Collection(module_declaration.exports).isSubset(Immutable.Collection(Object.keys(instance))))) {
                    throw "Module instance does not include all keys listed in exports: " + module_name;
                }

                return imports_instantiated.set(module_name, instance);
            }

            const instance_map = run_module_internal(Immutable.Map(), module_name)
            return instance_map.get(module_name);
        }

        return {load: load, run: run};
    }

    return { make_runner: make_runner}
})
