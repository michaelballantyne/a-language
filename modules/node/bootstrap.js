#lang js
// require: compile/flatten, node/platform, compile/runner
// provide: main
(function (g) {
    const fs = require("fs");

    function usage() {
        console.log("Usage: node run.js <modules-path> bootstrap main <modules-path2>");
        process.exit(1);
    }

    function main(args) {
        if (args.length >= 1) {
            const platform = g["node/platform"]["make-platform"](args[0]);
            const text = g["compile/flatten"].flatten(g["compile/runner"]["make-runner"](platform), "node/cli")
            fs.writeFileSync("bootfiles/nodecli.js", text)
        } else {
            usage();
        }
    }

    return { main: main }
})
