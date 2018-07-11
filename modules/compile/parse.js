#lang js
// require: vendor/immutable, compile/reader, runtime/runtime
// provide: test_parser, parse_module
(function (Immutable, reader, runtime) {
    const Map = Immutable.Map;
    const List = Immutable.List;

    // Currently unused, becuase local names are always postfixed with a gensym counter.
    // In the future I might want to minimize name mangling, so I'll keep the list for now.
    const reserved = Immutable.Set([
        "break",
        "case",
        "catch",
        "class",
        "const",
        "continue",
        "debugger",
        "default",
        "delete",
        "do",
        "else",
        "export",
        "extends",
        "finally",
        "for",
        "function",
        "if",
        "import",
        "in",
        "instanceof",
        "new",
        "return",
        "super",
        "switch",
        "this",
        "throw",
        "try",
        "typeof",
        "var",
        "void",
        "while",
        "with",
        "yield",
        "null",
        "true",
        "false",
        "abstract",
        "boolean",
        "byte",
        "char",
        "double",
        "final",
        "float",
        "goto",
        "int",
        "long",
        "native",
        "short",
        "synchronized",
        "throws",
        "transient",
        "volatile",
        "await",
        "implements",
        "interface",
        "let",
        "package",
        "private",
        "protected",
        "public",
        "static",
        "enum"
    ])

    const operators = Immutable.Map({
        // printed this way because they are often used as separators.
        "-": "_",
        "/": "__",
        "+": "_plus_",
        "*": "_mul_",
        "%": "_mod_",
        ">": "_gt_",
        "<": "_lt_",
        "=": "_eq_",
        "!": "_bang_",
        "?": "_huh_"
        // These two are currently not permitted by the reader.
        //"~": "_not_",
        //"^": "_xor_",
    });

    function syntax_error(exp) {
        throw "bad syntax: " + exp.toString();
    }

    function unbound_error(exp) {
        throw "unbound reference: " + runtime["identifier-string"](exp);
    }

    function transform_reserved(s) {
        return s.split("").map(c => operators.get(c, c)).join("");
    }

    let gensym_counter = 0;
    function gensym(id) {
        gensym_counter = gensym_counter + 1;
        return transform_reserved(runtime["identifier-string"](id)) + gensym_counter.toString();
    }

    function app_parser(exps, env) {
        if (exps.size < 1) {
            syntax_error(exp);
        }

        return Map({app_exps: exps.map((exp) => parse_exp(exp, env))});
    }

    function if_parser(exp, env) {
        if (exp.size !== 4) {
            syntax_error(exp);
        }

        return Map({ if_c: parse_exp(exp.get(1), env),
                     if_t: parse_exp(exp.get(2), env),
                     if_e: parse_exp(exp.get(3), env) });
    }

    function quote_parser(exp, env) {
        if (exp.size !== 2) {
            syntax_error(exp);
        }

        return Map({ quoted_datum: exp.get(1) });
    }

    function block_parser(exp, env) {
        const parsed_block = parse_block(exp.shift(), env);
        if (parsed_block.get("block_defs").isEmpty()) {
            return parsed_block.get("block_ret");
        } else {
            return parsed_block.set("block_exp", true);
        }
    }

    function fn_parser(exp, env) {
        if (exp.size < 3) {
            syntax_error(exp);
        }

        const arg_list = exp.get(1)

        if (!(List.isList(arg_list)
              && arg_list.every((element) => runtime["identifier?"](element)))) {
            syntax_error(exp)
        }

        let new_args = List()
        let new_env = env;
        arg_list.forEach((arg) => {
            const new_id = gensym(arg);

            new_args = new_args.push(new_id);
            new_env = new_env.set(arg, Map({ local_ref: new_id }));
        })

        // A hack: the compiler only needs temporaries for this one transform,
        // so we'll generate them here.
        const temps = arg_list.map(gensym)

        return parse_block(exp.shift().shift(), new_env).set("fn_args", new_args).set("fn_temps", temps);
    }

    function loop_parser(exp, env) {
        if (exp.size < 3) {
            syntax_error(exp);
        }

        const binding_list = exp.get(1)

        if (!(List.isList(binding_list))) {
            syntax_error(exp);
        }

        let vars = List()
        let init_exps = List()
        let new_env = env;
        binding_list.forEach((binding_pr) => {
            const surface_id = binding_pr.get(0);
            const init_exp = parse_exp(binding_pr.get(1), env);
            const new_id = gensym(surface_id);

            vars = vars.push(new_id);
            init_exps = init_exps.push(init_exp);
            new_env = new_env.set(surface_id, Map({ local_ref: new_id }));
        });

        return parse_block(exp.shift().shift(), new_env).set("loop_vars", vars).set("loop_inits", init_exps);
    }

    function recur_parser(exp, env) {
        if (exp.size < 1) {
            syntax_error(exp);
        }

        const recur_exps = exp.shift().map((exp) => parse_exp(exp, env));

        // The toList is important---otherwise this is a lazy sequence that gets repeatedly evaluated
        // and the gensym gives different answers on each reference!
        const recur_temps = Immutable.Range(0, recur_exps.size)
                             .map((n) => gensym(Immutable.Map({identifier:"tmp"})))
                             .toList();

        return Map({recur_exps: recur_exps, recur_temps: recur_temps})
    }

    const def_env_rhs = Map({def: true});

    const initial_env = Map([[runtime["make-identifier"]("def"), def_env_rhs],
                            [runtime["make-identifier"]("fn"), Map({core_form: fn_parser})],
                            [runtime["make-identifier"]("if"), Map({core_form: if_parser})],
                            [runtime["make-identifier"]("loop"), Map({core_form: loop_parser})],
                            [runtime["make-identifier"]("block"), Map({core_form: block_parser})],
                            [runtime["make-identifier"]("recur"), Map({core_form: recur_parser})],
                            [runtime["make-identifier"]("quote"), Map({core_form: quote_parser})]]);

    function match_def(form, env) {
        if (form !== false
            && List.isList(form)
            && Immutable.is(env.get(form.get(0)), def_env_rhs)) { // is it a def?

            if (form.size === 3
                && runtime["identifier?"](form.get(1))) { // is it well formed?
                return Map({id: form.get(1), exp: form.get(2)});
            } else {name_converted_specials
                syntax_error(form);
            }
        } else {
            syntax_error(form); // right now, it's always a sequence of defs than an exp in a block.
        }
    }

    function parse_defs(forms, env) {
        const defs = forms.map((form) => match_def(form, env));

        // First pass
        let new_env = env;
        let surface_def_ids = List();
        let new_def_ids = List();
        defs.forEach((def) => {
            const surface_id = def.get("id");
            const new_id = gensym(surface_id);
            surface_def_ids = surface_def_ids.push(surface_id);
            new_env = new_env.set(surface_id, Map({ local_ref: new_id }));
            new_def_ids = new_def_ids.push(new_id);
        });

        // Second pass
        const parsed_rhss = defs.map((def) => parse_exp(def.get("exp"), new_env));

        return Map({ block_defs: new_def_ids.zipWith((id, rhs) => Map({id: id, rhs: rhs}), parsed_rhss),
                     new_env: new_env,
                     surface_def_ids: surface_def_ids });
    }

    function parse_block(forms, env) {
        if (forms.size === 0) {
            throw "block must have at least one form";
        } else {
            const parsed_defs = parse_defs(forms.butLast(), env);
            const new_env = parsed_defs.get("new_env");

            const parsed_ret = parse_exp(forms.last(), new_env);

            return Map({ block_defs: parsed_defs.get("block_defs"),
                         block_ret: parsed_ret });
        }
    }


    function parse_exp(exp, env) {
        if (runtime["string?"](exp)) {
            return Map({ string_literal: exp })
        }
        if (runtime["number?"](exp)) {
            return Map({ number_literal: exp })
        }
        if (runtime["identifier?"](exp)) { // Variable reference
            const env_entry = env.get(exp, false);
            if (env_entry === false) {
                unbound_error(exp);
            } else if (env_entry.has("core_form")) {
                syntax_error(exp);
            } else if (env_entry.has("local_ref")) {
                const unique_sym = env_entry.get("local_ref");
                return Map({ reference: unique_sym })
            } else if (env_entry.has("module_ref_sym")) {
                return env_entry;
            } else {
                throw "internal error: malformed environment";
            }
        }
        if (exp && exp.size > 0) {
            const list = exp
            const rator = list.get(0)
            if (runtime["identifier?"](rator) && env.has(rator) && env.get(rator).has("core_form")) { // Core syntactic form
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
    function parse_module(sexp, runner) {
        function module_syntax_error() {
            throw "syntax error: module must start with require and provide forms"
        }

        if (!(List.isList(sexp)
              && sexp.size >= 2)) {
            module_syntax_error();
        }


        const requnwrap = sexp.get(0);
        if (!(List.isList(requnwrap)
              && requnwrap.size > 0
              && Immutable.is(requnwrap.get(0), runtime["make-identifier"]("require"))
              && requnwrap.shift().every((v, ignore1, ignore2) => runtime["identifier?"](v)))) {
            module_syntax_error();
        }

        const provunwrap = sexp.get(1);
        if (!(List.isList(provunwrap)
              && provunwrap.size > 0
              && Immutable.is(provunwrap.get(0), runtime["make-identifier"]("provide"))
              && provunwrap.shift().every((v, ignore1, ignore2) => runtime["identifier?"](v)))) {
            module_syntax_error();
        }

        const requires = requnwrap.shift();
        const provides = provunwrap.shift();
        const body = sexp.shift().shift();

        let module_bindings = List();
        const module_env = requires.reduce((env,modname) => {
            const binding = gensym(modname);
            const decl = runner.load(runtime["identifier-string"](modname));
            module_bindings = module_bindings.push(binding);
            return decl.exports.reduce((env, name) => {
                return env.set(runtime["make-identifier"](name),
                               Map({ module_ref_sym: binding,
                                     module_ref_field: name }));
            }, env);
        }, initial_env);

        const parsed_defs = parse_defs(body, module_env)

        if (!(provides.isSubset(parsed_defs.get("surface_def_ids")))) {
            throw "provided identifier(s) not defined: " + provides.toSet().subtract(parsed_defs.get("surface_def_ids").toSet()).toString()
        }

        const surface_to_internal = Map(parsed_defs.get("surface_def_ids").zip(parsed_defs.get("block_defs").map((def) => def.get("id"))))
        const provide_internal_ids = provides.map((prov) => surface_to_internal.get(prov))

        return Map({
            module_requires: requires.map((v, ignore1, ignore2) => runtime["identifier-string"](v)),
            module_require_internal_ids: module_bindings,
            module_provides: provides.map((v, ignore1, ignore2) => runtime["identifier-string"](v)),
            module_provide_internal_ids: provide_internal_ids,
            block_defs: parsed_defs.get("block_defs")
        });
    }

    function test_parser() {
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
                        block_ret: Map({ reference: "y2" }),
                        block_exp: true}));
        assert_is(read_and_parse("(fn (x y) (def x 5) x)"),
                  Map({ fn_args: List(["x1", "y2"]),
                        block_defs: List([Map({id: "x3", rhs: Map({ number_literal: 5 })})]),
                        block_ret: Map({ reference: "x3" })}));
        assert_is(read_and_parse("(block 5)"),
                  Map({ number_literal: 5 }));

        assert_is(read_and_parse("(loop ([x 7]) (if x (recur x) 8))"),
                 Map({ loop_vars: List(["x1"]),
                       loop_inits: List([Map({ number_literal: 7 })]),
                       block_defs: List(),
                       block_ret: Map({
                           if_c: Map({ reference: "x1" }),
                           if_t: Map({ recur_exps: List([Map({ reference: "x1" })]) }),
                           if_e: Map({ number_literal: 8 })
                       })
                 }));

        function read_and_parse_module(str) {
            gensym_counter = 0;
            const sexp = reader.read(str)
            return parse_module(sexp, (m) => ({exports: ["a", "b"]}));
        }

        assert_is(read_and_parse_module("(require foo) (provide c) (def c a)"),
                 Map({
                     module_requires: List(["foo"]),
                     module_provides: List(["c"]),
                     module_provide_internal_ids: List(["c2"]),
                     module_require_internal_ids: List(["foo1"]),
                     block_defs: List([
                         Map({ id: "c2", rhs: Map({ module_ref_sym: "foo1", module_ref_field: "a" }) })
                     ])
                 }));

        console.log("tests passed")
    }

    return {
        test_parser: test_parser,
        parse_module: parse_module
    };
})

