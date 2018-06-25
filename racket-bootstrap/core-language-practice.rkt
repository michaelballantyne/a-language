#lang racket

; TODO: doesn't support blocks yet. I like blocks! And I'm not sure I want to do the
; Racket thing of implementing them in the expander instead of the core, especially
; because the target is JS, which supports blocks natively.

; Blocks would mean the source would also have expression and statement positions,
; but the only kind of statement would be a def. No if or while statements; if and
; loop are expressions. If bodies would need an explicit block. I could use curlies
; for block syntax, though I might want it for hashes instead? But that's in the parser.
; Here I could just have only a "block" form for explicit blocks. Oh. But that'd make
; extra IIFE's that I don't need.

; So, loop and fn bodies are blocks? Plus an explicit block form for other uses?
; Huh. Will "let" or blocks get in the way of my recur targets? Maybe not if I
; don't need break or continue, and just rely on return to break out of while true.

; I could require an explicit loop and not allow fns as recur targets. Would bloat
; the target code a little when I have a fn that could both be a call and a recur
; target.

; block with defs then one expression... But if I want side effects? Then would be
; fine to interleave.

; def vs let vs val vs var?
; Start pure, except for boxes.
; (def x (box 0))
; (set-box! x 2)
; isn't too bad.

; I kind of like let. Also is JSy.

(require syntax/parse)

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
  ctx)

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
    [(loop ([x init] ...) body ...)
     #:with (init^ ...)
     (for/list ([i (syntax->list #'(init ...))])
       (compile-expr i (in-expr ctx)))
     #:with body^ (compile-block #'(body ...) (in-stmt (length (syntax->list #'(x ...))) ctx))
     (maybe-return
      #'(app
         (function ()
                   (var x init^) ...
                   (while true
                          body^))))]
    [(fn (x ...) body ...)
     #:with tmp (generate-temporaries #'(x ...))
     #:with body^ (compile-block #'(body ...) (length (syntax->list #'(x ...))))
     (maybe-return
      `(function (tmp ...)
                 (var x tmp) ...
                 (while true
                        body^)))]
    [(block body ...)
     #:fail-unless (in-expr? ctx)
     "explicit block form only supported in expression position"
     ]
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
(test #'(loop ([v 0]) (if (app = v 5) #t (recur (app + v 1)))))

#;(loop ([v 0])
        (def x (block
                (def y 6)))
        (recur x))