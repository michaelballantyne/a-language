#lang a

(require runtime/runtime vendor/escodegen compile/module)
(provide compile-module)


(def exp-ctx (obj :ctx-type :exp))
(def stmt-ctx (fn (recur-vars) (obj :ctx-type :stmt :recur-vars recur-vars)))
(def non-recur-stmt-ctx (obj :ctx-type :stmt))

(def exp-ctx? (fn (ctx) (equal? :exp (get ctx :ctx-type))))
(def stmt-ctx? (fn (ctx) (equal? :stmt (get ctx :ctx-type))))
(def recur-ctx? (fn (ctx) (has ctx :recur-vars)))
(def recur-ctx-vars (fn (ctx) (get ctx :recur-vars)))

(def gen-literal
  (fn (value)
    (obj :type "Literal"
         :value value)))

(def gen-identifier
  (fn (str)
    (def _ (string/c "gen-identifier" str))
    (obj :type "Identifier"
         :name str)))

(def gen-binding
  (fn (lhs rhs kind)
    (obj :type "VariableDeclaration"
         :kind kind
         :declarations
         (array
           (obj :type "VariableDeclarator"
                :id (gen-identifier lhs)
                :init rhs)))))

(def gen-const-field-access
  (fn (o name)
    (obj :type "MemberExpression"
         :object o
         :property (gen-literal name)
         :computed true)))

(def gen-iife
  (fn (body)
    (obj :type "CallExpression"
         :arguments (array)
         :callee (obj :type "FunctionExpression"
                      :params (array)
                      :body body))))

(def gen-assignment-stmt
  (fn (lhs rhs)
    (obj :type "ExpressionStatement"
         :expression
         (obj :type "AssignmentExpression"
              :operator "="
              :left (gen-identifier lhs)
              :right rhs))))

(def compile-def
  (fn (d)
    (gen-binding (get d :id)
                 (compile-expression (get d :rhs) exp-ctx)
                 :const)))

