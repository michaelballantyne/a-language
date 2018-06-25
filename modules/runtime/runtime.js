// require: vendor/immutable
// provide: identifier, isIdentifier, isNumber, isString, isJSObject, isJSArray, make_identifier
(function (Immutable) {
    const identifier = Symbol("identifier")

    function isString(arg) {
        if (typeof arg === 'string' || arg instanceof String) {
            return true;
        } else {
            return false;
        }
    }

    function isNumber(arg) {
        return !isNaN(arg);
    }

    function isIdentifier(arg) {
        return Immutable.Map.isMap(arg) && arg.has(identifier);
    }

    function isJSObject(arg) {
        return arg !== null && typeof arg === 'object';
    }

    function make_identifier(str) {
        return Immutable.Map([[identifier, str]]);
    }

    return {
        identifier: identifier,
        isIdentifier: isIdentifier,
        isNumber: isNumber,
        isString: isString,
        isJSObject: isJSObject,
        isJSArray: Array.isArray,
        make_identifier: make_identifier
    }
})
