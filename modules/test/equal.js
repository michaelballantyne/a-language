#lang a

(require runtime/runtime)
(provide main)

(def main
  (fn (args)
    (displayln
      (list
        :should-be-true
        (equal? (obj :a 1)
                (obj :a 1))
        (equal? (obj :a (list 1 2))
                (obj :a (list 1 2)))
        (equal? (obj :a (list 1 2) :b (obj :c 3))
                (obj :b (obj :c 3) :a (list 1 2)))
        :should-be-false
        (equal? (obj :a (list 1 2) :b (obj :c 3))
                (obj :a (list 1 2) :b (obj :c 4)))
        (equal? (obj :a 1)
                (obj :a 2))
        (equal? (obj :a 1)
                (obj :a 1 :b 3))
        ))
    ))
