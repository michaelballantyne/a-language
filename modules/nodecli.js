// require: resolve, flatten, runner
// provide: main
function (resolve, flatten, runner) {
    function usage() {
        console.log("Usage: node run.js --flatten <module-name> | --run <module-name> <function>");
        process.exit(1);
    }

    function main(args) {
        if (args[0] === "--run") {
            throw "not implemented"
        }
        if (args[0] === "--flatten") {
            console.log(flatten.flatten(resolve.resolve, args[1]))
        }
        else {
            usage()
        }
    }

    return { main: main }
}
