#lang js
// require:
// provide: _call, _obj-get, _undefined, _variadic, _typeof, _instanceof, _String, _Array, _isNaN, _===, _!==, _true, _false, _+, _-, _*, _/, _%, _<, _>, _>=, _<=, _=, _console_log, _not, _null
(function () {
    function call(obj, method) {
        const args = Array.prototype.slice.call(arguments, 2)
        return obj[method].apply(obj, args)
    }

    function obj_get(obj, field) {
        return obj[field];
    }

    function variadic(f) {
        function wrap() {
            return f(arguments);
        }
        return wrap;
    }

    function type_of(arg) {
        return typeof arg;
    }

    function instance_of(a, b) {
        return a instanceof b;
    }

    return {
        "_call": call,
        "_obj-get": obj_get,
        "_undefined": undefined,
        "_variadic": variadic,
        "_typeof": type_of,
        "_instanceof": instance_of,
        "_String": String,
        "_Array": Array,
        "_isNaN": isNaN,
        "_===": (a, b) => a === b,
        "_!==": (a, b) => a === b,
        "_true": true,
        "_false": false,
        "_+": (a, b) => a + b,
        "_-": (a, b) => a - b,
        "_*": (a, b) => a * b,
        "_/": (a, b) => a / b,
        "_%": (a, b) => a % b,
        "_<": (a, b) => a < b,
        "_>": (a, b) => a > b,
        "_>=": (a, b) => a >= b,
        "_<=": (a, b) => a <= b,
        "_=": (a, b) => a = b,
        "_console_log": console.log,
        "_not": (a) => !a,
        "_null": null
    }
})
