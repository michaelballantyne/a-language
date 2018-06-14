#lang racket

(require
  (for-syntax
   syntax-generic2
   syntax/stx
   syntax/id-table
   (rename-in syntax/parse [define/syntax-parse def/stx])
   ))

(begin-for-syntax
  (define ((expand-to-error message) stx . rest)
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

  (define-syntax-generic extract-js-expression
    (lambda (stx idmap)
      (syntax-parse stx
        [x:id (extract-id #'x idmap)]
        [n:number
         (hasheq
          'type "Literal"
          'value (syntax->datum #'n))]
        [_
         (raise-syntax-error 'extract-js "form does not support compilation to JS" stx)])))

  (define-syntax-generic extract-js-statement
    (lambda (stx idmap)
      (let ([res (extract-js-expression stx idmap)])
        (hasheq
         'type "ExpressionStatement"
         'expression res))))

  (define js-var
    (generics
     [js-reference (lambda (stx) stx)]
     [js-variable (lambda (stx) stx)]
     ; TODO: I wanted to write this, but I can't! The binding to js-var is not
     ;   preserved after the initial expansion.
     #;[extract-js-expression
        (lambda (stx idmap)
          (extract-id #'x idmap))]))
  
  ; TODO: I probably need to get the expander into a (Racket) expression context
  ;   at this point so that use-site scopes added to this point aren't deleted
  ;   upon syntax-local-identifier-as-binder within. Probably means a local-expand
  ;   with `#%expression`. Or does local-expand with 'expression do the trick?
  (define (js-expand-expression stx ctx)
    (syntax-parse stx
      [_ #:when (js-transformer? stx)
         (js-expand-expression (apply-as-transformer js-transformer ctx stx))]
      [_ #:when (js-core-expression? stx)
         (apply-as-transformer js-core-expression ctx stx)]
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
         (js-expand-statement-pass1 (apply-as-transformer js-transformer ctx stx) ctx)]
      [_ #:when (js-core-statement-pass1? stx)
         (apply-as-transformer js-core-statement-pass1 ctx stx ctx)]
      ; Assume it's an expression; we'll expand those in pass 2.
      [_ stx]))

  (define (js-expand-statement-pass2 stx ctx)
    (syntax-parse stx
      [_ #:when (js-core-statement-pass2? stx)
         (apply-as-transformer js-core-statement-pass2 ctx stx)]
      [_ (js-expand-expression stx ctx)]))

  (define (expand-block body ctx)
    (define body^
      (for/list ([b (syntax->list ((make-syntax-introducer #f) body))])
        (js-expand-statement-pass1 b ctx)))
    (for/list ([b body^])
      (js-expand-statement-pass2 b ctx)))

  (define (skip-pass1 stx ctx) stx)

  (struct idmap (table [ctr #:mutable]))
  (define (make-idmap)
    (idmap (make-free-id-table) 0))
  
  (define (extract-id id map)
    (define name
      (let ([v (free-id-table-ref! (idmap-table map) id (lambda () #f))])
        (or v
            (let ([v (string-append (symbol->string (syntax->datum id))
                                    (number->string (idmap-ctr map)))])
              (free-id-table-set! (idmap-table map) id v)
              (set-idmap-ctr! map (+ (idmap-ctr map) 1))
              v))))
    (hasheq 'type "Identifier" 'name name))

  (define (extract-block body idmap)
    (hasheq
     'type "BlockStatement"
     'body (stx-map (λ (b) (extract-js-statement b idmap))
                    body)))
  )

(define-syntax js-exp-expanded
  (syntax-parser
    [(_ arg)
     (def/stx expanded-js (js-expand-expression #'arg #f))
     #'#'expanded-js]))

(define-syntax js-exp-extracted
  (syntax-parser
    [(_ arg)
     (def/stx expanded-js (extract-js-expression (js-expand-expression #'arg #f) (make-idmap)))
     #'(pretty-print 'expanded-js)]))

(define-syntax #%js-app
  (generics
   [js-core-expression
    (syntax-parser
      [(app-id e e* ...)
       (def/stx (e^ e*^ ...)
         (stx-map (lambda (stx) (js-expand-expression stx #f)) #'(e e* ...)))
       #'(app-id e^ e*^ ...)])]
   [extract-js-expression
    (lambda (stx idmap)
      (syntax-parse stx
        [(_ e e* ...)
         (hasheq
          'type "CallExpression"
          'callee (extract-js-expression #'e idmap)
          'arguments (stx-map (λ (e) (extract-js-expression e idmap)) #'(e* ...)))]))]))

(define-syntax function
  (generics
   [js-core-expression
    (syntax-parser
      [(function-id (x ...) body ...)
       (define ctx (syntax-local-make-definition-context))
       (for ([x (syntax->list #'(x ...))])
         (syntax-local-bind-syntaxes (list x) #`#,js-var ctx))
       (def/stx (x^ ...) (internal-definition-context-introduce ctx #'(x ...)))
       (def/stx (body^ ...)
         (expand-block #'(body ...) ctx))   
       #'(function-id (x^ ...) body^ ...)])]
   [extract-js-expression
    (lambda (stx idmap)
      (syntax-parse stx
        [(_ (x ...) body ...)
         (hasheq
          'type "FunctionExpression"
          'params (stx-map (λ (x) (extract-id x idmap))
                           #'(x ...))
          'body (extract-block #'(body ...) idmap))]))]))

(define-syntax let
  (generics
   [js-core-statement-pass1
    (lambda (stx ctx)
      (syntax-parse stx
        [(var-id x e)
         (syntax-local-bind-syntaxes (list #'x) #`#,js-var ctx)
         (def/stx x^ (internal-definition-context-introduce ctx #'x))
         #'(var-id x^ e)]))]
   [js-core-statement-pass2
    (syntax-parser
      [(var-id x e)
       (def/stx e^ (js-expand-expression #'e #f))
       #'(var-id x e^)])]
   [extract-js-statement
    (lambda (stx idmap)
      (syntax-parse stx
        [(_ x e)
         (hasheq
          'type "VariableDeclaration"
          'kind "let"
          'declarations
          (list (hasheq
                 'type "VariableDeclarator"
                 'id (extract-id #'x idmap)
                 'init (extract-js-expression #'e idmap))))]))]))

(define-syntax return
  (generics
   [js-core-statement-pass1 skip-pass1]
   [js-core-statement-pass2
    (syntax-parser
      [(return-id e)
       (def/stx e^ (js-expand-expression #'e #f))
       #'(return-id e^)])]
   [extract-js-statement
    (lambda (stx idmap)
      (syntax-parse stx
        [(_ e)
         (hasheq
          'type "ReturnStatement"
          'argument (extract-js-expression #'e idmap))]))]))

(define-syntax set!
  (generics
   [js-core-statement-pass1 skip-pass1]
   [js-core-statement-pass2
    (syntax-parser
      [(set!-id var:id e)
       #:fail-unless (js-variable? #'var) (format "expected variable")
       (def/stx e^ (js-expand-expression #'e #f))
       #'(set!-id var e^)])]
   [extract-js-expression
    (lambda (stx idmap)
      (syntax-parse stx
        [(_ var:id e)
         (hasheq
          'type "AssignmentExpression"
          'operator "="
          'left (extract-id #'var idmap)
          'right (extract-js-expression #'e idmap))]))]))

(define-syntax while
  (generics
   [js-core-statement-pass1 skip-pass1]
   [js-core-statement-pass2
    (syntax-parser
      [(while-id condition body ...)
       (define ctx (syntax-local-make-definition-context))
       (def/stx condition^ (js-expand-expression #'condition #f))
       (def/stx (body^ ...) (expand-block #'(body ...) ctx))
       #'(while-id condition^ body^ ...)])]
   [extract-js-statement
    (lambda (stx idmap)
      (syntax-parse stx
        [(_ condition body ...)
         (hasheq
          'type "WhileStatement"
          'test (extract-js-expression #'condition idmap)
          'body (extract-block #'(body ...) idmap))]))]))

(define-syntax if
  (generics
   [js-core-statement-pass1 skip-pass1]
   [js-core-statement-pass2
    (syntax-parser
      [(if-id c (b1 ...) (b2 ...))
       (def/stx c^ (js-expand-expression #'c #f))
      
       (define ctx1 (syntax-local-make-definition-context))
       (def/stx (b1^ ...) (expand-block #'(b1 ...) ctx1))

       (define ctx2 (syntax-local-make-definition-context))
       (def/stx (b2^ ...) (expand-block #'(b2 ...) ctx2))

       #'(if-id c^ (b1^ ...) (b2^ ...))])]))

(define-syntax ?
  (generics
   [js-core-expression
    (syntax-parser
      [(if-id c e1 e2)
       (def/stx c^ (js-expand-expression #'c #f))
       (def/stx e1^ (js-expand-expression #'e1 #f))
       (def/stx e2^ (js-expand-expression #'e2 #f))
       #'(if-id c^ e1^ e2^)])]))

(module+ test
  (pretty-print
   (syntax->datum
    (js-exp-expanded (function (+ <= *)
                               (let fact
                                 (function (n)
                                           (let x 2)
                                           (let res 1)
                                           (if (? x x res)
                                               ((let x 1)
                                                (return (x x)))
                                               ())
                                           (while (<= x n)
                                                  (let y 5)
                                                  (set! res (* res x))
                                                  (set! x (+ x 1)))
                                           (return res)))
                               (return fact)
                               ))))

  #;(js-exp-extracted (function (+ <= *)
                                (let x 2)
                                (+ +)
                                ))
  #;(js-exp-extracted (function (+ <= *)
                                (let fact
                                  (function (n)
                                            (let x 2)
                                            (let res 1)
                                            (while (<= x n)
                                                   (set! res (* res x))
                                                   (set! x (+ x 1)))
                                            (return res)))
                                (return fact)
                                )))
