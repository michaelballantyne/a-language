const util = require('util')
const assert = require("assert")

let chunks = [];
process.stdin.resume()
process.stdin.on('data', function(chunk) { chunks.push(chunk); });
process.stdin.on('end', function() {
    let read = chunks.join("");
    try {
        console.log("\nParsing\n")

        let parse_result = parse(top, read)
        if (!parse_result[position]) {
            throw ["parse failed", parse_result];
        }

        let parsed = parse_result[result]

        console.log(util.inspect(parsed, false, null));

        console.log("\nCompiling\n")

        let compile_result = compile(parsed)

        let compiled = compile_result;

        console.log(util.inspect(compiled, false, null));
    } catch (e) {
        console.log(util.inspect(e, false, null));
    }
});
