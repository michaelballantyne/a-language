#lang js
// require: vendor/immutable
// provide: main
(function (Immutable) {
    function main(args) {
        var map1 = Immutable.Map({a:1, b:2, c:3});
        var map2 = map1.set('b', 50);
        console.log(map1.get('b')); // 2
        console.log(map2.get('b')); // 50
    }

    return { main: main }
})
