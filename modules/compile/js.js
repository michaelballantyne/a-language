#lang js
// require: compile/module
// provide: compile_js
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

        if (!s2.every(s => /^[a-zA-Z_\/]+$/.test(s))) {
            malformed()
        }

        return s2;
    }

    // source string -> CompiledModule
    function compile_js(source) {
        const lines = source.split('\n');
        const imports = parseDecl("require", lines[0]);
        const exports = parseDecl("provide", lines[1]);
        const body = lines.slice(2).join("\n")

        const module_declaration = compiledmodule.CompiledModule(imports, exports, body);

        return module_declaration;
    }

    return { compile_js: compile_js }
})
