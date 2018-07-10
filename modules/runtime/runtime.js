#lang js
// require: vendor/immutable
// provide: identifier?, number?, string?, js-object?, js-array?, make-identifier, identifier-string, true, false, +, -, *, /, %, <, >, <=, >=, =, displayln
(function (Immutable) {
    function is_string(arg) {
        if (typeof arg === 'string' || arg instanceof String) {
            return true;
        } else {
            return false;
        }
    }

    function is_number(arg) {
        return !isNaN(arg);
    }

    function is_identifier(arg) {
        return Immutable.Map.isMap(arg) && arg.has("identifier");
    }

    function is_js_object(arg) {
        return arg !== null && typeof arg === 'object';
    }

    function make_identifier(str) {
        return Immutable.Map({identifier: str});
    }

    function get_identifier_string(id) {
        return id.get("identifier");
    }

    function number_c(v, name) {
        if (!is_number(v)) {
            throw name + ": contract violation\n  expected: number?\n  given: " + v
        }
    }

    function checked_num_binop(name, f) {
        function wrapped(a, b) {
            number_c(a, name);
            number_c(b, name);
            return f(a, b);
        }
        return wrapped;
    }

    return {
        "number?": is_number,
        "string?": is_string,
        "identifier?": is_identifier,
        "js-object?": is_js_object,
        "js-array?": Array.isArray,
        "make-identifier": make_identifier,
        "identifier-string": get_identifier_string,
        "true": true,
        "false": false,
        "+": checked_num_binop("+", (a, b) => a + b),
        "-": checked_num_binop("-", (a, b) => a - b),
        "*": checked_num_binop("*", (a, b) => a * b),
        "/": checked_num_binop("/", (a, b) => a / b),
        "%": checked_num_binop("%", (a, b) => a % b),
        "<": checked_num_binop("<", (a, b) => a < b),
        ">": checked_num_binop(">", (a, b) => a > b),
        ">=": checked_num_binop(">=", (a, b) => a >= b),
        "<=": checked_num_binop("<=", (a, b) => a <= b),
        "=": checked_num_binop("=", (a, b) => a = b),
        "displayln": console.log
    }
})
