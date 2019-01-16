#lang a

(require runtime/runtime compile/parser-tools)
(provide main read)

(def sexp
  (nonterm
    "s-expression"
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
     (seq (c ";") (zero-or-more (describe "comment body" (c-not newline))) newline/p))))

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
      (seq (c double-quote) (capture-string (zero-or-more (describe "string body" (c-not double-quote)))) (c double-quote)))))

(def top (seq sexp-list eof))

(def read
  (fn (input)
    (def res (parse top input))
    (if (= (size (get input :string)) (get (get res :position) :index))
      (get res :result)
      (error :read res))))

(def main
  (fn (args)
    (read-stdin
      (fn (s)
        (displayln (read (hash :string s :index 0 :srcpos (hash :line 1 :column 0))))))))

