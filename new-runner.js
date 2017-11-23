var module_lib = require('./module.js');

const resolve = require("./resolve").resolve;

const module_name = process.argv[2]
const procedure_name = process.argv[3]

if (module_name === undefined || procedure_name === undefined) {
    throw "Usage: node runner.js <module-name> <procedure>";
}

const instance = module_lib.run_module(resolve, module_name)

if (!resolve(module_name).exports.includes(procedure_name)) {
    throw "Procedure not in module exports: " + procedure_name;
}

const procedure = instance[procedure_name];

if (!(procedure.length === 0)) {
    throw "Procedure should expect 0 arguments; expects " + procedure.length;
}

procedure()
