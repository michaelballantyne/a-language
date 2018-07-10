#lang js
// require:
// provide: make-print, id, +, false, *, -, <
(function () {
    return {
        "+": (a, b) => a + b,
        "*": (a, b) => a * b,
        "-": (a, b) => a - b,
        "<": (a, b) => a < b,
        "false": false,
        "id": function(x) { return x; },
        "make-print": function (x) { return function() { console.log(x); }; }
    };
})
