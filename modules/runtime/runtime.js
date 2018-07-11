#lang js
// require: vendor/immutable, runtime/minimal
// provide: identifier?, number?, string?, js-object?, js-array?, make-identifier, identifier-string, true, false, +, -, *, /, %, <, >, <=, >=, =, displayln, raise-arity-error, number/c, string/c, identifier/c, has, get, make-keyword, error, string-append, not, ===, !==, obj, hash, list, assoc, empty?, append
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

    // Arrays are objects in JS, but I'm going to treat them as disjoint.
    function is_js_object(arg) {
        if (1 !== arguments.length) {
            raise_arity_error("js-object?", 1, arguments.length);
        }

        return arg !== null && typeof arg === 'object' && !Array.isArray(arg);
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

        if (Immutable.isCollection(c)) {
            return c.has(k);
        } else if (is_js_object(c)) {
            return c[k] !== undefined;
        } else if (is_js_array(c)) {
            return c[k] !== undefined;
        } else {
            throw Error("has: contract violation\n  expected: (or/c collection/c array/c object/c) \n given: " + c)
        }
    }


    function get(c, k) {
        if (2 !== arguments.length) {
            raise_arity_error("get", 2, arguments.length);
        }

        if (!(Immutable.isCollection(c) || is_js_array(c) || is_js_object(c))) {
            throw Error("get: contract violation\n  expected: (or/c collection/c array/c object/c) \n given: " + c)
        }

        function no_value() {
        }

        var res;
        if (Immutable.isCollection(c)) {
            res = c.get(k)
        } else {
            res = c[k];
        }

        if (res === undefined) {
            throw Error("get: no value found for key\n  key: " + k);
        }
        return res;
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
            throw Error("hash: expected an even number of arguments")
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

    function assoc(c, k, v) {
        if (3 !== arguments.length) {
            raise_arity_error("assoc", 3, arguments.length);
        }

        if (Immutable.isKeyed(c)) {
            return c.set(k, v);
        } else if (Immutable.isIndexed(c)) {
            if (!is_number(k)) {
                throw Error("assoc: collection is indexed, but key is not a number\n  key: " + k);
            }
            if (!(k <= c.size)) {
                throw Error("assoc: assignment would leave undefined indices");
            }
            return c.set(k, v);
        } else if (is_js_object(c)) {
            var res = Object.assign({}, c)
            res[k] = v;
            return res;
        } else {
            throw Error("assoc: contract violation\n  expected: (or/c collection/c object/c) \n given: " + c)
        }
    }

    function empty(c) {
        if (1 !== arguments.length) {
            raise_arity_error("empty?", 1, arguments.length);
        }

        if (Immutable.isCollection(c)) {
            return c.isEmpty();
        } else if (is_js_array(c)) {
            return c.length === 0;
        } else {
            throw Error("empty?: contract violation\n  expected: (or/c collection/c array/c)\n  given: " + c)
        }
    }

    function first(l) {
        if (1 !== arguments.length) {
            raise_arity_error("first", 1, arguments.length);
        }

        if (!Immutable.List.isList(l)) {
            throw Error("first: contract violation\n  expected: list/c\n  given: " + l)
        }
        return l.first();
    }

    function rest(l) {
        if (1 !== arguments.length) {
            raise_arity_error("rest", 1, arguments.length);
        }

        if (!Immutable.List.isList(l)) {
            throw Error("rest: contract violation\n  expected: list/c\n  given: " + l)
        }
        return l.rest();
    }

    function append(l1, l2) {
        if (2 !== arguments.length) {
            raise_arity_error("append", 2, arguments.length);
        }

        if (!Immutable.List.isList(l1)) {
            throw Error("rest: contract violation\n  expected: list/c\n  given: " + l1)
        }
        if (!Immutable.List.isList(l2)) {
            throw Error("rest: contract violation\n  expected: list/c\n  given: " + l2)
        }
        return l1.concat(l2);
    }

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
        "list": list,
        "assoc": assoc,
        "empty?": empty,
        "append": append
    }
})
