#lang js
// require: vendor/immutable, runtime/minimal
// provide: prim-identifier?, number?, string?, js-object?, js-array?, prim-make-identifier, prim-identifier-string, true, false, +, -, *, /, %, <, >, <=, >=, =, displayln, raise-arity-error, number/c, string/c, prim-identifier/c, has, get, make-keyword, error, string-append, not, ===, !==, obj, hash, list, assoc, empty?, append, null, number->string, first, rest, variadic, cons, size, function?, apply, substring, list/c, function/c, newline, string->integer, read-stdin, double-quote, to-string, character-code, contains, reverse, array, list->array, array->list, map, foldl, box, box?, unbox, set-box!, string-split, string-join, equal?, zip, subset, list?, string-trim, now, contract-error
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

        return Number(parseFloat(arg)) === arg;
    }

    function is_identifier(arg) {
        if (1 !== arguments.length) {
            raise_arity_error("identifier?", 1, arguments.length);
        }

        return is_js_object(arg) && arg.identifier !== undefined;
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

        return Object.assign(Object.create(ValueObject), { identifier: str });
    }

    function get_identifier_string(id) {
        if (1 !== arguments.length) {
            raise_arity_error("identifier-string", 1, arguments.length);
        }

        identifier_c("identifier-string", id);

        return id["identifier"];
    }

    function contract_error(name, expected, given) {
        if (3 !== arguments.length) {
            raise_arity_error("contract-error", 3, arguments.length);
        }

        if (!is_string(name)) {
            throw Error("contract-error: contract violation\n  expected: string?\n  given: " + to_string(name));
        }
        if (!is_string(expected)) {
            throw Error("contract-error: contract violation\n  expected: string?\n  given: " + to_string(expected));
        }

        throw Error(name + ": contract violation\n  expected: " + expected + "\n  given: " + to_string(given));
    }

    function number_c(name, v) {
        if (2 !== arguments.length) {
            raise_arity_error("number/c", 2, arguments.length);
        }

        if (!is_number(v)) {
            contract_error(name, "number?", v);
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
        console.log(String(v));
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
        } else if (is_string(c)) {
            return c[k] !== undefined;
        } else {
            throw Error("has: contract violation\n  expected: (or/c collection/c array/c object/c string/c) \n given: " + c)
        }
    }


    function get(c, k) {
        if (2 !== arguments.length) {
            raise_arity_error("get", 2, arguments.length);
        }

        if (!(Immutable.isCollection(c) || is_js_array(c) || is_js_object(c) || is_string(c))) {
            throw Error("get: contract violation\n  expected: (or/c collection/c array/c object/c string/c) \n given: " + c)
        }

        var res;
        if (Immutable.isCollection(c)) {
            res = c.get(k)
        } else {
            res = c[k];
        }


        if (res === undefined) {
            throw Error("get: no value found for key\n  key: " + k + "\n  in: " + String(c));
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

    function quoteString(value) {
        try {
            return typeof value === 'string' ? JSON.stringify(value) : String(value);
        } catch (_ignoreError) {
            return JSON.stringify(value);
        }
    }

    const ValueObject = {
        toString: function () {
            var keys = Object.getOwnPropertyNames(this)

            var str = "{ ";
            var k;
            for (var i = 0, l = keys.length; i !== l; i++) {
                k = keys[i];
                str += (i ? ', ' : '') + k + ': ' + quoteString(this[k]);
            }
            return str + ' }';
        },
        // Super inefficient equals and hashcode implementations...
        toAlist: function () {
            var that = this;
            const keys = Object.getOwnPropertyNames(that).sort()
            return Immutable.List(keys.map(function(k) { return Immutable.List([k, that[k]]); }));
        },
        equals: function(other) {
            if (Object.getPrototypeOf(other) !== ValueObject) {
                return false;
            }
            return Immutable.is(this.toAlist(), other.toAlist());
        },
        hashCode: function() {
            return this.toAlist().hashCode();
        }
    }

    function obj() {
        if (arguments.length % 2 !== 0) {
            throw Error("obj: expected an even number of arguments")
        }

        let res = Object.create(ValueObject);

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
            var res = Object.assign(Object.create(Object.getPrototypeOf(c)), c)
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
        list_c("first", l);

        if (l.isEmpty()) {
            throw Error("first: cannot get first of empty list")
        }

        return l.first();
    }

    function rest(l) {
        if (1 !== arguments.length) {
            raise_arity_error("rest", 1, arguments.length);
        }
        list_c("rest", l);

        if (l.isEmpty()) {
            throw Error("rest: cannot get rest of empty list")
        }

        return l.rest();
    }

    function cons(e, l) {
        if (2 !== arguments.length) {
            raise_arity_error("cons", 2, arguments.length);
        }
        list_c("cons", l);

        return l.unshift(e);
    }

    function append(l1, l2) {
        if (2 !== arguments.length) {
            raise_arity_error("append", 2, arguments.length);
        }
        list_c("append", l1);
        list_c("append", l2);

        return l1.concat(l2);
    }

    function reverse(l) {
        if (1 !== arguments.length) {
            raise_arity_error("reverse", 1, arguments.length);
        }
        list_c("reverse", l);

        return l.reverse();
    }

    function list_to_array(l) {
        if (1 !== arguments.length) {
            raise_arity_error("list->array", 1, arguments.length);
        }
        list_c("list->array", l);

        return l.toArray();
    }

    function array_to_list(a) {
        if (1 !== arguments.length) {
            raise_arity_error("array->list", 1, arguments.length);
        }

        if (!is_js_array(a)) {
            throw Error("array->list: contract violation\n  expected: array/c\n  given: " + a)
        }

        return Immutable.List(a);
    }


    function size(c) {
        if (Immutable.isCollection(c)) {
            return c.size;
        } else if (is_js_array(c)) {
            return c.length;
        } else if (is_string(c)) {
            return c.length;
        } else {
            throw Error("size: contract violation\n  expected: (or/c collection/c array/c)\n  given: " + c);
        }
    }

    function number_to_string(n) {
        if (1 !== arguments.length) {
            raise_arity_error("number->string", 1, arguments.length);
        }

        number_c("number->string", n)

        return n.toString();
    }

    function is_function(arg) {
        if (1 !== arguments.length) {
            raise_arity_error("function?", 1, arguments.length);
        }

        return typeof arg === "function";
    }

    function function_c(name, arg) {
        if (!is_function(arg)) {
            throw Error(name + ": contract violation\n  expected: function/c\n  given: " + arg);
        }
    }

    function variadic(f) {
        if (1 !== arguments.length) {
            raise_arity_error("variadic", 1, arguments.length);
        }
        function_c("variadic", f);

        function wrap() {
            return f(Immutable.List(arguments));
        }

        return wrap;
    }

    function list_c(name, arg) {
        if (!Immutable.List.isList(arg)) {
            throw Error(name + ": contract violation\n  expected: list/c\n  given: " + String(arg));
        }
    }

    function apply(f, args) {
        if (2 !== arguments.length) {
            raise_arity_error("apply", 2, arguments.length);
        }
        function_c("apply", f);
        list_c("apply", args);

        return f.apply({}, args.toArray());
    }

    function substring(s, i1, i2) {
        if (3 !== arguments.length) {
            raise_arity_error("substring", 3, arguments.length);
        }

        string_c("substring", s);
        number_c("substring", i1);
        number_c("substring", i2);

        return s.substring(i1, i2);
    }

    function string_to_integer(s) {
        if (1 !== arguments.length) {
            raise_arity_error("string->integer", 1, arguments.length);
        }

        string_c("string->integer", s)

        if (/^(\-|\+)?([0-9]+|Infinity)$/.test(s)) {
            return Number(s);
        } else {
            throw Error("string->integer: string cannot be parsed as an integer: " + s);
        }
    }

    function read_stdin(callback) {
        if (1 !== arguments.length) {
            raise_arity_error("read-stdin", 1, arguments.length);
        }
        function_c("read-stdin", callback);

        let chunks = [];
        process.stdin.resume()
        process.stdin.on('data', function(chunk) { chunks.push(chunk); });
        process.stdin.on('end', function() {
            let string = chunks.join("");
            callback(string);
        });
    }

    function to_string(v) {
        if (1 !== arguments.length) {
            raise_arity_error("to-string", 1, arguments.length);
        }

        return v.toString()
    }


    function character_code(s) {
        if (1 !== arguments.length) {
            raise_arity_error("character-code", 1, arguments.length);
        }
        if (!(is_string(s) && s.length === 1)) {
            throw Error("character-code: contract violation\n  expected: a length 1 string\n  given: " + s);
        }
        return s.charCodeAt(0);
    }

    function contains(c, v) {
        if (2 !== arguments.length) {
            raise_arity_error("contains", 2, arguments.length);
        }
        if (!(Immutable.isCollection(c))) {
            throw Error("contains: contract violation\n  expected: collection/c\n  given: " + c);
        }
        return c.contains(v);
    }

    function array() {
        return Array.prototype.slice.call(arguments);
    }

    function map(f, list) {
        if (2 !== arguments.length) {
            raise_arity_error("map", 2, arguments.length);
        }
        function_c("map", f);
        list_c("map", list);

        return list.map(function (el) { return f(el); });
    }

    function foldl(f, init, list) {
        if (3 !== arguments.length) {
            raise_arity_error("foldl", 3, arguments.length);
        }
        function_c("foldl", f);
        list_c("foldl", list);

        return list.reduce(function (acc, el) { return f(acc, el); }, init);
    }

    function Box(init) {
        this.val = init;
    }

    function box(init) {
        if (1 !== arguments.length) {
            raise_arity_error("box", 1, arguments.length);
        }
        return new Box(init);
    }

    function is_box(v) {
        if (1 !== arguments.length) {
            raise_arity_error("box?", 1, arguments.length);
        }
        return v instanceof Box;
    }

    function unbox(b) {
        if (1 !== arguments.length) {
            raise_arity_error("unbox", 1, arguments.length);
        }
        if (!is_box(b)) {
            throw Error("unbox: contract violation\n  expected: box/c\n  given: " + b)
        }
        return b.val;
    }


    function set_box_bang(b, v) {
        if (2 !== arguments.length) {
            raise_arity_error("set-box!", 2, arguments.length);
        }

        if (!is_box(b)) {
            throw Error("set-box!: contract violation\n  expected: box/c\n  given: " + b)
        }

        b.val = v;
    }

    function string_split(s, sep) {
        if (2 !== arguments.length) {
            raise_arity_error("string-split", 2, arguments.length);
        }
        string_c("string-split", s);
        string_c("string-split", sep);

        return array_to_list(s.split(sep));
    }

    function string_join(l, sep) {
        if (2 !== arguments.length) {
            raise_arity_error("string-join", 2, arguments.length);
        }
        list_c("string-join", l);
        string_c("string-join", sep);

        return list_to_array(l).join(sep);
    }

    function string_trim(s) {
        if (1 !== arguments.length) {
            raise_arity_error("string-trim", 1, arguments.length);
        }
        string_c("string-trim", s);
        return s.trim();
    }

    function equal(v1, v2) {
        if (2 !== arguments.length) {
            raise_arity_error("equal?", 2, arguments.length);
        }
        return Immutable.is(v1, v2);
    }

    function zip(f, l1, l2) {
        if (3 !== arguments.length) {
            raise_arity_error("zip", 3, arguments.length)
        }
        function_c("zip", f);
        list_c("zip", l1);
        list_c("zip", l2);
        return l1.zipWith((a, b) => f(a, b), l2)
    }

    function subset(l1, l2) {
        if (2 !== arguments.length) {
            raise_arity_error("subset", 2, arguments.length)
        }
        list_c("subset", l1);
        list_c("subset", l2);

        return l1.isSubset(l2);
    }

    function is_list(v) {
        if (1 !== arguments.length) {
            raise_arity_error("list?", 1, arguments.length)
        }
        return Immutable.List.isList(v);
    }

    return {
        "number?": is_number,
        "string?": is_string,
        "prim-identifier?": is_identifier,
        "js-object?": is_js_object,
        "js-array?": is_js_array,
        "prim-make-identifier": make_identifier,
        "prim-identifier-string": get_identifier_string,
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
        "=": checked_num_binop("=", (a, b) => a === b),
        "displayln": displayln,
        "raise-arity-error": raise_arity_error,
        "number/c": number_c,
        "string/c": string_c,
        "prim-identifier/c": identifier_c,
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
        "append": append,
        "null": null,
        "number->string": number_to_string,
        "first": first,
        "rest": rest,
        "variadic": variadic,
        "cons": cons,
        "size": size,
        "function?": is_function,
        "apply": apply,
        "substring": substring,
        "list/c": list_c,
        "function/c": function_c,
        "newline": "\n",
        "double-quote": "\"",
        "string->integer": string_to_integer,
        "read-stdin": read_stdin,
        "to-string": to_string,
        "character-code": character_code,
        "contains": contains,
        "reverse": reverse,
        "array": array,
        "list->array": list_to_array,
        "map": map,
        "foldl": foldl,
        "array->list": array_to_list,
        "box": box,
        "box?": is_box,
        "unbox": unbox,
        "set-box!": set_box_bang,
        "string-split": string_split,
        "string-join": string_join,
        "equal?": equal,
        "zip": zip,
        "subset": subset,
        "list?": is_list,
        "string-trim": string_trim,
        "now": Date.now,
        "contract-error": contract_error
    }
})
