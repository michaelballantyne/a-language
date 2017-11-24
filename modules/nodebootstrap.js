// require: flatten, noderesolve
// provide: main
(function (flatten, noderesolve) {
    const fs = require("fs");

    function main(args) {
        const text = flatten.flatten(noderesolve.resolve, "nodecli")
        fs.writeFileSync("bootfiles/nodecli.js", text)
    }

    return { main: main }
})
