#lang lang/js
// require:
// provide: main, foo
(function (g) {
    function main() {
        console.log("hello world");
    }

    return {main: main, foo: 5};
})
