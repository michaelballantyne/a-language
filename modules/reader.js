// require:
// provide: read, main, test
(function () {
    'use strict';

    let position = Symbol("position");
    let expected = Symbol("expected")
    let result = Symbol("result");
    let failure = Symbol("failure");

    function c_pred(pred, description) {
        return (input, index) => {
            if (input[index] != undefined && pred(input[index]) === true) {
                return {[position]: index + 1, [failure]: []}
            } else {
                return {[failure]: [{[expected]: description, [position]: index}]}
            }
        }
    }

    let c = (to_match) => c_pred(ch => ch === to_match, `c ${to_match}`);
    let c_not = (...to_match) => c_pred(ch => !(to_match.includes(ch)), `not ${to_match}`);
    let c_range = (lower, upper) => c_pred((ch) => lower <= ch && ch <=upper, `range ${lower} to ${upper}`);

    let empty = (input, index) => ({[position]: index, [failure]: []});

    function merge_failures(l, r) {
        if (l.length === 0) return r
        if (r.length === 0) return l

        if (r[0][position] > l[0][position]) return r
        if (l[0][position] > r[0][position]) return l

        return l.concat(r)
    }

    function seq(...args) {
        return (input, index) => {
            let curr_index = index,
                results = [],
                failures = []

            for (let parser of args) {
                let res = parser(input, curr_index)

                if (res[result] !== undefined)
                    results.push(res[result])

                failures = merge_failures(failures, res[failure])

                curr_index = res[position]
                if (curr_index === undefined)
                    break;
            }

            return {[position]: curr_index,
                    [result]: results.length > 1 ? results : results[0],
                    [failure]: failures};
        }
    }

    function or(...args) {
        return (input, index) => {
            let failures = []

            for (let parser of args) {
                let res = parser(input, index)

                if (res[failure] !== undefined)
                    failures = merge_failures(failures, res[failure])

                if (res[position] !== undefined)
                    return Object.assign({}, res, {[failure]: failures})
            }

            return {[failure]: failures};
        }
    }

    function nonterm(description, f) {
        return describe(description, (...args) =>
            f()(...args));
    }

    function one_or_more(p) {
        let self = (input, index) => seq(p, or(self, empty))(input, index);
        return self;
    }

    function zero_or_more(p) {
        let self = (input, index) => or(seq(p, self), empty)(input, index);
        return self;
    }

    function eof(input, index) {
        if (index === input.length) {
            return {[position]: index, [failure]: []};
        } else {
            return {[failure]: [{[expected]: "end of file", [position]: index}]};
        }
    }

    function capture_string(p) {
        return (input, index) => {
            let res = p(input, index);
            if (res[position] !== undefined) {
                return Object.assign({}, res, {[result]: input.substring(index, res[position])});
            } else {
                return res;
            }
        }
    }

    function action(p, f) {
        return (input, index) => {
            let res = p(input, index);
            if (res[position] !== undefined) {
                return Object.assign({}, res, {[result]: f(res[result])});
            } else {
                return res;
            }
        }
    }

    function describe(name, p) {
        return (input, index) => {
            let res = p(input, index);

            if (res[failure].length !== 0 && res[failure][0][position] === index) {
                return Object.assign({}, res, {[failure]: [{[expected]: name, [position]: index}]})
            }

            return res;
        }
    }

    function parse(grammar, input) {
        return grammar(input, 0);
    }

    let wrap = (name, wrapper, body) =>
        describe(name, action(body, (child) => [wrapper, child]))

    let sexp = nonterm("sexp", () =>
        or(
            id,
            string,
            dsl_string,
            wrap("parens", "#%round",
                seq(c("("), sexp_list, c(")"))),
            wrap("square brackets", "#%square",
                seq(c("["), sexp_list, c("]"))),
            wrap("curly brackets", "#%curly",
                seq(c("{"), sexp_list, c("}"))),
            wrap("tick", "#%tick",
                seq(c("'"), sexp)),
            wrap("backtick", "#%backtick",
                seq(c("`"), sexp)),
            wrap("comma", "#%comma",
                seq(c(","), sexp))
        ));

    let empty_as_list = action(empty, (ignore) => [])

    let sexp_list = nonterm("list of s-expressions", () =>
        or(
            seq(whitespace, sexp_list),
            action(seq(sexp, or(seq(whitespace, sexp_list),
                                empty_as_list)),
                   ([first, rest]) => [first].concat(rest)),
            empty_as_list
        ));

    let whitespace = nonterm("whitespace", () =>
        one_or_more(or(c(" "), c("\n"))));

    let id = nonterm("identifier", () =>
        capture_string(one_or_more(or(c_range("a", "z"),
                                      c_range("A","Z"),
                                      c("-"), c("?")))));

    let string = nonterm("string", () =>
        seq(c("\""), capture_string(zero_or_more(c_not("\""))), c("\"")));

    let dsl_string = nonterm("dsl string", () =>
        seq(seq(c("‹"), c("‹")), capture_string(dsl_string_contents), c("›"), c("›")));

    let dsl_string_contents = nonterm("dsl string contents", () =>
        or(
            seq(seq(c("‹"), c_not("‹", "›")), dsl_string_contents),
            seq(seq(c("›"), c_not("‹", "›")), dsl_string_contents),
            seq(c_not("‹", "›"), dsl_string_contents),
            seq(dsl_string, dsl_string_contents),
            empty
        ));

    let top = seq(sexp_list, eof);

    let read = function (string) {
        let res = parse(top, string)
        if (res[position] === undefined) {
            throw { msg: "Parse error", details: res}
        } else {
            return res[result];
        }
    }

    let test = function () {
        let assert = require("assert")

        {
            let ex = parse(c("x"), "x")
            assert(ex[position] === 1)
        }

        {
            let ex = parse(c("x"), "y")
            assert(ex[position] === undefined)

            let f = ex[failure][0]
            assert(f[position] === 0)
        }


        assert(parse(c_not("x"), "y")[position] === 1)
        assert(parse(c_not("x"), "x")[position] === undefined)
        assert(parse(c_not("x", "y"), "z")[position] === 1)

        {
            let ex = parse(c_not("x", "y"), "y")
            assert(ex[position] === undefined)

            let f = ex[failure][0]
            assert(f[position] === 0)
        }

        assert(parse(seq(c("x"), c("y")), "xy")[position] === 2)

        {
            let ex = parse(seq(c("x"), c("y")), "zy")
            assert(ex[position] === undefined)

            let f = ex[failure][0]
            assert(f[position] === 0)
        }

        {
            let ex = parse(seq(c("x"), c("y")), "xz")
            assert(ex[position] === undefined)

            let f = ex[failure][0]
            assert(f[position] === 1)
        }

        {
            let ex = parse(or(c("x"), c("y")), "x")
            assert(ex[position] === 1)

            let f = ex[failure]
            assert(f.length === 0)
        }

        {
            let ex = parse(or(c("x"), c("y")), "y")
            assert(ex[position] === 1)

            assert(ex[failure].length === 1)
            let f = ex[failure][0]
            assert(f[position] === 0)
        }

        {
            let ex = parse(or(c("x"), empty), "y")
            assert(ex[position] === 0)

            assert(ex[failure].length === 1)
            let f = ex[failure][0]
            assert(f[position] === 0)
        }

        {
            let ex = parse(or(seq(c("x"), c("y"), c("z")), seq(c("x"), c("x"))), "xyy")
            assert(ex[position] === undefined)

            assert(ex[failure].length === 1)
            let f = ex[failure][0]
            assert(f[position] === 2)
        }
    };

    let main = function () {
        const util = require("util");

        function print(obj) {
            console.log(util.inspect(obj, false, null));
        }

        // for debugging
        function trace(description, f) {
            return describe(description, (...args) => {
                console.log(`entering ${description}`);
                let res = f(...args);
                console.log(`returning from ${description}`);
                print(res);
                return res
            });
        }

        let chunks = [];
        process.stdin.resume()
        process.stdin.on('data', function(chunk) { chunks.push(chunk); });
        process.stdin.on('end', function() {
            let string = chunks.join("");
            try {
                print(read(string));
            } catch (e) {
                print(e);
            }
        });
    };

    return {
        test: test,
        main: main,
        read: read
    }
})

