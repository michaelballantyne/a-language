#lang a

(require runtime/runtime compile/module compile/reader)
(provide compile-js)

(def andmap
  (fn (f l)
    (foldl (fn (a b) (and a b)) true
           (map f l))))

(def parse-decl
  (fn (name line valid-name)
    (def malformed (fn () (error (string-append "malformed " name) line)))
    (def split (string-split line ":"))
    (def _ (if (not (equal? (string-append "// " name) (get split 0)))
             (malformed)
             null))
    (if (equal? "" (string-trim (get split 1)))
      (list)
      (block
        (def names (map string-trim (string-split (get split 1) ",")))
        (def _ (if (not (andmap valid-name names))
                 (malformed)
                 null))
        names))))

(def compile-js
  (fn (source runner)
    (def lines (string-split source newline))
    (def imports (parse-decl "require" (get lines 0) valid-module-name))
    (def exports (parse-decl "provide" (get lines 1) valid-id-name))
    (def body (string-join (rest (rest lines)) newline))
    (CompiledModule (list->array imports) (list->array exports) body)))

