#lang js
// require: compile/reader, compile/compile, compile/parsea, compile/module
// provide: compile_language
(function (reader, compile, parse, module) {
    function compile_language(source, load) {
        const sexp = reader.read(source)
        const ast = parse["parse-module"](sexp, load)
        //console.log(ast);
        //return module.CompiledModule([],[], "(function () { return {main: function () {}}; })");
        return compile.compile_module(ast);
    }

    return { compile_language: compile_language }
})
