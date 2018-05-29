// require: compile/js, node/resolve
// provide: main
(function (compilejs, noderesolve) {
  const main = function (module_name) {
    const module_source = noderesolve.resolve(module_name);
    const module_declaration = compilejs.compileJS(module_source);

    for (name of module_declaration.exports) {
      console.log(name);
    }
  }

  return { main: main }
})
