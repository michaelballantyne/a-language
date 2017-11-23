const isString = i => typeof i === "string" || i instanceof String

const LinkModule = function (imports, exports, body_function) {
    if (imports === undefined || !Array.isArray(imports) || !imports.every(isString) ||
        exports === undefined || !Array.isArray(exports) || !exports.every(isString) ||
        body_function === undefined || !((typeof body_function) === "function")) {
        throw "Malformed module declaration"
    }

    return {
        imports: imports,
        exports: exports,
        body_function: body_function
    };
};

const subset = function (left, right) {
    for (var elem of left) {
        if (!right.has(elem)) {
            return false;
        }
    }
    return true;
}

const run_module = function(modules_map, module_name) {
    if (!(typeof module_name === "string" || module_name instanceof String)) {
        throw "malformed module name; should be a string: " + asString(module_name);
    }

    const run_module_internal = function (instance_map, module_name) {
        const existing_instance = instance_map[module_name];
        if (existing_instance !== undefined) {
            return existing_instance;
        }

        const module_declaration = modules_map[module_name];
        if (module_declaration === undefined) {
            throw "No declaration for module of name: " + module_name;
        }


        const imports = module_declaration.imports

        const imports_instantiated =
            imports.reduce(run_module_internal, instance_map);

        const instance =
            module_declaration.body_function.apply(undefined, imports.map(i => imports_instantiated[i]));

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

exports.run_module = run_module;
exports.LinkModule = LinkModule;
