#lang js
// require:
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
