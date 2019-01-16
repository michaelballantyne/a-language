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
  (fn (input runner)
    (def res (parse (seq (header "require" module-name) (c newline)
                         (header "provide" id-string) (c newline))
                    input))
    (if (and (get res :position) (<= (get (get res :position) :index) (size (get input :string))))
      (compiled-module
        (get (get res :result) 0)
        (get (get res :result) 1)
        (substring (get input :string) (get (get res :position) :index) (size (get input :string))))
      (error :compile-language res))))
(def compile-language compile-js)
