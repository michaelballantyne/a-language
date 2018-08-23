#lang a

(require runtime/runtime compile/reader)
(provide parse-module transform-reserved)

(def syntax-error
  (fn (stx)
    (error "bad syntax" (to-string stx))))

(def unbound-reference-error
  (fn (id)
    (error "unbound reference" (identifier-string id))))

; Currently unused, becuase local names are always postfixed with a gensym counter.
; In the future I might want to minimize name mangling, so I'll keep the list for now.
;
; const reserved = Immutable.Set([
;     "break",
;     "case",
;     "catch",
;     "class",
;     "const",
;     "continue",
;     "debugger",
;     "default",
;     "delete",
;     "do",
;     "else",
;     "export",
;     "extends",
;     "finally",
;     "for",
;     "function",
;     "if",
;     "import",
;     "in",
;     "instanceof",
;     "new",
;     "return",
;     "super",
;     "switch",
;     "this",
;     "throw",
;     "try",
;     "typeof",
;     "var",
;     "void",
;     "while",
;     "with",
;     "yield",
;     "null",
;     "true",
;     "false",
;     "abstract",
;     "boolean",
;     "byte",
;     "char",
;     "double",
;     "final",
;     "float",
;     "goto",
;     "int",
;     "long",
;     "native",
;     "short",
;     "synchronized",
;     "throws",
;     "transient",
;     "volatile",
;     "await",
;     "implements",
;     "interface",
;     "let",
;     "package",
;     "private",
;     "protected",
;     "public",
;     "static",
;     "enum"
; ])

(def operators
  (hash "-" "_"
        "/" "__"
        "+" "_plus_"
        "*" "_mul_"
        "%" "_mod_"
        ">" "_gt_"
        "<" "_lt_"
        "=" "_eq_"
        "!" "_bang_"
        "?" "_huh_"))

; string -> string
(def transform-reserved
  (fn (s)
    (string-join
      (map (fn (c) (if (has operators c) (get operators c) c))
           (string-split s ""))
      "")))

(def gensym-counter (box 0))

; identifier -> string
(def gensym
  (fn (id)
    (def n (unbox gensym-counter))
    (def _ (set-box! gensym-counter (+ 1 n)))
    (string-append (transform-reserved (identifier-string id)) (to-string n))))

(def app-parser
  (fn (exp env)
    (if (< (size exp) 1)
      (syntax-error exp)
      (hash :app-exps (map (fn (e) (parse-exp e env)) exp)))))

(def if-parser
  (fn (exp env)
    (if (not (= (size exp) 4))
      (syntax-error exp)
      (hash :if-c (parse-exp (get exp 1) env)
           :if-t (parse-exp (get exp 2) env)
           :if-e (parse-exp (get exp 3) env)))))

(def and-parser
  (fn (exp env)
    (if (not (= (size exp) 3))
      (syntax-error exp)
      (hash :if-c (parse-exp (get exp 1) env)
           :if-t (parse-exp (get exp 2) env)
           :if-e (hash :literal false)))))

(def or-parser
  (fn (exp env)
    (if (not (= (size exp) 3))
      (syntax-error exp)
      (block
        (def tmpid (gensym (make-identifier "tmp")))
        (hash :block-exp true
             :block-defs (list (hash :id tmpid :rhs (parse-exp (get exp 1) env)))
             :block-ret (hash :if-c (hash :local-ref tmpid)
                             :if-t (hash :local-ref tmpid)
                             :if-e (parse-exp (get exp 2) env)))))))

(def block-parser
  (fn (exp env)
    (def parsed-block (parse-block (rest exp) env))
    (if (empty? (get parsed-block :block-defs))
      (get parsed-block :block-ret)
      (assoc parsed-block :block-exp true))))

(def fn-parser
  (fn (exp env)
    (if (< (size exp) 3)
      (syntax-error exp)
      (block
        (def args (get exp 1))
        (def _ (if (not (and (list? args) (map identifier? args)))
                 (syntax-error exp)
                 null))
        (def new-env (foldl (fn (env arg) (assoc env arg (hash :local-ref (gensym arg)))) env args))
        (assoc
          (assoc (parse-block (rest (rest exp)) new-env)
                 :fn-args (map (fn (arg) (get (get new-env arg) :local-ref)) args))
          ; A hack: the compiler only needs temporaries for this one transform,
          ; so we'll generate them here.
          :fn-temps (map gensym args))))))

(def loop-parser
  (fn (exp env)
    (if (< (size exp) 3)
      (syntax-error exp)
      (block
        (def binding-list (get exp 1))
        (def _ (if (not (list? binding-list))
                 (syntax-error exp)
                 null))
        (def surface-vars (map (fn (pr) (get pr 0)) binding-list))
        (def new-env (foldl (fn (env var) (assoc env var (hash :local-ref (gensym var)))) env surface-vars))
        (assoc
         (assoc (parse-block (rest (rest exp)) new-env)
             :loop-vars (map (fn (var) (get (get new-env var) :local-ref)) surface-vars))
         :loop-inits (map (fn (pr) (parse-exp (get pr 1) env)) binding-list))))))

