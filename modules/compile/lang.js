#lang a

(require runtime/runtime lang/js lang/a compile/parser-tools)
(provide compile-via-lang)

(def compile-via-lang
  (fn (source runner)
    (def res (parse (seq (string/p "#lang") (c " ") module-name (c newline)) source 0))
    (if (and (get res :position) (<= (get res :position) (size source)))
      (block
        (def lang (get res :result))
        (if (equal? "js" lang)
          (compile-js source (get res :position) runner)
          (if (equal? "a" lang)
            (compile-a source (get res :position) runner)
            (block
              (def lang-mod-inst ((get runner :run) lang))
              (def _ (if (not (has lang-mod-inst :compile-language))
                       (error "compile-via-lang" "#lang module does not implement compile-language")
                       null))
              ((get lang-mod-inst :compile-language) source (get res :position) runner)))))
      (error "compile-via-lang" res))))

