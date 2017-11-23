let assembler_module = function () {
    const escodegen = require("escodegen");

    const Ref = function (name) {
        return {type: "ref", name: name}
    }

    const assemble = function(ast) {
        return "";
    };

    let main_submodule = function () {
        const ex = Ref("foo");
        console.log(assemble(ex));
    };

    return {
        main_submodule: main_submodule,
        assemble: assemble
    }
}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = assembler_module;
}

