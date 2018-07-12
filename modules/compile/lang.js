#lang js
// require: vendor/immutable, lang/js, lang/a
// provide: compile_via_lang
(function (Immutable, compilejs, compilea) {
    function lang_syntax_error(source) {
        throw "bad syntax while parsing module. Expected a #lang declaration followed by module body: \n" + source;
    }

    function is_legal_module_name(name) {
        return /^[a-zA-Z_\/]+$/.test(name);
    }

    function parse_lang_file(source) {
        const newline_index = source.indexOf("\n");

        if (newline_index === -1) {
            lang_syntax_error(source);
        }

        const lang_line = source.substring(0, newline_index);
        const body = source.substring(newline_index + 1);

        const lang_line_split = lang_line.split(" ")

        if (!(lang_line_split.length === 2
              && lang_line_split[0] === "#lang"
              && is_legal_module_name(lang_line_split[1]))) {
            lang_syntax_error(source);
        }

        return [lang_line_split[1], body];
    }

    function compile_via_lang(source, runner) {
        const [lang, body] = parse_lang_file(source)

        if (lang === "js") {
            return compilejs.compile_language(body, runner);
        } else if (lang === "a") {
            return compilea.compile_language(body, runner);
        } else {
            const module_instance = runner.run(lang)

            const compile_f = module_instance["compile_language"];
            if (compile_f === undefined) {
                throw "#lang module does not implement compile_language"
            }

            return compile_f(body, runner);
        }
    }

    return { compile_via_lang: compile_via_lang };
})
