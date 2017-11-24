// require:
// provide: resolve
(function () {
    const fs = require("fs")

    function resolve(name) {
        const text = fs.readFileSync("modules/" + name + ".js").toString();

        return text;
    }

    return { resolve: resolve }
})
