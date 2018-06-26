// require: compile/flatten, node/platform, compile/runner
// provide: main
(function (flatten, nodeplatform, runner) {
    const fs = require("fs");

    function main(args) {
        const text = flatten.flatten(runner.make_runner(nodeplatform), "node/cli")
        fs.writeFileSync("bootfiles/nodecli.js", text)
    }

    return { main: main }
})
