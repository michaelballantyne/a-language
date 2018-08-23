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
        runtime["string/c"]("compile_identifier", str);
        return {
            type: "Identifier",
            name: str
        };
    }

    function compile_provide(p) {
        [internal, external] = p;
        return {
            type: "Property",
            key: {type: "Literal", value: external},
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

        if (e.has("literal")) {
            return maybe_return({
                type: "Literal",
                value: e.get("literal")
            });
        }

        if (e.has("local-ref")) {
            return maybe_return(compile_identifier(e.get("local-ref")));
        }

        if (e.has("module-ref-sym")) {
            return maybe_return({
                type: "MemberExpression",
                object: compile_identifier(e.get("module-ref-sym")),
                property: {
                    type: "Literal",
                    value: e.get("module-ref-field"),
                },
                computed: true
            });
        }

        if (e.has("app-exps")) {
            const compiled_exps = e.get("app-exps").map((e) => compile_expression(e, in_exp(ctx)));

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

        if (e.has("if-c") && is_exp(ctx)) {
            const if_c = compile_expression(e.get("if-c"), ctx)
            const if_t = compile_expression(e.get("if-t"), ctx)
            const if_e = compile_expression(e.get("if-e"), ctx)

            return maybe_return({
                type: "ConditionalExpression",
                test: build_condition(if_c),
                consequent: if_t,
                alternate: if_e
            });
        }

        if (e.has("if-c") && is_stmt(ctx)) {
            const if_c = compile_expression(e.get("if-c"), in_exp(ctx));
            const if_t = compile_expression(e.get("if-t"), ctx);
            const if_e = compile_expression(e.get("if-e"), ctx);

            return {
                type: "IfStatement",
                test: build_condition(if_c),
                consequent: if_t,
                alternate: if_e
            };
        }

        function compile_block(block, ctx) {
            const decls = block.get("block-defs").map(compile_def);
            return {
                type: "BlockStatement",
                body: decls.push(compile_expression(block.get("block-ret"), ctx)).toArray()
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

        function build_arity_check(name, count) {
            return {
                type: "IfStatement",
                test: {
                    type: "BinaryExpression",
                    operator: "!==",
                    left: {
                        type: "Literal",
                        value: count
                    },
                    right: {
                        type: "MemberExpression",
                        object: compile_identifier("arguments"),
                        property: compile_identifier("length")
                    }
                },
                consequent: {
                    type: "ExpressionStatement",
                    expression: {
                        type: "CallExpression",
                        callee: {
                            type: "MemberExpression",
                            object: compile_identifier("$runtime"),
                            property: { type: "Literal", value: "raise-arity-error" },
                            computed: true
                        },
                        arguments: [
                            { type: "Literal", value: name },
                            { type: "Literal", value: count },
                            {
                                type: "MemberExpression",
                                object: compile_identifier("arguments"),
                                property: compile_identifier("length")
                            }
                        ]
                    },
                    alternate: null
                }
            }
        }

        if (e.has("fn-args")) {
            const temps_as_refs = e.get("fn-temps").map((t) => Immutable.Map({"local-ref": t}))
            return maybe_return({
                type: "FunctionExpression",
                params: e.get("fn-temps").map(compile_identifier).toArray(),
                body: {
                    type: "BlockStatement",
                    body: [
                        build_arity_check("anonymous procedure", e.get("fn-args").size),
                        build_loop_body(e.get("fn-args"), temps_as_refs, e, ctx)
                    ]
                }
            })
        }

        if (e.has("loop-vars") && is_stmt(ctx)) {
            return build_loop_body(e.get("loop-vars"), e.get("loop-inits"), e);
        }

        if (e.has("loop-vars") && is_exp(ctx)) {
            return maybe_return({
                type: "CallExpression",
                callee: {
                    type: "FunctionExpression",
                    params: [],
                    body: build_loop_body(e.get("loop-vars"), e.get("loop-inits"), e)
                },
                arguments: []
            });
        }

        if (e.has("block-exp") && is_stmt(ctx)) {
            return compile_block(e, ctx);
        }

        if (e.has("block-exp") && is_exp(ctx)) {
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

        if (e.has("recur-exps")) {
            if (!is_recur_context(ctx)) {
                throw "recur not in tail position";
            }
            if (get_recur_vars(ctx).size !== e.get("recur-exps").size) {
                throw "wrong number of arguments to recur"
            }

            const temp_assigns = e.get("recur-temps").zip(e.get("recur-exps")).map((binding) => ({
                type: "ExpressionStatement",
                expression: {
                    type: "AssignmentExpression",
                    operator: "=",
                    left: compile_identifier(binding[0]),
                    right: compile_expression(binding[1], in_exp(ctx))
                }
            }));

            const loop_var_assigns = get_recur_vars(ctx).zip(e.get("recur-temps")).map((binding) => ({
                type: "ExpressionStatement",
                expression: {
                    type: "AssignmentExpression",
                    operator: "=",
                    left: compile_identifier(binding[0]),
                    right: compile_expression(Immutable.Map({"local-ref": binding[1]}), in_exp(ctx))
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
        const compiled_definitions = stree.get("block-defs").map(compile_def)

        const compiled_return = {
            type: "ReturnStatement",
            argument: {
                type: "ObjectExpression",
                properties: stree.get("module-provide-internal-ids").zip(stree.get("module-provides")).map(compile_provide).toArray()
            }
        }

        const require_internal_ids = stree.get("module-require-internal-ids").unshift("$runtime")

        const estree = {
                type: "FunctionExpression",
                params: require_internal_ids.map(compile_identifier).toArray(),
                body: {
                    type: "BlockStatement",
                    body: compiled_definitions.push(compiled_return).toArray()
                }
            };

        const util = require("util");

        function print(obj) {
            console.log(util.inspect(obj, false, null));
        }

        //print(estree)

        const compiled_body = escodegen.generate(estree);

        // this makes the output legal in both expression and statement position
        const paren_wrapped = "(" + compiled_body + ")";

        const module_requires = stree.get("module-requires").unshift("runtime/minimal")

        const res = module.CompiledModule(module_requires.toArray(),
                                     stree.get("module-provides").toArray(),
                                     paren_wrapped);
        //console.log(compiled_body)
        return res;
    }

    return {compile_module: compile_module}
})
