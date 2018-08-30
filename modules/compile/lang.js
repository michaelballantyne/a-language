#lang a

(require runtime/runtime lang/js lang/a compile/parser-tools compile/reader)
(provide compile-via-lang)

(def compile-via-lang
  (fn (source runner)
    (def res (parse (seq (string/p "#lang ") module-name (c newline)) source))
    (if (and (get res :position) (<= (get res :position) (size source)))
      (block
        (def lang (get res :result))
        (def body (substring source (get res :position) (size source)))
        (if (equal? "js" lang)
          (compile-js body runner)
          (if (equal? "a" lang)
            (compile-a body runner)
            (block
              (def lang-mod-inst ((get runner :run) lang))
              (def _ (if (not (has lang-mod-inst :compile-language))
                       (error "compile-via-lang" "#lang module does not implement compile-language")
                       null))
              ((get lang-mod-inst :compile-language) body runner)))))
      (error "compile-via-lang" res))))

