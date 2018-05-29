#lang racket

(define (get-exports module-path)
  (string-split
   (with-output-to-string
     (lambda ()
       (parameterize ([current-directory "/Users/michaelballantyne/a-language"])
         (system* "/usr/local/bin/node"
                  "/Users/michaelballantyne/a-language/run.js"
                  "node/printexports"
                  "main"
                  module-path
                  #:set-pwd? #t))))))

(get-exports "node/cli")