// require: compile/runner, node/platform
// provide: main
(function (runner, nodeplatform) {
    const fs = require("fs");
    const vm = require("vm");

    function usage() {
        console.log("Usage: node run.js <module-name> <function>");
        process.exit(1);
    }

    function main(args) {
        if (args.length >= 2) {
            const module_instance = runner.make_runner(nodeplatform).run(args[0]);
            module_instance[args[1]](args.slice(2));
        } else {
            usage();
        }
    }

    return { main: main };
})
