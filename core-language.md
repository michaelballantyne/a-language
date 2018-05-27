## Option 1: macros atop JS

objects, literals, field assignment
functions, blocks, return
local variable declaration, assignment
statement while loops, if.

Not the language I ultimately want to program in, but requires no analysis.
(Other than binding analysis for the expander)

## Option 2: a core functional language

loop and functions/recur for loops
functional-style expression if, implicit return
checked function calls
lambda
definition blocks
#t, #f

pure-functional, with immutable.js data structures? Perhaps just mostly,
or multiple languages. Initially not.


Requires some real compilation, mostly for loop/recur.


Option 2 seems better.


Module is just a block whose definitions are added to an object and returned.

Hack up in Racket with match first, then translate to JS if happy.



What's the target? sexpy JS, some other IR, or direct to escodegen? If sexpy JS, then perhaps I need option 1 too.

Flatten / ANF or compile to direct style with IIFEs?

cljs seems to do different things in different contexts, and I don't understand why.
In statement vs expression context if compiles differently.

Ternary in expression; block if in statement. Situations involving the ternary
end up very unreadable in the output. (Should I care?)

Or, go full direct style with IIFEs wherever a statement is needed. I guess that's
what cljs does for loop/recur.


## Direct style

Continue is not legal in a function nested within a while. So perhaps that explains why cljs uses ternary for if in expression position rather than an IIFE. I suppose that also means recur must be unavailable from inside something like a lambda. Pretty limiting!


Okay, so let's use ternary if. Always?

Ah! More trouble. Recur wants to assign to local variables, which it can only do from statement position. So we have to use statement if to stay in statement land until we're out of tail position.

So what clojurescript does is the simplest way to do this with direct style.


## ANF?


