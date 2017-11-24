// require: compile/runner, node/resolve
// provide: main
(function (runner, noderesolve) {
    const fs = require("fs");
    const vm = require("vm");

    function eval_module(text) {
        return vm.runInNewContext(text, {setImmediate: setImmediate, console: console, require: require, process: process});
    }

    function usage() {
        console.log("Usage: node run.js <module-name> <function>");
        process.exit(1);
    }

    function main(args) {
        if (args.length >= 2) {
            const module_instance = runner.run(noderesolve.resolve, eval_module, args[0])
            module_instance[args[1]](args.slice(2));
        } else {
            usage();
        }
    }

    return { main: main };
})
