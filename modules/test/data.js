#lang lang/a

(require runtime/runtime)
(provide main)

(def main
  (fn (args)
    (displayln (list
                 (has (list :a 5 :b 6) 0)
                 (has (obj :a 5 :b 6) :a)
                 (has (hash :a 5 :b 6) :a)
                 (get (list :a 5 :b 6) 0)
                 (get (obj :a 5 :b 6) :a)
                 (get (hash :a 5 :b 6) :a)
                 (assoc (hash) :a 5)
                 (assoc (obj) :a 5)
                 ;(assoc (list) 0 5)
                 ;(append (list 1 2) (list 3 4))
                 (assoc (obj :a 5) :b (list 1))
                 ))))
