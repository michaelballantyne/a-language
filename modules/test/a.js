#lang lang/a

(require vendor/immutable test/id)
(provide main true)

(def x 5)

(def main
     (make-print (if false
                   1
                   (if 1
                     (plus 3 (id x))
                     2))))

(def true 5)
