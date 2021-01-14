#lang js
// require:
// provide: make-platform, exit, node-require
(function (g) {
    const fs = require("fs")
    const vm = require("vm");

    function make_platform(path) {

        function resolve(name) {
            const afilename = path + "/" + name + ".a";
            const jsfilename = path + "/" + name + ".js";

            var text;
            let filename;
            try {
              text = fs.readFileSync(afilename).toString();
              filename = afilename;
            } catch (err) {
              text = fs.readFileSync(jsfilename).toString();
              filename = jsfilename;
            }

            return {
                string: text,
                source: filename,
                index: 0,
                srcpos: {line: 1, column: 0}
            };
        }

        function eval_module(text) {
            return vm.runInNewContext(text, {setImmediate: setImmediate, console: console, require: require, process: process});
        }

        return { resolve: resolve,
                 "eval-module": eval_module }
    }

    return { "make-platform": make_platform, "exit": process.exit, "node-require": require};
})
