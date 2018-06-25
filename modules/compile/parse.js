// require: vendor/immutable, compile/reader, runtime/runtime
// provide: test_parse_exp, parse_module
(function (Immutable, reader, runtime) {
    const Map = Immutable.Map;
    const List = Immutable.List;

    function syntax_error(exp) {
        throw "bad syntax: " + exp.toString();
    }

    function unbound_error(exp) {
        throw "unbound reference: " + exp.get("identifier");
    }

    let gensym_counter = 0;
    function gensym(id) {
        gensym_counter = gensym_counter + 1;
        return id.get("identifier") + gensym_counter.toString();
    }

    function match_wrapper(wrapper, sexp) {
        if (List.isList(sexp) && Immutable.is(sexp.get(0), runtime.make_identifier(wrapper)) && sexp.size === 2) {
            return sexp.get(1);
        } else {
            return false;
        }
    }

    function app_parser(exps, env) {
        if (exps.size < 1) {
            syntax_error(exp);
        }

        return Map({app_exps: exps.map((exp) => parse_exp(exp, env))});
    }

    function fn_parser(exp, env) {
        if (exp.size < 3) {
            syntax_error(exp);
        }

        const arg_list = match_wrapper("#%round", exp.get(1))

        if (!(List.isList(arg_list)
              && arg_list.every((element) => runtime.is_identifier(element)))) {
            syntax_error(exp)
        }

        const old_arg_ids = arg_list;
        const new_arg_ids = old_arg_ids.map((id) => gensym(id));

        const new_env = old_arg_ids
                         .zip(new_arg_ids)
                         .reduce((env, pr) => env.set(pr[0], Map({ local_ref: pr[1]})), env)

        return parse_block(exp.shift().shift(), new_env).set("fn_args", new_arg_ids);
    }

    function if_parser(exp, env) {
        if (exp.size !== 4) {
            syntax_error(exp);
        }

        return Map({ if_c: parse_exp(exp.get(1), env),
                     if_t: parse_exp(exp.get(2), env),
                     if_e: parse_exp(exp.get(3), env) });
    }

    function loop_parser(exp, env) {
        throw "loop parser not yet implemented";
    }

    function block_parser(exp, env) {
        return parse_block(exp.shift(), env)
    }

    function recur_parser(exp, env) {
        if (exps.size < 1) {
            syntax_error(exp);
        }

        return Map({recur_exps: exps.shift().map((exp) => parse_exp(exp, env))});
    }

    function quote_parser(exp, env) {
        if (exp.size !== 2) {
            syntax_error(exp);
        }

        return Map({ quoted_datum: exp.get(1) });
    }

    const def_env_rhs = Map({def: true});

    const initial_env = Map([[runtime.make_identifier("def"), def_env_rhs],
                            [runtime.make_identifier("fn"), Map({core_form: fn_parser})],
                            [runtime.make_identifier("if"), Map({core_form: if_parser})],
                            [runtime.make_identifier("loop"), Map({core_form: loop_parser})],
                            [runtime.make_identifier("block"), Map({core_form: block_parser})],
                            [runtime.make_identifier("recur"), Map({core_form: recur_parser})],
                            [runtime.make_identifier("quote"), Map({core_form: quote_parser})]]);

    function parse_block(forms, env) {
        function match_def(form) {
            const unwrapped = match_wrapper("#%round", form);
            if (unwrapped !== false
                && List.isList(unwrapped)
                && Immutable.is(env.get(unwrapped.get(0)), def_env_rhs)) { // is it a def?

                if (unwrapped.size === 3
                    && runtime.is_identifier(unwrapped.get(1))) { // is it well formed?
                    return Map({id: unwrapped.get(1), exp: unwrapped.get(2)});
                } else {
                    syntax_error(form);
                }
            } else {
                syntax_error(form); // right now, it's always a sequence of defs than an exp in a block.
            }
        }


        if (forms.size === 0) {
            throw "block must have at least one form";
        } else if (forms.size === 1) {
            return parse_exp(forms.get(0), env);
        } else {
            const defs = forms.butLast().map(match_def);
            const exp = forms.last();

            // First pass
            let new_env = env;
            let new_def_ids = List();
            defs.forEach((def) => {
                const surface_id = def.get("id");
                const new_id = gensym(surface_id);
                new_env = new_env.set(surface_id, Map({ local_ref: new_id }));
                new_def_ids = new_def_ids.push(new_id);
            })

            // Second pass
            const parsed_rhss = defs.map((def) => parse_exp(def.get("exp"), new_env))
            //console.log(exp)
            const parsed_ret = parse_exp(exp, new_env);

            return Map({ block_defs: new_def_ids.zipWith((id, rhs) => Map({id: id, rhs: rhs}), parsed_rhss),
                         block_ret: parsed_ret });
        }
    }


    function parse_exp(exp, env) {
        //console.log(exp)
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
            gensym_counter = 0;
            const sexp = reader.read(str).get(0)
            return parse_exp(sexp, initial_env);
        }

        function assert_is(actual, expected) {
            if (!Immutable.is(actual, expected)) {
                throw "assertion failed.\nActual: " + actual.toString() + "\nExpected: " + expected.toString();
            }
        }

        assert_is(read_and_parse("103"), Map({number_literal: 103}));
        assert_is(read_and_parse("\"foo\""), Map({string_literal: "foo"}));
        assert_is(read_and_parse("(block (def x 5) (def y x) y)"),
                  Map({ block_defs: List([Map({id: "x1", rhs: Map({ number_literal: 5 })}),
                                          Map({id: "y2", rhs: Map({ reference: "x1" })})]),
                        block_ret: Map({ reference: "y2" })}));
        assert_is(read_and_parse("(fn (x y) (def x 5) x)"),
                  Map({ fn_args: List(["x1", "y2"]),
                        block_defs: List([Map({id: "x3", rhs: Map({ number_literal: 5 })})]),
                        block_ret: Map({ reference: "x3" })}));
    }

    return {
        test_parse_exp: test_parse_exp,
        parse_module: parse_module
    };
})

