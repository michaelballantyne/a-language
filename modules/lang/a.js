#lang a

(require compile/reader compile/compile compile/parse)
(provide compile-language)

(def compile-language
  (fn (body runner)
    (compile-module (parse-module (read body) runner))))
