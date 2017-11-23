const vm = require("vm");
const fs = require("fs");

const text = fs.readFileSync("bootfiles/nodecli.js").toString();
const evaled = vm.runInNewContext(text, {console: console, require: require, process: process})
evaled()["main"](process.argv.slice(2))