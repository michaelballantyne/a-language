#lang a

(require compile/reader compile/compile compile/parse)
(provide compile-a compile-language)

(def compile-a
 (fn (source index runner)
    (compile-module (parse-module (read source index) runner))))

(def compile-language compile-a)
