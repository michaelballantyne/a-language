#lang js
// require: vendor/immutable, vendor/escodegen, compile/module, runtime/runtime
// provide: compile_module
(function (Immutable, escodegen, module, runtime) {
    initial_exp_ctx = "exp"
    function in_exp(ctx) {
        return initial_exp_ctx;
    }
    function in_stmt(recur_vars, ctx) {
        return recur_vars;
    }
    function is_stmt(ctx) {
        return Immutable.List.isList(ctx) || ctx === false;
    }
    function in_non_recur_stmt(ctx) {
        return false;
    }
    function is_exp(ctx) {
        return ctx === initial_exp_ctx;
    }
    function is_recur_context(ctx) {
        return Immutable.List.isList(ctx);
    }
    function get_recur_vars(ctx) {
        return ctx;
    }

    function compile_identifier(str) {
        const name_converted_specials = str.replace(/-/g, "_").replace(/\//g, "__")
        return {
            type: "Identifier",
            name: name_converted_specials
        };
    }

    function compile_provide(p) {
        [internal, external] = p;
        return {
            type: "Property",
            key: compile_identifier(external),
            value: compile_identifier(internal)
        };
    }

    function compile_def(d) {
        return {
            type: "VariableDeclaration",
            kind: "const",
            declarations: [{
                type: "VariableDeclarator",
                id: compile_identifier(d.get("id")),
                init: compile_expression(d.get("rhs"), initial_exp_ctx)
            }]
        }
    }

    function compile_expression(e, ctx) {
        function maybe_return(e) {
            if (is_stmt(ctx)) {
                return {
                    type: "ReturnStatement",
                    argument: e
                }
            } else {
                return e;
            }
        }

        if (e.has("string_literal")) {
            return maybe_return({
                type: "Literal",
                value: e.get("string_literal")
            });
        }

        if (e.has("number_literal")) {
            return maybe_return({
                type: "Literal",
                value: e.get("number_literal")
            });
        }

        if (e.has("reference")) {
            return maybe_return(compile_identifier(e.get("reference")));
        }

        if (e.has("module_ref_sym")) {
            return maybe_return({
                type: "MemberExpression",
                object: compile_identifier(e.get("module_ref_sym")),
                property: compile_identifier(e.get("module_ref_field")),
                computed: false
            });
        }

        if (e.has("app_exps")) {
            const compiled_exps = e.get("app_exps").map((e) => compile_expression(e, in_exp(ctx)));

            return maybe_return({
                type: "CallExpression",
                callee: compiled_exps.first(),
                arguments: compiled_exps.rest().toArray()
            });
        }

        function build_condition(if_c) {
            return {
                type: "BinaryExpression",
                operator: "!==",
                left: {
                    type: "Literal",
                    value: false
                },
                right: if_c
            };
        }

        if (e.has("if_c") && is_exp(ctx)) {
            const if_c = compile_expression(e.get("if_c"), ctx)
            const if_t = compile_expression(e.get("if_t"), ctx)
            const if_e = compile_expression(e.get("if_e"), ctx)

            return maybe_return({
                type: "ConditionalExpression",
                test: build_condition(if_c),
                consequent: if_t,
                alternate: if_e
            });
        }

        if (e.has("if_c") && is_stmt(ctx)) {
            const if_c = compile_expression(e.get("if_c"), in_exp(ctx));
            const if_t = compile_expression(e.get("if_t"), ctx);
            const if_e = compile_expression(e.get("if_e"), ctx);

            return {
                type: "IfStatement",
                test: build_condition(if_c),
                consequent: if_t,
                alternate: if_e
            };
        }

        function compile_block(block, ctx) {
            const decls = block.get("block_defs").map(compile_def);
            return {
                type: "BlockStatement",
                body: decls.push(compile_expression(block.get("block_ret"), ctx)).toArray()
            };
        }

        function build_loop_body(vars, inits, body, ctx) {
            const decls = vars.zip(inits).map((binding) => ({
                type: "VariableDeclaration",
                kind: "var",
                declarations: [{
                    type: "VariableDeclarator",
                    id: compile_identifier(binding[0]),
                    init: compile_expression(binding[1], in_exp(ctx))
                }]
            }));
            return {
                type: "BlockStatement",
                body: decls.push({
                    type: "WhileStatement",
                    test: {
                        type: "Literal",
                        value: true
                    },
                    body: compile_block(body, in_stmt(vars, ctx))
                }).toArray()
            }
        }

        if (e.has("fn_args")) {
            const temps_as_refs = e.get("fn_temps").map((t) => Immutable.Map({reference: t}))
            return maybe_return({
                type: "FunctionExpression",
                params: e.get("fn_temps").map(compile_identifier).toArray(),
                body: build_loop_body(e.get("fn_args"), temps_as_refs, e, ctx)
            })
        }

        if (e.has("loop_vars") && is_stmt(ctx)) {
            return build_loop_body(e.get("loop_vars"), e.get("loop_inits"), e);
        }

        if (e.has("loop_vars") && is_exp(ctx)) {
            return maybe_return({
                type: "CallExpression",
                callee: {
                    type: "FunctionExpression",
                    params: [],
                    body: build_loop_body(e.get("loop_vars"), e.get("loop_inits"), e)
                },
                arguments: []
            });
        }

        if (e.has("block_exp") && is_stmt(ctx)) {
            return compile_block(e, ctx);
        }

        if (e.has("block_exp") && is_exp(ctx)) {
            return maybe_return({
                type: "CallExpression",
                callee: {
                    type: "FunctionExpression",
                    params: [],
                    body: compile_block(e, in_non_recur_stmt(ctx))
                },
                arguments: []
            });
        }

        if (e.has("recur_exps")) {
            if (!is_recur_context(ctx)) {
                throw "recur not in tail position";
            }
            if (get_recur_vars(ctx).size !== e.get("recur_exps").size) {
                throw "wrong number of arguments to recur"
            }

            const temp_assigns = e.get("recur_temps").zip(e.get("recur_exps")).map((binding) => ({
                type: "ExpressionStatement",
                expression: {
                    type: "AssignmentExpression",
                    operator: "=",
                    left: compile_identifier(binding[0]),
                    right: compile_expression(binding[1], in_exp(ctx))
                }
            }));

            const loop_var_assigns = get_recur_vars(ctx).zip(e.get("recur_temps")).map((binding) => ({
                type: "ExpressionStatement",
                expression: {
                    type: "AssignmentExpression",
                    operator: "=",
                    left: compile_identifier(binding[0]),
                    right: compile_expression(Immutable.Map({reference: binding[1]}), in_exp(ctx))
                }
            }));

            return {
                type: "BlockStatement",
                body: temp_assigns.concat(loop_var_assigns).toArray()
            }
        }

        throw "unhandled: " + e + ctx
    }

    // stree -> string_of_js
    function compile_module(stree) {
        console.log(stree)
        stree.get("module_require_internal_ids")
        stree.get("module_provide_internal_ids")
        stree.get("block_defs")

        const compiled_definitions = stree.get("block_defs").map(compile_def)

        const compiled_return = {
            type: "ReturnStatement",
            argument: {
                type: "ObjectExpression",
                properties: stree.get("module_provide_internal_ids").zip(stree.get("module_provides")).map(compile_provide).toArray()
            }
        }

        const estree = {
            type: "ExpressionStatement",
            expression: {
                type: "FunctionExpression",
                params: stree.get("module_require_internal_ids").map(compile_identifier).toArray(),
                body: {
                    type: "BlockStatement",
                    body: compiled_definitions.push(compiled_return).toArray()
                }
            }
        };

        const util = require("util");

        function print(obj) {
            console.log(util.inspect(obj, false, null));
        }

        print(estree)

        const compiled_body = escodegen.generate(estree);

        const res = module.CompiledModule(stree.get("module_requires").toArray(),
                                     stree.get("module_provides").toArray(),
                                     compiled_body);
        console.log(compiled_body)
        return res;
    }

    return {compile_module: compile_module}
})
