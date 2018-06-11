#lang racket

(require
  (for-syntax
   syntax-generic2))

(begin-for-syntax
  (define-syntax-generic js-core-expression
    (lambda (stx)
      stx))

  (define-syntax-generic js-core-statement-pass1
    (lambda (stx ctx)
      stx))

  (define-syntax-generic js-core-statement-pass2
    (lambda (stx ctx)
      stx))

  (define-syntax-generic js-transformer
    (lambda (stx)
      stx))

  (define (js-expand-expression stx)
    (cond
      [(js-transformer? stx) (js-expand-expression (call-with-expand-context js-transformer stx))]
      [(js-core-expression? stx) (call-with-expand-context js-core-expression stx)]
      [else (raise-syntax-error #f "not a js expression" stx)]))
  )


(define-syntax #%app
  (generics
   [js-core-expression
    (lambda (stx)
      stx
      )]))

(define-syntax function
  (generics
   [js-core-expression
    (lambda (stx)
      stx
      )]))

(define-syntax block
  (generics
   [js-core-expression
    (lambda (stx)
      stx
      )]))

(define-syntax set!
  (generics
   [js-core-statement-pass1
    (lambda (stx ctx)
      stx
      )]
   [js-core-statement-pass2
    (lambda (stx ctx)
      stx
      )]))

(define-syntax var
  (generics
   [js-core-statement-pass1
    (lambda (stx ctx)
      stx
      )]
   [js-core-statement-pass2
    (lambda (stx ctx)
      stx
      )]))

(define-syntax val
  (generics
   [js-core-statement-pass1
    (lambda (stx ctx)
      stx
      )]
   [js-core-statement-pass2
    (lambda (stx ctx)
      stx
      )]))



(define-syntax while
  (generics
   [js-core-statement-pass1
    (lambda (stx ctx)
      stx
      )]
   [js-core-statement-pass2
    (lambda (stx ctx)
      stx
      )]))

