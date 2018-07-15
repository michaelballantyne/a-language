#lang lang/a

(require runtime/runtime)
(provide main)

(def succeed
  (fn (index)
    (hash :position index :failure (list))))

(def fail
  (fn (failures)
    (hash :position false :failure failures)))

(def c-pred
  (fn (pred description)
    (fn (input index)
      (if (and (has input index) (pred (get input index)))
        (succeed (+ index 1))
        (fail (list (hash :expected description :position index)))))))

(def c
  (fn (to-match)
    (c-pred (fn (ch) (=== ch to-match))
            (string-append "character " to-match))))

(def c-not
  (variadic
    (fn (to-match)
      (c-pred (fn (ch) (not (contains to-match ch)))
              (string-append "not " (to-string to-match))))))

(def c-range
  (fn (lower upper)
    (c-pred (fn (ch) (and (>= (character-code ch) (character-code lower)) (<= (character-code ch) (character-code upper))))
            (string-append "range " lower " to " upper))))

(def empty (fn (input index) (succeed index)))

(def eof
  (fn (input index)
    (if (=== index (size input))
      (succeed index)
      (fail (list (hash :expected "end of file" :position index))))))

; TODO: clean up once I have cond
(def merge-failures
  (fn (l r)
    (if (empty? l) r
      (if (empty? r) l
        (if (> (get (first r) :position) (get (first l) :position)) r
          (if (> (get (first l) :position) (get (first r) :position)) l
            (append l r)))))))

(def seq
  (variadic
    (fn (parsers)
      (fn (input index)
        (loop ([parsers parsers]
               [current-index index]
               [results (list)]
               [failures (list)])
          (if (and current-index (not (empty? parsers)))
            (block
              (def res ((first parsers) input current-index))
              (recur (rest parsers)
                     (and (has res :position) (get res :position))
                     (if (has res :result) (cons (get res :result) results) results)
                     (merge-failures failures (get res :failure))))
            ; TODO: this is ugly
            (if (empty? results)
              (hash :position current-index :failure failures)
              (if (= (size results) 1)
                (hash :position current-index :failure failures :result (first results))
                (hash :position current-index :failure failures :result (reverse results))))
            ;(hash :position current-index
                  ;:result (if (= (size results) 1) (first results) results)
                  ;:failure failures)
          ))))))

(def or/p
  (variadic
    (fn (parsers)
      (fn (input index)
        (loop ([parsers parsers]
               [failures (list)])
          (if (empty? parsers)
            (fail failures)
            (block
              (def res ((first parsers) input index))
              (def merged (merge-failures failures (get res :failure)))
              (if (get res :position)
                (assoc res :failure merged)
                (recur (rest parsers) merged)))))))))

(def one-or-more
  (fn (parser)
    (def self (fn (input index) ((seq parser (or/p self empty)) input index)))
    self))

(def zero-or-more
  (fn (parser)
    (def self (fn (input index) ((or/p (seq parser self) empty) input index)))
    self))

(def describe
  (fn (name parser)
    (fn (input index)
      (def res (parser input index))
      (def failures (get res :failure))
      ; TODO: is only checking the first of the failures the right idea? What if one
      ; of the alternatives within the description / nonterminal matched further?
      (if (and (not (empty? failures)) (=== index (get (first failures) :position)))
        (assoc res :failure (list (hash :expected name :position index)))
        res))))

; Helps tie the recursive knot.
(def nonterm
  (fn (description f)
    (describe description
              (variadic (fn (args) (apply (f) args))))))

(def action
  (fn (parser f)
    (fn (input index)
      (def res (parser input index))
      (if (get res :position)
        (assoc res :result (f (if (has res :result) (get res :result) null)))
        res))))

(def capture-string
  (fn (parser)
    (fn (input index)
      (def res (parser input index))
      (if (get res :position)
        (assoc res :result (substring input index (get res :position)))
        res))))

(def parse
  (fn (grammar input)
    (grammar input 0)))


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

(def empty-as-list
  (action empty (fn (ignore) (list))))

(def sexp-list
  (nonterm
    "list of s-expressions"
    (fn ()
      (or/p
        (seq whitespace sexp-list)
        (seq comment sexp-list)
        (action (seq sexp (or/p (seq whitespace sexp-list)
                                empty-as-list))
                (fn (pr) (cons (first pr) (first (rest pr)))))
        empty-as-list))))

(def whitespace
  (nonterm
    "whitespace"
    (fn ()
      (one-or-more (or/p (c " ") (c newline))))))

(def comment
  (nonterm
    "comment"
    (fn ()
     (seq (c ";") (zero-or-more (c-not newline)) (c newline)))))

(def digit
 (nonterm
  "digit"
  (fn ()
   (c-range "0" "9"))))

(def alpha (or/p (c-range "a" "z")
                 (c-range "A" "Z")))

(def module-segment (seq alpha (zero-or-more (or/p alpha digit))))
(def module-name (seq module-segment (zero-or-more (seq (c "/") module-segment))))

(def idchar
  (nonterm
    "identifier character"
    (fn ()
        (or/p
          alpha
          (c "+")
          (c "-")
          (c "*")
          (c "%")
          (c "=")
          (c "!")
          (c "<")
          (c ">")
          (c "-")
          (c "/")
          (c "?")
          (c "_")))))

(def id
  (nonterm
    "identifier"
    (fn ()
      (action (capture-string (seq idchar (zero-or-more (or/p digit idchar))))
              (fn (str) (make-identifier str))))))

(def keyword
  (nonterm
    "keyword"
    (fn ()
      (action (seq (c ":") (capture-string (one-or-more (or/p digit idchar))))
              (fn (str) (make-keyword str))))))

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

(def valid-module-name
  (fn (s)
    (!== false (get (parse module-name s) :position))))

(def valid-id-name
  (fn (s)
    (!== false (get (parse id s) :position))))

(def read
  (fn (s)
    (def res (parse top s))
    (if (=== (size s) (get res :position))
      (get res :result)
      (error :read res))))

(def main
  (fn (args)

   ;(displayln (parse digit "1"))
    (read-stdin (fn (s)
                  (displayln (read s))))

    ;(list
      ;;(displayln ((seq (c "a") (c "b")) (list "a" "b" "c") 0))
      ;;(displayln ((seq (c "a") (c "b")) (list "a" "b" "c") 1))
      ;(displayln ((or/p (c "a") (c "b") (c "c")) (list "c") 0))
    ;)

    ))

