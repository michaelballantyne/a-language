#lang a

(require runtime/runtime compile/lang)
(provide make-runner)

(def make-runner
  (fn (platform)
    (def declaration-cache (box (hash)))

    (def load
      (fn (module-name)
        (if (has (unbox declaration-cache) module-name)
          (get (unbox declaration-cache) module-name)
          (block
            (def source ((get platform :resolve) module-name))
            (def module-declaration (compile-via-lang source (obj :load load :run run)))
            (def module-declaration2
              (assoc module-declaration
                     :body-function
                     ((get platform :eval-module)
                      (get module-declaration :body-code))))
            ; TODO: clean up with expression in def ctx
            (def _ (set-box! declaration-cache
                             (assoc (unbox declaration-cache)
                                    module-name module-declaration2)))
            module-declaration2))))

    ; TODO: should be in a standard library somewhere
    (def andmap
      (fn (f l)
        (foldl (fn (a b) (and a b)) true
               (map f l))))

    (def run
      (fn (module-name)
        (def _ (string/c "run" module-name))
        (def run-module-internal
          (fn (instance-map module-name)
            (if (has instance-map module-name)
              instance-map
              (block
                (def module-declaration (load module-name))
                (def instance-map2
                  (foldl run-module-internal instance-map
                         (array->list (get module-declaration :imports))))
                (def instance (apply (get module-declaration :body-function)
                                     (map (fn (i) (get instance-map2 i))
                                          (array->list (get module-declaration :imports)))))
                ; TODO: clean up with expression in def ctx and when
                (def _ (if (not (andmap (fn (export) (has instance export))
                                        (array->list (get module-declaration :exports))))
                         (error "run"
                                (string-append
                                  "Module instance does not include all keys listed in exports: "
                                  module-name))
                         null))
                (assoc instance-map2 module-name instance)))))
        (get (run-module-internal (hash) module-name) module-name)))

    (obj :load load :run run)))
