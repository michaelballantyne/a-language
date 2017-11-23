const LinkModule = require("./module.js").LinkModule;

const sexpjs_module = LinkModule(
    ["escodegen"],
    ["compile", "main", "foo"],
function(escodegen) {
    function compile(arg) {
        let tree = {
            type: 'BinaryExpression',
            operator: '+',
            left: { type: 'Literal', value: 40 },
            right: { type: 'Literal', value: 2 }
        };

        return escodegen.generate(tree)
    }

    function main() {
        console.log(compile([]));
    }

    return {
        compile: compile,
        main: main
    }
});


if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = sexpjs_module;
}

