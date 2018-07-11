#lang js
// require: vendor/immutable, runtime/minimal
// provide: identifier?, number?, string?, js-object?, js-array?, make-identifier, identifier-string, true, false, +, -, *, /, %, <, >, <=, >=, =, displayln, raise-arity-error, number/c, string/c, identifier/c, has, get, make-keyword, error, string-append, not, ===, !==, obj, hash, list
(function (Immutable, runtime__minimal) {
    let raise_arity_error = runtime__minimal["raise-arity-error"]

    function is_string(arg) {
        if (1 !== arguments.length) {
            raise_arity_error("string?", 1, arguments.length);
        }

        if (typeof arg === 'string' || arg instanceof String) {
            return true;
        } else {
            return false;
        }
    }

    function is_number(arg) {
        if (1 !== arguments.length) {
            raise_arity_error("number?", 1, arguments.length);
        }

        return !isNaN(arg);
    }

    function is_identifier(arg) {
        if (1 !== arguments.length) {
            raise_arity_error("identifier?", 1, arguments.length);
        }

        return Immutable.Map.isMap(arg) && arg.has("identifier");
    }

    function is_js_object(arg) {
        if (1 !== arguments.length) {
            raise_arity_error("js-object?", 1, arguments.length);
        }

        return arg !== null && typeof arg === 'object';
    }

    function is_js_array(arg) {
        if (1 !== arguments.length) {
            raise_arity_error("js-array?", 1, arguments.length);
        }

        return Array.isArray(arg);
    }

    function make_keyword(str) {
        return str;
    }

    function make_identifier(str) {
        if (1 !== arguments.length) {
            raise_arity_error("make-identifier", 1, arguments.length);
        }
        string_c("make-identifier", str);

        return Immutable.Map({identifier: str});
    }

    function get_identifier_string(id) {
        if (1 !== arguments.length) {
            raise_arity_error("identifier-string", 1, arguments.length);
        }

        identifier_c("identifier-string", id);

        return id.get("identifier");
    }

    function number_c(name, v) {
        if (2 !== arguments.length) {
            raise_arity_error("number/c", 2, arguments.length);
        }

        if (!is_number(v)) {
            throw Error(name + ": contract violation\n  expected: number?\n  given: " + v);
        }
    }

    function string_c(name, v) {
        if (2 !== arguments.length) {
            raise_arity_error("string/c", 2, arguments.length);
        }

        if (!is_string(v)) {
            throw Error(name + ": contract violation\n  expected: string?\n  given: " + v);
        }
    }

    function identifier_c(name, v) {
        if (2 !== arguments.length) {
            raise_arity_error("identifier/c", 2, arguments.length);
        }

        if (!is_identifier(v)) {
            throw Error(name + ": contract violation\n  expected: identifier?\n  given: " + v);
        }
    }

    function checked_num_binop(name, f) {
        function wrapped(a, b) {
            if (2 !== arguments.length) {
                raise_arity_error(name, 2, arguments.length);
            }
            number_c(name, a);
            number_c(name, b);
            return f(a, b);
        }
        return wrapped;
    }

    function displayln(v) {
        if (1 !== arguments.length) {
            raise_arity_error("displayln", 1, arguments.length);
        }
        console.log(v);
    }

    function has(c, k) {
        if (2 !== arguments.length) {
            raise_arity_error("has", 2, arguments.length);
        }

        if (!(Immutable.isCollection(c))) {
            throw Error("has: contract violation\n  expected: collection/c\n given: " + c)
        }

        return c.has(k);
    }


    function get(c, k) {
        if (2 !== arguments.length) {
            raise_arity_error("get", 2, arguments.length);
        }

        if (!(Immutable.isCollection(c))) {
            throw Error("get: contract violation\n  expected: collection/c\n given: " + c)
        }

        if (!(c.has(k))) {
            throw Error("get: no value found for key\n  key: " + k);
        }

        return c.get(k);
    }

    function error(name, message) {
        if (2 !== arguments.length) {
            raise_arity_error("error", 2, arguments.length);
        }

        throw Error(name + ": " + message);
    }

    function string_append() {
        let res = "";
        for (var i = 0; i < arguments.length; i++) {
            string_c("string-append", arguments[i]);
            res = res + arguments[i];
        }
        return res;
    }

    function not(arg) {
        if (1 !== arguments.length) {
            raise_arity_error("not", 1, arguments.length);
        }
        return arg === false;
    }

    function threeeq(a, b) {
        if (2 !== arguments.length) {
            raise_arity_error("===", 2, arguments.length);
        }

        return a === b;
    }

    function threeneq(a, b) {
        if (2 !== arguments.length) {
            raise_arity_error("!==", 2, arguments.length);
        }

        return a !== b;
    }

    function obj() {
        if (arguments.length % 2 !== 0) {
            throw Error("obj: expected an even number of arguments")
        }

        let res = {};

        for (var i = 0; i < arguments.length; i = i + 2) {
            string_c("obj", arguments[i]);
            res[arguments[i]] = arguments[i + 1];
        }

        return res;
    }

    function hash() {
        if (arguments.length % 2 !== 0) {
            throw Error("obj: expected an even number of arguments")
        }

        let res = Immutable.Map();

        for (var i = 0; i < arguments.length; i = i + 2) {
            res = res.set(arguments[i], arguments[i + 1]);
        }

        return res;
    }

    function list() {
        return Immutable.List(arguments);
    }

//;   ===
//;   first
//;   rest
//;   append

//;   generic get, has, empty? Or do I want to use list-ref, hash-ref, obj-ref, etc?
//;   Would still be interfaces, but more specific.
//;   These are variadic, but defined in JS so don't need to add to compiler:
//;     has
//;     get
//;     obj
//;     list
//;     hash
//;     put

    return {
        "number?": is_number,
        "string?": is_string,
        "identifier?": is_identifier,
        "js-object?": is_js_object,
        "js-array?": is_js_array,
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
        "displayln": displayln,
        "raise-arity-error": raise_arity_error,
        "number/c": number_c,
        "string/c": string_c,
        "identifier/c": identifier_c,
        "has": has,
        "get": get,
        "make-keyword": make_keyword,
        "error": error,
        "string-append": string_append,
        "not": not,
        "===": threeeq,
        "!==": threeneq,
        "obj": obj,
        "hash": hash,
        "list": list
    }
})
