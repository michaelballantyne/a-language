#lang a

(require runtime/runtime compile/module compile/parser-tools)
(provide compile-js compile-language)

(def header
  (fn (name el)
    (def comma-list
      (nonterm (string-append name " list")
               (fn () (apply-action (seq el tail) cons))))
    (def tail (or/p (seq (string/p ", ") comma-list) empty-as-list))

    (seq (string/p "// ") (string/p name) (c ":") (or/p (seq (c " ") comma-list)
                                                        empty-as-list))))

(def compile-js
  (fn (source runner)
    (def res (parse (seq (header "require" module-name) (c newline)
                         (header "provide" id-string) (c newline))
                    source))
    (if (and (get res :position) (<= (get res :position) (size source)))
      (compiled-module
        (get (get res :result) 0)
        (get (get res :result) 1)
        (substring source (get res :position) (size source)))
      (error :compile-language res))))
(def compile-language compile-js)
