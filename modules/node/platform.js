#lang js
// require:
// provide: resolve, eval_module
(function () {
    const fs = require("fs")
    const vm = require("vm");

    function resolve(name) {
        const text = fs.readFileSync("modules/" + name + ".js").toString();

        return text;
    }

    function eval_module(text) {
        return vm.runInNewContext(text, {setImmediate: setImmediate, console: console, require: require, process: process});
    }

    return { resolve: resolve,
             eval_module: eval_module }
})
