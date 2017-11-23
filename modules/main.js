// require: resolve, flatten, runner
// provide: main
function (resolve, flatten, runner) {
    function usage() {
        console.log("Usage: node boot.js --flatten <module-name> | --run <module-name> <function>");
        process.exit(1);
    }

    function main() {
        if (process.argv[2] === "--run") {
            throw "not implemented"
        }
        if (process.argv[2] === "--flatten") {
            console.log(flatten.flatten(resolve.resolve, process.argv[3]))
        }
        else {
            usage()
        }
    }

    return { main: main }
}
