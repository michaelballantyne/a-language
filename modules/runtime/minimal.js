#lang js
// require:
// provide: raise-arity-error
//
// References to this module and its exports are inserted by the compiler in every module.
//
(function () {
    function raise_arity_error(name, expected, given) {
        if (3 !== arguments.length) {
            raise_arity_error("raise-arity-error", 3, arguments.length);
        }

        throw Error(name + ": arity mismatch\n  expected: " + expected + "\n  given: " + given);
    }

    return {
        "raise-arity-error": raise_arity_error
    };
})
