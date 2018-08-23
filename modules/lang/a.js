#lang js
// require: compile/reader, compile/compile, compile/parse, compile/module
// provide: compile_language
(function (reader, compile, parse, module) {
    function compile_language(source, load) {
        const sexp = reader.read(source)
        const ast = parse["parse-module"](sexp, load)
        return compile["compile-module"](ast);
    }

    return { compile_language: compile_language }
})
