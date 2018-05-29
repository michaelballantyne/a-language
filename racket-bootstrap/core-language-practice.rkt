#lang racket

(require
  fake-core-forms
  syntax-generic
  (for-syntax
   syntax/parse
   racket/pretty))

(define-core-language js)

(begin-for-syntax
  (define (js-core-form f)
    (cf-transformer #'js f))

  (define (js-expand stx ctx)
    (cf-local-expand stx #'js ctx)))

(begin-for-syntax
  (define-syntax-generic extract-js
    #:fallback
    (lambda (e ctx)
      (syntax-parse e
        [x:id #'x]
        [_ (raise-syntax-error #f "missing implementation of extract-js for" e)]))))

(begin-for-syntax
  (define (in-stmt? ctx)
    (number? ctx))

  (define (in-expr? ctx)
    (eq? ctx 'expr))

  (define (in-expr ctx)
    'expr)

  (define (in-stmt arg-cnt ctx)
    arg-cnt)

  (define (recur-cnt ctx)
    (when (not (in-stmt? ctx))
      (error 'recur-cnt "only valid on stmt context"))
    ctx))



(begin-for-syntax
  (define (compile-expr e ctx)
    (define (maybe-return expr)
      (if (in-stmt? ctx)
          #`(return #,expr)
          expr))
    (syntax-parse e
      #:datum-literals (app if loop fn recur)
      [_:boolean (maybe-return #'e)]
      [_:integer (maybe-return #'e)]
      [_:id (maybe-return #'e)]
      [(app f arg ...)
       #:with (f^ arg^ ...)
       (for/list ([a (syntax->list #'(f arg ...))])
         (compile-expr a (in-expr ctx)))
       (maybe-return #'(app f^ arg^ ...))]
      [(if c t e)
       #:when (in-expr? ctx)
       #:with c^ (compile-expr #'c ctx)
       #:with t^ (compile-expr #'t ctx)
       #:with e^ (compile-expr #'e ctx)
       #'(? c^ t^ e^)]
      [(if c t e)
       #:when (in-stmt? ctx)
       #:with c^ (compile-expr #'c (in-expr ctx))
       #:with t^ (compile-expr #'t ctx)
       #:with e^ (compile-expr #'e ctx)
       #'(if (c^)
             t^
             e^)]
      [(loop ([x init] ...) body)
       #:with (init^ ...)
       (for/list ([i (syntax->list #'(init ...))])
         (compile-expr i (in-expr ctx)))
       #:with body^ (compile-expr #'body (in-stmt (length (syntax->list #'(x ...))) ctx))
       (maybe-return
        #'(app
           (function ()
                     (var x init^) ...
                     (while true
                            body^))))]
      [(fn (x ...) body)
       #:with tmp (generate-temporaries #'(x ...))
       #:with body^ (compile-expr #'body (length (syntax->list #'(x ...))))
       `(function (tmp ...)
                  (var x tmp) ...
                  (while true
                         body^))]
      [(recur e ...)
       #:fail-unless (in-stmt? ctx)
       "recur only valid in tail position"
       #:fail-unless (= (length (syntax->list #'(e ...))) (recur-cnt ctx))
       "recur argument count does not match receiver"
       #'(begin
           (= x e)
           ...)]))

  (define (test e)
    (pretty-write (syntax->datum (compile-expr e 'expr))))
    

  (test #'(if (if #t #t #f) #t #f))
  (test #'(loop ([v 0]) (if (app = v 5) #t (recur (app + v 1))))))