// grammar:
//
// sexpr := id
//        | string
//        | dsl-string
//        | "(" sexp-list ")"
//        | "[" sexp-list "]"
//        | "{" sexp-list "}"
//        | "'" sexp
//        | "`" sexp
//        | "," sexp
//
// sexp-list := whitespace sexp-list
//            | sexp (whitespace sexp-list
//                   | "")
//            | ""
//
// whitespace := (" " | "\n")+
//
// id := (a-z | A-Z | "-" | "?")+
//
// string = ‹‹"›› (!‹‹"››)* ‹‹"››
//
// dsl-string := "‹" "‹" dsl-string-contents "›" "›"
//
// dsl-string-contents := "‹" !"‹" dsl-string-contents
//                      | "›" !"›" dsl-string-contents
//                      | (!"‹" & !"›") dsl-string-contents
//                      | dsl-string dsl-string-contents
//                      | ""
//
// (grammar
//   (sexp
//    (or id
//        string
//        dsl-string
//        (seq "(" sexp-list ")")
//        (seq "[" sexp-list "]")
//        (seq "{" sexp-list "}")
//        (seq "'" sexp)
//        (seq "`" sexp)
//        (seq "," sexp)))
//   (sexp-list
//    (or (seq whitespace sexp-list)
//        (seq sexp (or (seq space sexp-list)
//                      ""))
//        ""))
//   (whitespace
//    (one-or-more (or " " "\n")))
//   (id
//    (one-or-more (or (c-range "a" "z") (c-range "A" "Z") "-" "?")))
//   (string
//    (seq ‹‹"›› (zero-or-more (c-not ‹‹"››)) ‹‹"››))
//   (dsl-string
//    (seq "‹" "‹" dsl-string-contents "›" "›"))
//   (dsl-string-contents
//    (or (seq "‹" (c-not "‹") dsl-string-contents)
//        (seq "›" (c-not "›") dsl-string-contents)
//        (seq (c-and (c-not "‹") (c-not "›")) dsl-string-contents)
//        (seq dsl-string dsl-string-contents)
//        "")))
//
