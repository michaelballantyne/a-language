// require: vendor/immutable, compile/reader, runtime/runtime
// provide: test_match, parse_module
(function (Immutable, reader, runtime) {
    function check_pvar(pat) {
        if (Immutable.List.isList(pat) && Immutable.is(pat.get(0), runtime.make_identifier("#%comma"))) {
            return pat.get(1).get(runtime.identifier);
        } else {
            return false;
        }
    }

    // string representing pattern (to be read) -> sexp -> obj w/ pat vars as keys, matched sexps as vals
    function matcher(patstr) {
        const patsexp = reader.read(patstr);
        function match(sexp) {
            function rec(pat, val, acc) {
                const pvar = check_pvar(pat);
                if (pvar !== false) {
                    return acc.set(pvar, val);
                } else if (runtime.isString(pat) || runtime.isNumber(pat)) {
                    if (pat === val) {
                        return acc;
                    } else {
                        return false;
                    }
                } else if (runtime.isIdentifier(pat)) {
                    if (runtime.isIdentifier(val) && pat.get(runtime.identifier) === val.get(runtime.identifier)) {
                        return acc;
                    } else {
                        return false;
                    }
                } else if (Immutable.List.isList(pat)) {
                    var acc2 = acc;
                    if (!(Immutable.List.isList(val) && val.size === pat.size)) {
                        return false;
                    }

                    for (var i = 0; ((i < pat.size) && (acc2 !== false)); i++) {
                        acc2 = rec(pat.get(i), val.get(i), acc2);
                    }

                    return acc2;
                } else {
                    throw ("unexpected pattern" + pat.toString());
                }
            }
            return rec(patsexp, sexp, Immutable.Map());
        }

        return match;
    }

    function test_match(argv) {
        const assert = require("assert");
        let val = reader.read("(a b (1 \"c\" \"d\"))");
        assert(Immutable.is(matcher("(a b ,v)")(val).get("v"), Immutable.fromJS([runtime.make_identifier("#%round"), [1, "c", "d"]])));

        console.log("tests passed");
    }

    // module registry (for loading dependencies), sexp -> stree
    function parse_module(modreg, sexp) {
        ;
    }

    return {
        test_match: test_match,
        parse_module: parse_module
    };
})

