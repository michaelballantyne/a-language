#lang a

(require runtime/runtime lang/js lang/a compile/parser-tools)
(provide compile-via-lang)

(def compile-via-lang
  (fn (source runner)
    (def res (parse (seq (string/p "#lang") (c " ") module-name (c newline)) source))
    (if (and (get res :position) (<= (get (get res :position) :index) (size (get source :string))))
      (block
        (def lang (get res :result))
        (if (equal? "js" lang)
          (compile-js (get res :position) runner)
          (if (equal? "a" lang)
            (compile-a (get res :position) runner)
            (block
              (def lang-mod-inst ((get runner :run) lang))
              (def _ (if (not (has lang-mod-inst :compile-language))
                       (error "compile-via-lang" "#lang module does not implement compile-language")
                       null))
              ((get lang-mod-inst :compile-language) (get res :position) runner)))))
      (error "compile-via-lang" res))))

