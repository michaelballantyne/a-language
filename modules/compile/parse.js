// require: vendor/immutable, compile/reader, runtime/runtime
// provide: test_parse_exp, parse_module
(function (Immutable, reader, runtime) {
    // Environment rhs types
    const core_form_parse_fn = Symbol("core_form_parse_fn");
    function make_core_form(name, fn) {
        return [runtime.make_identifier(name), Immutable.Map([[core_form_parse_fn, fn]])];
    }

    // The value in the environment for the def core form is just this symbol.
    const def_entry = Symbol("def");

    const local_ref_unique_id = Symbol("local_ref_unique_id");
    function make_local_ref(unique_id) {
        return Immutable.Map([[local_ref_unique_id, unique_id]]);
    }

    const module_ref_var_id = Symbol("module_ref_var_id");
    const module_ref_field_name = Symbol("module_ref_field_name");
    function make_module_ref(var_id, field_name) {
        return Immutable.Map([[module_ref_var_id, var_id], [module_ref_field_name, field_name]]);
    }

    function syntax_error(exp) {
        throw "bad syntax: " + exp.toString();
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

    const initial_env = Immutable.Map([["def", def_entry],
                                       make_core_form("fn", fn_parser),
                                       make_core_form("if", if_parser),
                                       make_core_form("loop", loop_parser),
                                       make_core_form("block", block_parser),
                                       make_core_form("recur", recur_parser),
                                       make_core_form("quote", quote_parser)]);

    function parse_exp(exp, env) {
        if (runtime.isString(exp)) {
            throw "string literals parser not yet implemented";
        }
        if (runtime.isNumber(exp)) {
            throw "number literals parser not yet implemented";
        }
        if (runtime.isIdentifier(exp)) { // Variable reference
            throw "variable reference parser not yet implemented";
        } else if (match_wrapper("#%round", exp) && exp.size > 0) {
            const list = match_wrapper("#%round", exp);
            const rator = list.get(0)
            if (runtime.isIdentifier(rator) && env.has(rator) && env.get(rator).has(core_form_parse_fn)) { // Core syntactic form
                const core_form_parser = env.get(rator).get(core_form_parse_fn);
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
        const util = require("util");

        function print(obj) {
            console.log(util.inspect(obj, false, null));
        }

        let process = require("process")
        let chunks = [];
        process.stdin.resume()
        process.stdin.on('data', function(chunk) { chunks.push(chunk); });
        process.stdin.on('end', function() {
            let string = chunks.join("");
            try {
                print(parse_exp(reader.read(string).get(0), initial_env));
            } catch (e) {
                print(e);
            }
        });
    }

    return {
        test_parse_exp: test_parse_exp,
        parse_module: parse_module
    };
})

