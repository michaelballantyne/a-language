#lang a

(require runtime/runtime compile/parser-tools)
(provide main read)

(def sexp
  (nonterm
    "sexp"
    (fn ()
      (or/p
        id
        integer
        string
        keyword
        (seq (c "(") sexp-list (c ")"))
        (seq (c "[") sexp-list (c "]"))))))

(def sexp-list
  (nonterm
    "list of s-expressions"
    (fn ()
      (or/p
        (seq whitespace sexp-list)
        (seq comment sexp-list)
        (apply-action (seq sexp (or/p (seq whitespace sexp-list)
                                empty-as-list))
                      cons)
        empty-as-list))))

(def comment
  (nonterm
    "comment"
    (fn ()
     (seq (c ";") (zero-or-more (c-not newline)) (c newline)))))

(def id
  (nonterm
    "identifier"
    (fn () (action id-string make-identifier))))

(def keyword
  (nonterm
    "keyword"
    (fn ()
      (action (seq (c ":") (capture-string (one-or-more (or/p digit idchar))))
              make-keyword))))

(def integer
  (nonterm
    "integer"
    (fn ()
      (action (capture-string (or/p (c "0") (seq (c-range "1" "9") (zero-or-more digit))))
              string->integer))))

(def string
  (nonterm
    "string"
    (fn ()
      (seq (c double-quote) (capture-string (zero-or-more (c-not double-quote))) (c double-quote)))))

(def top (seq sexp-list eof))

(def read
  (fn (s)
    (def res (parse top s))
    (if (=== (size s) (get res :position))
      (get res :result)
      (error :read res))))

(def main
  (fn (args)
    (read-stdin
      (fn (s)
        (displayln (read s))))))

