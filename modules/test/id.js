#lang js
// require:
// provide: make_print, id, plus, _false, mult, minus, lessthan
(function () {
    return {
        plus: (a, b) => a + b,
        mult: (a, b) => a * b,
        minus: (a, b) => a - b,
        lessthan: (a, b) => a < b,
        _false: false,
        id: function(x) { return x; },
        make_print: function (x) { return function() { console.log(x); }; }
    };
})
