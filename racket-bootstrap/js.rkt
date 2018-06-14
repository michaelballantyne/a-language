#lang racket

(require
  (for-syntax
   syntax-generic2
   syntax/parse))

(begin-for-syntax
  (define ((expand-to-error message) stx)
    (raise-syntax-error #f message stx))
  
  (define-syntax-generic js-core-expression
    (expand-to-error "not a js core expression"))

  (define-syntax-generic js-core-statement-pass1
    (expand-to-error "not a js core statement"))

  (define-syntax-generic js-core-statement-pass2
    (expand-to-error "not a js core statement"))

  (define-syntax-generic js-reference
    (expand-to-error "not a js reference"))
  
  (define-syntax-generic js-variable
    (expand-to-error "not a js variable"))

  (define-syntax-generic js-transformer
    (expand-to-error "not a js form"))

  (define js-var
    (generics
     [js-reference (lambda (stx) stx)]
     [js-variable (lambda (stx) stx)]))
  
  ; TODO: I probably need to get the expander into a (Racket) expression context
  ;   at this point so that use-site scopes added to this point aren't deleted
  ;   upon syntax-local-identifier-as-binder within. Probably means a local-expand
  ;   with `#%expression`.
  (define (js-expand-expression stx ctx)
    (syntax-parse stx
      [_ #:when (js-transformer? stx)
         (js-expand-expression (call-with-expand-context js-transformer ctx stx))]
      [_ #:when (js-core-expression? stx)
         (call-with-expand-context js-core-expression ctx stx)]
      [_ #:when (js-core-statement-pass1? stx)
         (raise-syntax-error #f "js statement not valid in js expression position" stx)]
      [x:id #:when (js-reference? stx)
            stx]
      [n:number stx]
      [(e ...)
       (with-syntax ([app (datum->syntax stx '#%js-app)])
         (js-expand-expression #'(app e ...) ctx))]
      [else (raise-syntax-error #f "not a js expression" stx)]))

  (define (js-expand-statement-pass1 stx ctx)
    (syntax-parse stx
      [_ #:when (js-transformer? stx)
         (js-expand-statement-pass1 (call-with-expand-context js-transformer ctx stx) ctx)]
      [_ #:when (js-core-statement-pass1? stx)
         (call-with-expand-context js-core-statement-pass1 ctx stx ctx)]
      ; Assume it's an expression; we'll expand those in pass 2.
      [_ stx]))

  (define (js-expand-statement-pass2 stx ctx)
    (syntax-parse stx
      [_ #:when (js-core-statement-pass2? stx)
         (call-with-expand-context js-core-statement-pass2 ctx stx)]
      [_ (js-expand-expression stx ctx)]))

  (define (expand-block body ctx)
    (define body^
      (for/list ([b (syntax->list ((make-syntax-introducer #f) body))])
        (js-expand-statement-pass1 b ctx)))
    (for/list ([b body^])
      (js-expand-statement-pass2 b ctx)))
  )

(define-syntax js-exp
  (syntax-parser
    [(_ arg)
     #`#'#,(js-expand-expression #'arg #f)]))

(define-syntax #%js-app
  (generics
   [js-core-expression
    (syntax-parser
      [(app-id e e* ...)
       (define/syntax-parse (e^ e*^ ...)
         (map (lambda (stx) (js-expand-expression stx #f))
              (syntax->list #'(e e* ...))))
       #`(app-id e^ e*^ ...)])]))

(define-syntax function
  (generics
   [js-core-expression
    (syntax-parser
      [(function-id (x ...) body ...)
       (define ctx (syntax-local-make-definition-context))
       (for ([x (syntax->list #'(x ...))])
         (syntax-local-bind-syntaxes (list x) #`#,js-var ctx))
       (define/syntax-parse (x^ ...) (internal-definition-context-introduce ctx #'(x ...)))
       ; expand body in a new scope, so function arguments may be shadowed.
       (define/syntax-parse (body^ ...)
         (expand-block #'(body ...) ctx))   
       #'(function-id (x^ ...) body^ ...)])]))

(define-syntax let
  (generics
   [js-core-statement-pass1
    (lambda (stx ctx)
      (syntax-parse stx
        [(var-id x e)
         (syntax-local-bind-syntaxes (list #'x) #`#,js-var ctx)
         (define/syntax-parse x^ (internal-definition-context-introduce ctx #'x))
         #'(var-id x^ e)]))]
   [js-core-statement-pass2
    (syntax-parser
      [(var-id x e)
       (define/syntax-parse e^ (js-expand-expression #'e #f))
       #'(var-id x e^)])]))

(define-syntax return
  (generics
   [js-core-statement-pass1
    (lambda (stx ctx) stx)]
   [js-core-statement-pass2
    (syntax-parser
      [(return-id e)
       (define/syntax-parse e^ (js-expand-expression #'e #f))
       #'(return-id e^)])]))

(define-syntax set!
  (generics
   [js-core-statement-pass1
    (lambda (stx ctx) stx)]
   [js-core-statement-pass2
    (lambda (stx)
      (syntax-parse stx
        [(set!-id var:id e)
         #:fail-unless (js-variable? #'var)
         (format "expected variable")
         (define/syntax-parse e^ (js-expand-expression #'e #f))
         #'(set!-id var e^)]))]))

(define-syntax while
  (generics
   [js-core-statement-pass1
    (lambda (stx ctx) stx)]
   [js-core-statement-pass2
    (syntax-parser
      [(while-id condition body ...)
       (define ctx (syntax-local-make-definition-context))
       (define/syntax-parse condition^ (js-expand-expression #'condition ctx))
       (define/syntax-parse (body^ ...) (expand-block #'(body ...) ctx))
       #'(while-id condition^ body^ ...)])]))

(module+ test
  (pretty-print
   (syntax->datum
    (js-exp (function (+ <= *)
                      (let fact
                        (function (n)
                                  (let x 2)
                                  (let res 1)
                                  (while (<= x n)
                                         (set! res (* res x))
                                         (set! x (+ x 1)))
                                  (return res)))
                      (return fact)
                      )))))

#|






|#
