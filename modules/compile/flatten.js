#lang a

(require runtime/runtime compile/lang vendor/escodegen compile/js compile/parsea)
(provide flatten)

(def gen-module-id
  (fn (str)
    (obj :type "Identifier"
         :name (transform-reserved str))))

(def gen-module-instance-declaration
  (fn (name source deps)
    (obj :type "VariableDeclaration"
         :declarations
         (array (obj :type "VariableDeclarator"
                     :id (gen-module-id name)
                     :init (obj :type "CallExpression"
                                :callee (obj :type "Literal"
                                             :verbatim source)
                                :arguments (list->array (map gen-module-id deps)))))
         :kind "const")))

(def gen-iife-block-expression-statement
  (fn (body)
    (obj :type "ExpressionStatement"
         :expression (obj :type "FunctionExpression"
                          :id null
                          :params (array)
                          :body (obj :type "BlockStatement"
                                     :body (list->array body))))))

(def flatten
  (fn (runner main-module-name)
    ; TODO: clean up with support for expressions in defn sequence
    (def _ (string/c "flatten" main-module-name))
    (def flatten-internal
      (fn (acc module-name)
        (if (has (get acc :visited) module-name)
          acc
          (block
            (def compiled ((get runner :load) module-name))
            (def acc2 (foldl flatten-internal acc (array->list (get compiled :imports))))
            (def instance-declaration
              (gen-module-instance-declaration
                module-name
                (get compiled :body-code)
                (array->list (get compiled :imports))))
            (obj :declarations (cons instance-declaration (get acc2 :declarations))
                 :visited (assoc (get acc2 :visited) module-name true))))))
    (def module-declarations
      (reverse (get (flatten-internal (obj :declarations (list) :visited (hash)) main-module-name) :declarations)))
    (generate ; escodegen
      (gen-iife-block-expression-statement
       (append
        module-declarations
         (list (obj :type "ReturnStatement"
                    :argument (gen-module-id main-module-name)))))
      (obj :verbatim :verbatim))))
