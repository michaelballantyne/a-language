const LinkModule = require("./module.js").LinkModule;

// Generates a string of JS code.
// Needs to link with primitive stuff that may exist written in JS. Options:
//  - some entries in module_registry could be ffi modules, which just promise that names will
//       be available at runtime via a global variable. Or it could require them to be passed
//       as function arguments to the closure implementing the flattened code.
//
// Ok, so passed in as arguments to final linked code. FFI stuff could come in as transitive dep,
//       so how does the loader know how to load the flattened thing? It could list its deps and
//       a runtime registry could provide them. Could be errors if deps don't provide the same functions
//       as compiler expected they would. Maybe fine for now.
//
//  LinkModule([deps ...], [exports ...],
//    function (dep ...) {
//        ...
//    }
//
//  Exports are the exports of the main module.
//
//  Input modules should be compile modules; that is, modules with source. Output will be a link module.
//
//  Forget submodules for now.
//

const flatten_module = LinkModule(
    ["escodegen"],
    ["flatten", "main"],
function(escodegen) {
    const isString = i => typeof i === "string" || i instanceof String

    const CompileModule = function (imports, exports, body_code) {
        if (imports === undefined || !Array.isArray(imports) || !imports.every(isString) ||
            exports === undefined || !Array.isArray(exports) || !exports.every(isString) ||
                body_code === undefined || !isString(body_code)) {
            throw "Malformed module declaration"
        }

        return {
            imports: imports,
            exports: exports,
            body_code: body_code
        };
    };

    const flatten = function(module_registry, main_module_name) {
        let tree = {
            type: 'VariableDeclaration',
            declarations: [
                {
                    type: "VariableDeclarator",
                    id: {
                        type: "Identifier",
                        name: "module_a"
                    },
                    init: {
                        type: "Literal",
                        value: "foo",
                        verbatim: module_registry["b"].body_code
                    }
                }],
            kind: "const"
        }

        return escodegen.generate(tree, { verbatim: "verbatim"} )
    }

    function main() {
        let modules = {};
        modules["a"] = CompileModule([],["foo"],
`
function () {
    function foo () {
        return 5;
    }

    return {
        foo: foo;
    };
}
`
        );

        modules["b"] = CompileModule(["a"],["main"],
`
function (a) {
    function main () {
        console.log(a.foo());
    }

    return {
        main: main;
    };
}
`
        );
        console.log(flatten(modules, "b"));
    }

    return {
        flatten: flatten,
        main: main
    }
});


if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = flatten_module;
}