(def recur-parser
  (fn (exp env)
    (hash :recur-exps (map (fn (e) (parse-exp e env)) (rest exp))
         :recur-temps (map (fn (_) (gensym (make-identifier "tmp"))) (rest exp)))))

(def def-env-rhs (hash :def true))

(def initial-env
  (hash (make-identifier "def") def-env-rhs
        (make-identifier "fn") (hash :core-form fn-parser)
        (make-identifier "if") (hash :core-form if-parser)
        (make-identifier "or") (hash :core-form or-parser)
        (make-identifier "and") (hash :core-form and-parser)
        (make-identifier "loop") (hash :core-form loop-parser)
        (make-identifier "block") (hash :core-form block-parser)
        (make-identifier "recur") (hash :core-form recur-parser)))

(def match-def
  (fn (form env)
    (if (and (list? form)
             (equal? def-env-rhs (get env (get form 0))))
      (if (and (= 3 (size form))
               (identifier? (get form 1)))
        (hash :id (get form 1) :exp (get form 2))
        (syntax-error form))
      ; right now, it's always a sequence of defs than an exp in a block
      (syntax-error form))))

(def parse-defs
  (fn (forms env)
    (def defs (map (fn (f) (match-def f env)) forms))
    (def surface-ids (map (fn (d) (get d :id)) defs))
    (def new-env (foldl (fn (env id) (assoc env id (hash :local-ref (gensym id)))) env surface-ids))
    (def rhss (map (fn (d) (parse-exp (get d :exp) new-env)) defs))
    (hash :block-defs (zip (fn (id rhs) (hash :id id :rhs rhs))
                          (map (fn (id) (get (get new-env id) :local-ref)) surface-ids)
                          rhss)
         :surface-def-ids surface-ids
         :new-env new-env)))

(def parse-block
  (fn (forms env)
    (if (= 0 (size forms))
      (error "parse" "block must have at least one form")
      (block
        (def reversed (reverse forms))
        (def parsed-defs (parse-defs (reverse (rest reversed)) env))
        (def new-env (get parsed-defs :new-env))
        (def parsed-ret (parse-exp (first reversed) new-env))
        (hash :block-defs (get parsed-defs :block-defs)
             :block-ret parsed-ret)))))

(def parse-exp
  (fn (exp env)
    (if (or (number? exp) (string? exp))
      (hash :literal exp)
      (if (identifier? exp)
        (if (not (has env exp))
          (unbound-reference-error exp)
          (block
            (def env-entry (get env exp))
            (if (or (has env-entry :local-ref) (has env-entry :module-ref-sym))
              env-entry
              (if (has env-entry :core-form)
                (syntax-error exp)
                (error "parse-exp internal error" "malformed environment")))))
        (block
          (def rator (get exp 0))
          (if (and (and (identifier? rator) (has env rator)) (has (get env rator) :core-form))
            ((get (get env rator) :core-form) exp env)
            (app-parser exp env)))))))

(def andmap
  (fn (f l)
    (foldl (fn (a b) (and a b)) true
           (map f l))))

(def parse-module
  (fn (sexp runner)
    (def module-syntax-error
      (fn () (error "syntax error" "module must start with require and provide forms")))

    (def _ (if (not (list? sexp))
             (module-syntax-error)
             null))

    (def valid-reqprov?
      (fn (form name)
        (and (and (list? form)
                  (> (size form) 0))
             (and (equal? (get form 0) (make-identifier name))
                  (andmap identifier? (rest form))))))

    (def require-form (get sexp 0))
    (def _2 (if (not (valid-reqprov? require-form "require"))
              (module-syntax-error)
              null))

    (def provide-form (get sexp 1))
    (def _3 (if (not (valid-reqprov? provide-form "provide"))
              (module-syntax-error)
              null))

    (def requires (rest require-form))
    (def provides (rest provide-form))
    (def body (rest (rest sexp)))

    (def module-bindings (foldl (fn (table name) (assoc table name (gensym name))) (hash) requires))
    (def module-env
      (foldl (fn (env req)
               (def decl ((get runner :load) (identifier-string req)))
               (foldl
                 (fn (env name)
                   (assoc env (make-identifier name)
                          (hash :module-ref-sym (get module-bindings req)
                               :module-ref-field name)))
                 env (array->list (get decl :exports))))
             initial-env requires))

    (def parsed-defs (parse-defs body module-env))

    (def _4 (if (not (subset provides (get parsed-defs :surface-def-ids)))
              (error "syntax error" "some provided identifiers not defined")
              null))

    (def provide-internal-ids (map (fn (p) (get (get (get parsed-defs :new-env) p) :local-ref)) provides))

    (hash
      :module-requires (map identifier-string requires)
      :module-require-internal-ids (map (fn (r) (get module-bindings r)) requires)
      :module-provides (map identifier-string provides)
      :module-provide-internal-ids provide-internal-ids
      :block-defs (get parsed-defs :block-defs))))
