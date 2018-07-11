#lang lang/a

(require runtime/runtime)
(provide main)

(def main
  (fn (args)
    (displayln (list :a 5 :b 6))))
