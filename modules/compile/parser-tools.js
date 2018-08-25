#lang a

(require runtime/runtime)
(provide c c-not c-range string/p empty seq or/p eof one-or-more zero-or-more describe nonterm action apply-action capture-string parse whitespace alpha digit empty-as-list)

(def succeed
  (fn (index)
    (obj :position index :failure (list))))

(def fail
  (fn (failures)
    (obj :position false :failure failures)))

(def string/p
  (fn (to-match)
    (fn (input index)
      (if (and (has input (+ index (- (size to-match) 1)))
               (equal? to-match (substring input index (+ index (size to-match)))))
        (succeed (+ index (size to-match)))
        (fail (list (obj :expected (string-append "string " to-match) :position index)))))))

(def c-pred
  (fn (pred description)
    (fn (input index)
      (if (and (has input index) (pred (get input index)))
        (succeed (+ index 1))
        (fail (list (obj :expected description :position index)))))))

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
      (fail (list (obj :expected "end of file" :position index))))))

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
              (obj :position current-index :failure failures)
              (if (= (size results) 1)
                (obj :position current-index :failure failures :result (first results))
                (obj :position current-index :failure failures :result (reverse results))))
            ;(obj :position current-index
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
        (assoc res :failure (list (obj :expected name :position index)))
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

(def apply-action (fn (parser f) (action parser (fn (l) (apply f l)))))

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


(def whitespace
  (nonterm
    "whitespace"
    (fn ()
      (one-or-more (or/p (c " ") (c newline))))))

(def digit
 (nonterm
  "digit"
  (fn ()
   (c-range "0" "9"))))

(def alpha (or/p (c-range "a" "z")
                 (c-range "A" "Z")))

(def empty-as-list
  (action empty (fn (ignore) (list))))

