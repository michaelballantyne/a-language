#lang js
// require:
// provide: make_print, id, plus, _false
(function () {
    return {
        plus: function(a, b) {
            return a + b;
        },
        _false: false,
        id: function(x) { return x; },
        make_print: function (x) { return function() { console.log(x); }; }
    };
})
