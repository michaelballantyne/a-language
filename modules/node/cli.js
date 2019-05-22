#lang js
// require: compile/runner, node/platform
// provide: main
(function (g) {
    function usage() {
        console.log("Usage: node run.js <modules-path> <module-name> <function>");
        process.exit(1);
    }

    function main(args) {
        if (args.length >= 3) {
            const platform = g["node/platform"]["make-platform"](args[0]);
            const module_instance = g["compile/runner"]["make-runner"](platform).run(args[1]);
            module_instance[args[2]](args.slice(3));
        } else {
            usage();
        }
    }

    return { main: main };
})
