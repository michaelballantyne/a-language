#lang a

(require runtime/runtime)
(provide test-input-rep with-srcloc c c-not c-range string/p empty seq or/p eof one-or-more zero-or-more describe nonterm action apply-action capture-string parse whitespace alpha digit empty-as-list module-name id-string idchar newline/p)

; This is a simple PEG (not packrat) parsing framework, though all the langauges it is used for are LL(1).
; When reporting failures, all but the longest parse is dropped. Because the underlying parsing is PEG rather
; than LL, it unfortunately can't point to a particular nonterminal (or stack of nonterminals) it failed within.

; Source location property format. From https://developer.mozilla.org/en-US/docs/Mozilla/Projects/SpiderMonkey/Parser_API#Node_objects
;
; :loc :: SourceLocation
; SourceLocation = (Has :source :start :end)
; :source :: String
; :start :: LocPosition
; :end :: LocPosition
; LocPosition = (Has :line :column)
; :line :: uint32 >= 1
; :column :: uint32 >= 0

; Input = (has :string :index :srcps)
; :string :: string
; :index :: uint32
; :srcpos :: LocPosition

(def input-has-chars?
  (fn (input n-chars)
    (has (get input :string) (+ (get input :index) (- n-chars 1)))))

(def step-input
  (fn (input)
    (def pos (get input :srcpos))
    (def index (get input :index))
    (assoc (assoc input
                  :index (+ 1 index))
           :srcpos (if (=== newline (get (get input :string) index))
                     (obj :line (+ 1 (get pos :line)) :column 0)
                     (obj :line (get pos :line) :column (+ 1 (get pos :column)))))))

(def advance-input
  (fn (input n-chars)
    (loop ([n-chars n-chars]
           [input input])
      (if (= 0 n-chars)
        input
        (recur (- n-chars 1)
               (step-input input))))))

(def input-substring
  (fn (start-input after-input)
    (substring (get start-input :string)
               (get start-input :index)
               (get after-input :index))))

(def inputs->srcloc
  (fn (start-input after-input)
    (obj :source (get start-input :source)
         :start (get start-input :srcpos)
         :end (get after-input :srcpos))))

(def with-srcloc
  (fn (parser)
    (fn (input)
      (def res (parser input))
      (if (get res :position)
        (block
          (def loc (inputs->srcloc input (get res :position)))
          (def new-result (assoc (get res :result) :loc loc))
          (def _ (if (not (has res :result))
                   (error "with-srcloc" (string-append "term does not have result: " (to-string res)))
                   null))
          (assoc res :result new-result))
        res))))

(def test-input-rep
  (fn (args)
    (def init (obj :string (string-append "foo" newline "bar") :index 0 :srcpos (obj :line 1 :column 0)))
    (def _1 (displayln (advance-input init 3)))
    (def _2 (displayln (advance-input init 4)))
    (def _3 (displayln (input-substring init (advance-input init 3))))
    (displayln "not implemented")))

(def succeed
  (fn (input)
    (obj :position input :failure (list))))

(def fail
  (fn (failures)
    (obj :position false :failure failures)))

(def string/p
  (fn (to-match)
    (fn (input)
      (def sz (size to-match))
      (if (input-has-chars? input sz)
        (block
          (def next-input (advance-input input sz))
          (if (=== to-match (input-substring input next-input))
            (succeed next-input)
            (fail (list (obj :expected (string-append "string " to-match) :position input)))))
        (fail (list (obj :expected (string-append "string " to-match) :position input)))))))

(def c-pred
  (fn (pred description)
    (fn (input)
      (if (input-has-chars? input 1)
        (if (pred (get (get input :string) (get input :index)))
          (succeed (step-input input))
          (fail (list (obj :expected description :position input))))
        (fail (list (obj :expected description :position input)))))))

(def c
  (fn (to-match)
    (c-pred (fn (ch) (=== ch to-match))
            (string-append "character '" to-match "'"))))

(def c-not
  (variadic
    (fn (to-match)
      (c-pred (fn (ch) (not (contains to-match ch)))
              (string-append "not " (to-string to-match))))))

(def c-range
  (fn (lower upper)
    (c-pred (fn (ch) (and (>= (character-code ch) (character-code lower)) (<= (character-code ch) (character-code upper))))
            (string-append "range '" lower "' to '" upper "'"))))

(def empty (fn (input) (succeed input)))

(def eof
  (fn (input)
    (if (= (get input :index) (size (get input :string)))
      (succeed input)
      (fail (list (obj :expected "end of file" :position input))))))

