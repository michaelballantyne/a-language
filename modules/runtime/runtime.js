#lang js
// require: vendor/immutable
// provide: is_identifier, is_number, is_string, is_js_object, is_js_array, make_identifier, get_identifier_string
(function (Immutable) {
    function is_string(arg) {
        if (typeof arg === 'string' || arg instanceof String) {
            return true;
        } else {
            return false;
        }
    }

    function is_number(arg) {
        return !isNaN(arg);
    }

    function is_identifier(arg) {
        return Immutable.Map.isMap(arg) && arg.has("identifier");
    }

    function is_js_object(arg) {
        return arg !== null && typeof arg === 'object';
    }

    function make_identifier(str) {
        return Immutable.Map({identifier: str});
    }

    function get_identifier_string(id) {
        return id.get("identifier");
    }

    return {
        is_identifier: is_identifier,
        is_number: is_number,
        is_string: is_string,
        is_js_object: is_js_object,
        is_js_array: Array.isArray,
        make_identifier: make_identifier,
        get_identifier_string: get_identifier_string
    }
})
