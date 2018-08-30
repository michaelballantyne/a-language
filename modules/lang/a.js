#lang a

(require compile/reader compile/compile compile/parse)
(provide compile-a compile-language)

(def compile-a
 (fn (body runner)
    (compile-module (parse-module (read body) runner))))

(def compile-language compile-a)