; Assumes that within each list l and r, all failures have the same position.
; If one list has failures with a further position than the other, that list
; is returned. Otherwise the lists are appended. The intention is to preserve
; only the failures after the maximum length parse. Called by both seq and or/p
(def merge-failures
  (fn (l r)
    (if (empty? l) r
      (if (empty? r) l
        (if (> (get (get (first r) :position) :index) (get (get (first l) :position) :index)) r
          (if (> (get (get (first l) :position) :index) (get (get (first r) :position) :index)) l
            (append l r)))))))

(def seq
  (variadic
    (fn (parsers)
      (fn (input)
        (loop ([parsers parsers]
               [current-input input]
               [results (list)]
               [failures (list)])
          (if (and current-input (not (empty? parsers)))
            (block
              (def res ((first parsers) current-input))
              (recur (rest parsers)
                     (get res :position)
                     (if (has res :result) (cons (get res :result) results) results)
                     (merge-failures failures (get res :failure))))
            (block
             (def res (obj :position current-input :failure failures))
             (if (empty? results) res
              (if (= (size results) 1)
               (assoc res :result (first results))
               (assoc res :result (reverse results)))))))))))


; `or/p`:
;
; Whether success or failure, the result will have all the failures with the equal length
; longest parse from all the or branches considered before reaching the result, but not
; from those after. Failures for a success are needed in order to describe all the possible
; choice points in a sequence that could be corrected. For example, in a language without
; block expressions, this program:
;
; if (foo)
;    bar
; {
;    baz
; }
;
; could be corrected either by inserting an else or by changing the {} block to an expression.

(def or/p
  (variadic
    (fn (parsers)
      (fn (input)
        (loop ([parsers parsers]
               [failures (list)])
          (if (empty? parsers)
            (fail failures)
            (block
              (def res ((first parsers) input))
              (def merged (merge-failures failures (get res :failure)))
              (if (get res :position)
                (assoc res :failure merged)
                (recur (rest parsers) merged)))))))))

(def one-or-more
  (fn (parser)
    (def self (box null))
    (def _ (set-box! self (seq parser (or/p (fn (input) ((unbox self) input)) empty))))
    (unbox self)))

(def zero-or-more
  (fn (parser)
    (def self (box null))
    (def _ (set-box! self (or/p (seq parser (fn (input) ((unbox self) input))) empty)))
    (unbox self)))

(def describe
  (fn (name parser)
    (fn (input)
      (def res (parser input))
      (def failures (get res :failure))
      ; Because all failure lists have been summarized to only the longest parse,
      ; it is safe to only check the first.
      (if (and (not (empty? failures)) (= (get input :index) (get (get (first failures) :position) :index)))
        (assoc res :failure (list (obj :expected name :position input)))
        res))))

; Helps tie the recursive knot.
(def nonterm
  (fn (description f)
    (def p (box false))
    (describe description
              (fn (input)
                (def _ (if (not (unbox p))
                            (set-box! p (f))
                            null))
                ((unbox p) input)))))

(def action
  (fn (parser f)
    (fn (input)
      (def res (parser input))
      (if (get res :position)
        (assoc res :result (f (if (has res :result) (get res :result) null)))
        res))))

(def apply-action (fn (parser f) (action parser (fn (l) (apply f l)))))

(def capture-string
  (fn (parser)
    (fn (input)
      (def res (parser input))
      (if (get res :position)
        (assoc res :result (input-substring input (get res :position)))
        res))))

(def parse-failure
  (fn (failures)
    (def pos (get (get (first failures) :position) :srcpos))
    (def source (get (get (first failures) :position) :source))
    (def msgs (map (fn (f) (get f :expected)) failures))
    (error (string-append "Parse error at " source ":" (number->string (get pos :line)) ":" (number->string (get pos :column)) ". Expected one of")
           (string-append (string-join msgs ", ")))))

(def parse
  (fn (grammar input)
    (def res (grammar input))
    (if (not (get res :position))
      (parse-failure (get res :failure))
      res)))

(def whitespace
  (describe
    "whitespace"
    (one-or-more (describe "whitespace" (or/p (c " ") (c newline))))))

(def digit
 (describe
  "digit"
  (c-range "0" "9")))

(def alpha
  (describe "letter"
            (or/p (c-range "a" "z")
                  (c-range "A" "Z"))))

(def empty-as-list
  (action empty (fn (ignore) (list))))

; These non-terminals are included here because they're used in several readers

(def module-segment (seq alpha (zero-or-more (or/p alpha digit))))
(def module-name (describe "module name" (capture-string (seq module-segment (zero-or-more (seq (c "/") module-segment))))))

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

(def id-string (capture-string (seq idchar (zero-or-more (or/p digit idchar)))))

(def newline/p (c-pred (fn (ch) (=== ch newline)) "newline"))
