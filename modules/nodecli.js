// require: resolve, bootstrap, runner
// provide: main
function (resolve, bootstrap, runner) {
    function usage() {
        console.log("Usage: node run.js --bootstrap | --run <module-name> <function>");
        process.exit(1);
    }

    function main(args) {
        if (args[0] === "--run") {
            throw "not implemented2"
        }
        if (args[0] === "--bootstrap") {
            bootstrap.main([])
        }
        else {
            usage()
        }
    }

    return { main: main }
}
