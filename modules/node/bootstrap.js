// require: compile/flatten, node/resolve
// provide: main
(function (flatten, noderesolve) {
    const fs = require("fs");

    function main(args) {
        const text = flatten.flatten(noderesolve.resolve, "node/cli")
        fs.writeFileSync("bootfiles/nodecli.js", text)
    }

    return { main: main }
})
