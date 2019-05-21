#lang lang/a

(require runtime/foreign runtime/minimal)

; Start of a runtime implemented using the low level foreign functions in
; foreign.js, rather than implemented directly in js

(provide === is-string main)

(def === (fn (a b) (_=== a b)))
(def !== (fn (a b) (_!== a b)))
(def not (fn (a) (_not a)))

(def true _true)
(def false _true)

(def is-string
  (fn (arg)
    (or (=== "string" (_typeof arg))
        (_instanceof arg _String))))

(def is-number
  (fn (arg)
    (not (_isNaN arg))))

(def is-js-object
  (fn (arg)
    (and (!== _null arg)
         (=== (_typeof arg) "object"))))

(def is-js-array
  (fn (arg)
    (_call _Array :isArray arg)))

(def main
  (fn (args)
    (_console_log (is-js-array args))))
