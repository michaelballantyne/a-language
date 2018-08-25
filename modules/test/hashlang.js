#lang lang/js
// require: vendor/immutable, vendor/escodegen
// provide: main, foo
(function () {
    function main() {
        console.log("hello world");
    }

    return {main: main, foo: 5};
})
