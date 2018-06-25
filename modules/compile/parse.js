// require: vendor/immutable, compile/reader, runtime/runtime
// provide: test_parse_exp, parse_module
(function (Immutable, reader, runtime) {
    const Map = Immutable.Map;

    function syntax_error(exp) {
        throw "bad syntax: " + exp.toString();
    }

    function unbound_error(exp) {
        throw "unbound reference: " + exp.get("identifier");
    }

    function match_wrapper(wrapper, sexp) {
        if (Immutable.List.isList(sexp) && Immutable.is(sexp.get(0), runtime.make_identifier(wrapper)) && sexp.size === 2) {
            return sexp.get(1);
        }
    }

    function app_parser(exps, env) {
        throw "app parser not yet implemented";
    }

    function fn_parser(exp, env) {
        throw "fn parser not yet implemented";
    }

    function if_parser(exp, env) {
        throw "if parser not yet implemented";
    }

    function loop_parser(exp, env) {
        throw "loop parser not yet implemented";
    }

    function block_parser(exp, env) {
        throw "block parser not yet implemented";
    }

    function recur_parser(exp, env) {
        throw "recur parser not yet implemented";
    }

    function quote_parser(exp, env) {
        throw "quote parser not yet implemented";
    }

    const initial_env = Map([[runtime.make_identifier("def"), Map({def: true})],
                            [runtime.make_identifier("fn"), Map({core_form: fn_parser})],
                            [runtime.make_identifier("if"), Map({core_form: if_parser})],
                            [runtime.make_identifier("loop"), Map({core_form: loop_parser})],
                            [runtime.make_identifier("block"), Map({core_form: block_parser})],
                            [runtime.make_identifier("recur"), Map({core_form: recur_parser})],
                            [runtime.make_identifier("quote"), Map({core_form: quote_parser})]])

    function parse_exp(exp, env) {
        if (runtime.is_string(exp)) {
            return Map({ string_literal: exp })
        }
        if (runtime.is_number(exp)) {
            return Map({ number_literal: exp })
        }
        if (runtime.is_identifier(exp)) { // Variable reference
            const env_entry = env.get(exp, false);
            if (env_entry === false) {
                unbound_error(exp);
            } else if (env_entry.has("core_form")) {
                syntax_error(exp);
            } else if (env_entry.has("local_ref")) {
                const unique_sym = env_entry.get("local_ref");
                return Map({ reference: unique_sym })
            } else if (env_entry.has("module_ref_sym")) {
                const module_ref_sym = env_entry.get("module_ref_sym");
                const field = env_entry.get("module_ref_field");
                throw "module refs not yet implemented";
            } else {
                throw "internal error: malformed environment";
            }
        }
        if (match_wrapper("#%round", exp) && exp.size > 0) {
            const list = match_wrapper("#%round", exp);
            const rator = list.get(0)
            if (runtime.is_identifier(rator) && env.has(rator) && env.get(rator).has("core_form")) { // Core syntactic form
                const core_form_parser = env.get(rator).get("core_form");
                return core_form_parser(list, env);
            } else { // Application
                return app_parser(list, env);
            }
        } else {
            syntax_error(exp);
        }
    }

    // module registry (for loading dependencies), sexp -> stree
    function parse_module(modreg, sexp) {

    }

    function test_parse_exp() {
        function read_and_parse(str) {
            return parse_exp(reader.read(str).get(0), initial_env);
        }

        function assert_is(actual, expected) {
            if (!Immutable.is(actual, expected)) {
                throw "assertion failed.\nActual: " + actual.toString() + "\nExpected: " + expected.toString();
            }
        }

        assert_is(read_and_parse("103"), Map({number_literal: 103}));
        assert_is(read_and_parse("\"foo\""), Map({string_literal: "foo"}));
    }

    return {
        test_parse_exp: test_parse_exp,
        parse_module: parse_module
    };
})

