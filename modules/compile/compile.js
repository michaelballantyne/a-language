#lang js
// require: vendor/immutable, vendor/escodegen, compile/module
// provide: compile_module
(function (Immutable, escodegen, module) {
    function compile_identifier(str) {
        return {
            type: "Identifier",
            name: str.replace(/-/g, "_").replace(/\//g, "__")
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
                init: {
                    type: "Literal",
                    value: 5
                }
            }]
        }
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

        const compiled_body = escodegen.generate(estree);

        const res = module.CompiledModule(stree.get("module_requires").toArray(),
                                     stree.get("module_provides").toArray(),
                                     compiled_body);
        console.log(res)
        return res;
    }

    return {compile_module: compile_module}
})
