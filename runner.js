const run_module = require("./module.js").run_module
const LinkModule = require("./module.js").LinkModule


let modules = {}

modules["reader"] = require("./reader.js");
modules["assembler"] = require("./assembler.js");
modules["escodegen"] = LinkModule([], ["generate"], function () { return require("escodegen"); });
modules["sexpjs"] = require("./sexpjs.js");
modules["flatten"] = require("./flatten.js");

const module_name = process.argv[2]
const procedure_name = process.argv[3]

if (module_name === undefined || procedure_name === undefined) {
    throw "Usage: node runner.js <module-name> <procedure>";
}

const instance = run_module(modules, module_name)

if (!modules[module_name].exports.includes(procedure_name)) {
    throw "Procedure not in module exports: " + procedure_name;
}

const procedure = instance[procedure_name];

if (!(procedure.length === 0)) {
    throw "Procedure should expect 0 arguments; expects " + procedure.length;
}

procedure()
