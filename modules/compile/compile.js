#lang js
// require: vendor/immutable, vendor/escodegen, compile/module, runtime/runtime
// provide: compile_module
(function (Immutable, escodegen, module, runtime) {
    initial_exp_ctx = "exp"
    function in_exp(ctx) {
        return initial_exp_ctx;
    }
    function in_stmt(arg_count, ctx) {
        return arg_count;
    }
    function is_exp(ctx) {
        return ctx === initial_exp_ctx;
    }
    function is_stmt(ctx) {
        return runtime.is_number(ctx);
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
            if (in_stmt(ctx)) {
                return {
                    type: "ReturnStatement",
                    argument: e
                }
            } else {
                return e;
            }
        }

        if (e.has("string_literal")) {
            return {
                type: "Literal",
                value: e.get("string_literal")
            }
        }

        if (e.has("number_literal")) {
            return {
                type: "Literal",
                value: e.get("number_literal")
            }
        }

        if (e.has("reference")) {
            return compile_identifier(e.get("reference"));
        }

        if (e.has("module_ref_sym")) {
            return {
                type: "MemberExpression",
                object: compile_identifier(e.get("module_ref_sym")),
                property: compile_identifier(e.get("module_ref_field")),
                computed: false
            };
        }

        if (e.has("app_exps")) {
            const compiled_exps = e.get("app_exps").map((e) => compile_expression(e, in_exp(ctx)));

            console.log(compiled_exps)
            return {
                type: "CallExpression",
                callee: compiled_exps.first(),
                arguments: compiled_exps.rest().toArray()
            };
        }

        if (e.has("if_c") && is_exp(ctx)) {
            const if_c = compile_expression(e.get("if_c"), ctx)
            const if_t = compile_expression(e.get("if_t"), ctx)
            const if_e = compile_expression(e.get("if_e"), ctx)

            return {
                type: "ConditionalExpression",
                test: {
                    type: "BinaryExpression",
                    operator: "!==",
                    left: {
                        type: "Literal",
                        value: false
                    },
                    right: if_c
                },
                consequent: if_t,
                alternate: if_e
            }
        }

        if (e.has("if_c") && is_stmt(ctx)) {
            const if_c = compile_expression(e.get(), in_expr(ctx));
            const if_t = compile_expression(e.get(), ctx);
            const if_e = compile_expression(e.get(), ctx);

            return {
                type: "IfStatement",
                test: {
                    type: "BinaryExpression",
                    operator: "!==",
                    left: {
                        type: "Literal",
                        value: false
                    },
                    right: if_c
                },
                consequent: if_t,
                alternate: if_e
            };
        }

        throw "unhandled: " + e
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