(def compile-expression
  (fn (e ctx)
    (def maybe-return
      (fn (e)
        (if (stmt-ctx? ctx)
          (obj :type "ReturnStatement"
               :argument e)
          e)))

    (def compile-literal
      (fn ()
        (maybe-return (gen-literal (get e :literal)))))

    (def compile-local-ref
      (fn ()
        (maybe-return (gen-identifier (get e :local-ref)))))

    (def compile-module-ref
      (fn ()
        (maybe-return
          (gen-const-field-access (gen-identifier (get e :module-ref-sym))
                                  (get e :module-ref-field)))))

    (def compile-app
      (fn ()
        (def compiled-exps (map (fn (e) (compile-expression e exp-ctx)) (get e :app-exps)))
        (maybe-return
          (obj :type "CallExpression"
               :callee (first compiled-exps)
               :arguments (list->array (rest compiled-exps))))))

    (def build-condition
      (fn (if-c)
        (obj :type "BinaryExpression"
             :operator "!=="
             :left (gen-literal false)
             :right if-c)))

    (def compile-if-exp
      (fn ()
        (maybe-return
          (obj :type "ConditionalExpression"
               :test (build-condition (compile-expression (get e :if-c) ctx))
               :consequent (compile-expression (get e :if-t) ctx)
               :alternate (compile-expression (get e :if-e) ctx)))))

    (def compile-if-stmt
      (fn ()
        (obj :type "IfStatement"
             :test (build-condition (compile-expression (get e :if-c) exp-ctx))
             :consequent (compile-expression (get e :if-t) ctx)
             :alternate (compile-expression (get e :if-e) ctx))))

    (def compile-block
      (fn (block ctx)
        (def decls (map compile-def (get block :block-defs)))
        (def ret (compile-expression (get block :block-ret) ctx))
        (obj :type "BlockStatement"
             :body (list->array (append decls (list ret))))))


    (def build-loop-body
      (fn (vars inits body ctx)
        (def decls (zip (fn (var init)
                          (gen-binding var
                                       (compile-expression init exp-ctx)
                                       :var))
                        vars inits))
        (def body-loop
          (obj :type "WhileStatement"
               :test (gen-literal true)
               :body (compile-block body (stmt-ctx vars))))
        (obj :type "BlockStatement"
             :body (list->array (append decls (list body-loop))))))

    (def build-arity-check
      (fn (name count)
        (obj :type "IfStatement"
             :test (obj :type "BinaryExpression"
                        :operator "!=="
                        :left (gen-literal count)
                        :right (gen-const-field-access (gen-identifier "arguments") "length"))
             :consequent
             (obj :type "ExpressionStatement"
                  :expression
                  (obj :type "CallExpression"
                       :callee (gen-const-field-access (gen-identifier "$runtime") "raise-arity-error")
                       :arguments
                       (array
                         (gen-literal name)
                         (gen-literal count)
                         (gen-const-field-access (gen-identifier "arguments") "length"))))
             :alternate null)))

    (def compile-fn
      (fn ()
        (def temps-as-refs (map (fn (t) (obj :local-ref t)) (get e :fn-temps)))
        (maybe-return
          (obj :type "FunctionExpression"
               :params (list->array (map gen-identifier (get e :fn-temps)))
               :body (obj :type "BlockStatement"
                          :body (array (build-arity-check "anonymous procedure" (size (get e :fn-args)))
                                       (build-loop-body (get e :fn-args) temps-as-refs e ctx)))))))

    (def compile-loop-exp
      (fn ()
        (maybe-return
          (gen-iife (build-loop-body (get e :loop-vars) (get e :loop-inits) e ctx)))))

    (def compile-loop-stmt
      (fn ()
        (build-loop-body (get e :loop-vars) (get e :loop-inits) e ctx)))

    (def compile-block-exp
      (fn ()
        (maybe-return
          (gen-iife (compile-block e non-recur-stmt-ctx)))))

    (def compile-block-stmt
      (fn ()
        (compile-block e ctx)))

    (def compile-recur
      (fn ()
        (def _1 (if (not (recur-ctx? ctx))
                  (error "compile" "recur not in tail position")
                  null))
        (def _2 (if (not (= (size (recur-ctx-vars ctx)) (size (get e :recur-exps))))
                  (error "wrong number of arguments to recur")
                  null))
        (def compiled-expressions
          (map (fn (e) (compile-expression e exp-ctx))
               (get e :recur-exps)))
        (def tmp-assigns
          (zip gen-assignment-stmt
               (get e :recur-temps) compiled-expressions))
        (def loop-var-assigns
          (zip (fn (loop-var tmp-var)
                 (gen-assignment-stmt
                   loop-var
                   (compile-expression (obj :local-ref tmp-var) exp-ctx)))
               (recur-ctx-vars ctx) (get e :recur-temps)))
        (obj :type "BlockStatement"
             :body (list->array (append tmp-assigns loop-var-assigns)))))

    (if (has e :literal) (compile-literal)
      (if (has e :local-ref) (compile-local-ref)
        (if (has e :module-ref-sym) (compile-module-ref)
          (if (has e :app-exps) (compile-app)
            (if (and (has e :if-c) (exp-ctx? ctx)) (compile-if-exp)
              (if (and (has e :if-c) (stmt-ctx? ctx)) (compile-if-stmt)
                (if (has e :fn-args) (compile-fn)
                  (if (and (has e :loop-vars) (exp-ctx? ctx)) (compile-loop-exp)
                    (if (and (has e :loop-vars) (stmt-ctx? ctx)) (compile-loop-stmt)
                      (if (and (has e :block-exp) (exp-ctx? ctx)) (compile-block-exp)
                        (if (and (has e :block-exp) (stmt-ctx? ctx)) (compile-block-stmt)
                          (if (has e :recur-exps) (compile-recur)
                            (error "compile" (string-append "unhandled expression " (to-string e)))))))))))))))))


(def compile-module
  (fn (stree)
    (def compiled-defs (map compile-def (get stree :block-defs)))
    (def compiled-return
      (obj :type "ReturnStatement"
           :argument
           (obj :type "ObjectExpression"
                :properties
                (list->array
                  (zip (fn (internal external)
                         (obj :type "Property"
                              :key (gen-literal external)
                              :value (gen-identifier internal)))
                       (get stree :module-provide-internal-ids)
                       (get stree :module-provides))))))

    (def require-internal-ids (cons "$runtime" (get stree :module-require-internal-ids)))
    (def estree
      (obj :type "FunctionExpression"
           :params (list->array (map gen-identifier require-internal-ids))
           :body (obj :type "BlockStatement"
                      :body (list->array (append compiled-defs (list compiled-return))))))

    (def compiled-body (generate estree))
    (def paren-wrapped (string-append "(" compiled-body ")"))

    (def module-requires (cons "runtime/minimal" (get stree :module-requires)))

    (CompiledModule
      (list->array module-requires)
      (list->array (get stree :module-provides))
      paren-wrapped)))
