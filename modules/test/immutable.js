#lang js
// require: vendor/immutable
// provide: main
(function (Immutable) {
    function main(args) {
        var map1 = Immutable.Map({a:1, b:2, c:3});
        var map2 = map1.set('b', 50);
        console.log(map1.get('b')); // 2
        console.log(map2.get('b')); // 50
        console.log(map2.get('f')); // undefined
        var o = {a:1}
        console.log(Immutable.get({ x: 123, y: 456 }, 'x') );
    }

    return { main: main }
})
