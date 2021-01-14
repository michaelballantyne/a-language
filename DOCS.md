Run the `main` method of module `test/factorial` in module search path
`modules` using the bootfile compiler:

```
node run.js modules test/factorial main
```

Same as above, but via a new compiler and runner as defined in
`modules`:

```
node run.js modules node/cli main modules test/factorial main
```

Bootstrap a new compiler bootfile (bootfiles/nodecli.js):

```
node run.js modules node/bootstrap main modules
```

Changing things like the calling convention of compiled modules requires
a more complicated bootstrap. Running the bootstrapper will use a
mixture of primitive modules written in js such as `runtime/runtime` and
`.a` modules that will be compiled by the compiler in the current
`bootfiles/nodecli.js` bootfile. These modules need to have a consistent
calling convention, so the primitive modules must use the "old" calling
convention. But we want the new bootfile to have primitive modules using
the "new" calling convention.

In this case, create a copy of `modules` as `modules2` and make the
modifications to the compiler and the calling convention in the
primitive modules there.  Then bootstrap as:

```
node run.js modules node/bootstrap main modules2
```

Finally, discard `modules` and replace it with `modules2` now that the
bootfile compiler knows how to work with the new convention.

