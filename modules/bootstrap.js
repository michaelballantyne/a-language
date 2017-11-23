// require: flatten, resolve
// provide: main
function (flatten, resolve) {
    const fs = require("fs");
    
    function main(args) {
        const text = flatten.flatten(resolve.resolve, "nodecli")
        fs.writeFileSync("bootfiles/nodecli.js", text)
    }

    return { main: main }
}
