#lang lang/a

(require vendor/immutable test/id)
(provide main true)

(def x 5)


(def factorial
  (fn (n)
    (if (lessthan n 1)
      1
      (mult n (factorial (minus n 1))))))

(def factorial2
  (fn (n)
    (loop ([n n]
           [c 1])
       (if (lessthan n 1)
        c
        (recur (minus n 1) (mult n c))))))

(def main
    (make-print
       (factorial2 5)))

(def main2
     (make-print (if false
                   1
                   (if 1
                     (plus 3 (id x))
                     2))))

(def main3
    (fn (x)
     (def y (block
              (def z 5)
              z))
     (loop ([x 1] [y 7])
       (recur 5 9))))

(def true 5)


