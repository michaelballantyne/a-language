#lang lang/a

(require runtime/runtime)
(provide main)

(def main
  (fn (args)
    (def b (box 5))
    (def _ (set-box! b 6))
    (displayln (unbox b))
  ))
