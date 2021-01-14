const vm = require("vm");
const fs = require("fs");

const text = fs.readFileSync("bootfiles/nodecli.js").toString();
const evaled = vm.runInNewContext(text, {setImmediate: setImmediate, console: console, require: require, process: process})
evaled()(process.argv.slice(2))
