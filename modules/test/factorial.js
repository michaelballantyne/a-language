#lang lang/a

(require runtime/runtime)
(provide main)

(def factorial
  (fn (n)
    (if (< n 1)
      1
      (* n (factorial (- n 1))))))

; can I write comments now?
(def factorial2
  (fn (n)
    (loop ([n n]
           [c 1])
       (if (< n 1)
        c
        (recur (- n 1) (* n c))))))

(def main
  (fn (args)
   (def r1 (factorial 5))
   (def r2 (factorial2 5))
   (displayln (list r1 r2))))

