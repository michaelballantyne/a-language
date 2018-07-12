#lang lang/a

(require runtime/runtime)
(provide main)

; Need to add:
;   ===
;   string-append
;   not
;   first
;   rest
;   append

;   generic get, has, empty? Or do I want to use list-ref, hash-ref, obj-ref, etc?
;   Would still be interfaces, but more specific.
;   These are variadic, but defined in JS so don't need to add to compiler:
;     has
;     get
;     obj
;     list
;     hash
;     put


;   Best as macros, but I might want to hack into the parser for now:
;     cond
;     defn

;   variadic functions. I like the idea of ... syntax for defn.

;   format

; Maybe kill #lang loading for now and just special case, to make bootstrap simple

; So far I don't *really* need special paren, brace, and bracket syntax.
; I could drop that for now, in the spirit of minimalism. Parsing it is a pain.

(def c-pred
  (fn (pred description)
    (fn (input index)
      (if (and (has input index) (pred (get input index)))
        (hash :position (+ index 1) :failure (list))
        (hash :position false :failure (list (hash :expected description :position index)))))))

(def c
  (fn (to-match)
    (c-pred (fn (ch) (=== ch to-match))
            (string-append "character " to-match))))

(def c-not
  (fn (to-match)
    (c-pred (fn (ch) (not (has to-match ch)))
            (string-append "not " to-match))))

(def c-range
  (fn (lower upper)
    (c-pred (fn (ch) (and (>= ch lower) (<= ch upper)))
            (string-append "range " (number->string lower) " to " (number->string upper)))))

(def empty (fn (input index) (hash :position index :failure (list))))



;(defn (merge-failures l r)
  ;(cond
    ;[(empty? l) r]
    ;[(empty? r) l]
    ;[(> (get (first r) :position) (get (first l) :position)) r]
    ;[(> (get (first l) :position) (get (first r) :position)) r]
    ;[:else (append l r)]))

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
                     (if (has res :result) (cons res results) results)
                     (merge-failures failures (get res :failure))))
            (hash :position current-index
                  :result (if (= (size results) 1) (first results) results)
                  :failure failures)))))))

(def main
  (fn (args)

    (list
      (displayln ((seq (c "a") (c "b")) (list "a" "b" "c") 0))
      (displayln ((seq (c "a") (c "b")) (list "a" "b" "c") 1))
    )

    ))

