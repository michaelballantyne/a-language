#lang a

(require runtime/runtime)
(provide compiled-module)

(def andmap
  (fn (f l)
    (foldl (fn (a b) (and a b)) true
           (map f l))))

(def compiled-module
  (fn (imports exports body-code)
    (if (not (and
                (and
                  (and (list? imports) (andmap string? imports))
                  (and (list? exports) (andmap string? exports)))
                (string? body-code)))
      (error "compiled-module" "malformed module declaration")
      (obj :imports imports
           :exports exports
           :body-code body-code))))
