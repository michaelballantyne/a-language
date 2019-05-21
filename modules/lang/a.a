#lang a

(require compile/reader compile/compile compile/parse)
(provide compile-a compile-language)

(def compile-a
 (fn (input runner)
    (compile-module (parse-module (read input) runner))))

(def compile-language compile-a)
