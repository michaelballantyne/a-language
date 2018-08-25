#lang a

(require runtime/runtime compile/module compile/reader compile/parser-tools)
(provide compile-language)

(def header
  (fn (name el)
    (def comma-list
      (nonterm
        "comma separated list"
        (fn ()
          (action (seq el tail)
                  (fn (p) (cons (get p 0) (get p 1)))))))
    (def tail (or/p (seq (string/p ", ") comma-list) empty-as-list))

    (seq (string/p "// ") (string/p name) (c ":") (or/p (seq (c " ") comma-list)
                                                        empty-as-list))))

(def compile-language
  (fn (source runner)
    (def res (parse (seq (header "require" module-name)
                         (c newline)
                         (header "provide" id-string)
                         (c newline))
                    source))
    ; TODO: make position property unifmrm, make <= blow up on false.`
    (if (and (and (has res :position) (get res :position))
             (<= (get res :position) (size source)))
      (compiled-module
        (get (get res :result) 0)
        (get (get res :result) 1)
        (substring source (get res :position) (size source)))
      (error :compile-language res))))
