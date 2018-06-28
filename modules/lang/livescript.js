#lang js
// require: vendor/livescript, compile/module, compile/js
// provide: compile_language
(function (ls, module, js) {
    function compile_language(src, runner) {
        const compiled = js.compile_js(src)
        const compiled_body = ls.compile(compiled.body_code, {bare: true});
        return module.CompiledModule(compiled.imports, compiled.exports, compiled_body);
    }

    return {main: function () { console.log("hello"); }, compile_language: compile_language};
})
