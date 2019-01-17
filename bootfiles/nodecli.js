(function () {
    const runtime__minimal = (//
    // References to this module and its exports are inserted by the compiler in every module.
    //
    (function () {
        function raise_arity_error(name, expected, given) {
            if (3 !== arguments.length) {
                raise_arity_error("raise-arity-error", 3, arguments.length);
            }
    
            throw Error(name + ": arity mismatch\n  expected: " + expected + "\n  given: " + given);
        }
    
        return {
            "raise-arity-error": raise_arity_error
        };
    })
    )();
    const vendor__immutable = ((function () {
    'use strict';
    const exports = {}
    /**
     * Copyright (c) 2014-present, Facebook, Inc.
     *
     * This source code is licensed under the MIT license found in the
     * LICENSE file in the root directory of this source tree.
     */
    
    // Used for setting prototype methods that IE8 chokes on.
    var DELETE = 'delete';
    
    // Constants describing the size of trie nodes.
    var SHIFT = 5; // Resulted in best performance after ______?
    var SIZE = 1 << SHIFT;
    var MASK = SIZE - 1;
    
    // A consistent shared value representing "not set" which equals nothing other
    // than itself, and nothing that could be provided externally.
    var NOT_SET = {};
    
    // Boolean references, Rough equivalent of `bool &`.
    var CHANGE_LENGTH = { value: false };
    var DID_ALTER = { value: false };
    
    function MakeRef(ref) {
      ref.value = false;
      return ref;
    }
    
    function SetRef(ref) {
      ref && (ref.value = true);
    }
    
    // A function which returns a value representing an "owner" for transient writes
    // to tries. The return value will only ever equal itself, and will not equal
    // the return of any subsequent call of this function.
    function OwnerID() {}
    
    function ensureSize(iter) {
      if (iter.size === undefined) {
        iter.size = iter.__iterate(returnTrue);
      }
      return iter.size;
    }
    
    function wrapIndex(iter, index) {
      // This implements "is array index" which the ECMAString spec defines as:
      //
      //     A String property name P is an array index if and only if
      //     ToString(ToUint32(P)) is equal to P and ToUint32(P) is not equal
      //     to 2^32−1.
      //
      // http://www.ecma-international.org/ecma-262/6.0/#sec-array-exotic-objects
      if (typeof index !== 'number') {
        var uint32Index = index >>> 0; // N >>> 0 is shorthand for ToUint32
        if ('' + uint32Index !== index || uint32Index === 4294967295) {
          return NaN;
        }
        index = uint32Index;
      }
      return index < 0 ? ensureSize(iter) + index : index;
    }
    
    function returnTrue() {
      return true;
    }
    
    function wholeSlice(begin, end, size) {
      return (
        ((begin === 0 && !isNeg(begin)) ||
          (size !== undefined && begin <= -size)) &&
        (end === undefined || (size !== undefined && end >= size))
      );
    }
    
    function resolveBegin(begin, size) {
      return resolveIndex(begin, size, 0);
    }
    
    function resolveEnd(end, size) {
      return resolveIndex(end, size, size);
    }
    
    function resolveIndex(index, size, defaultIndex) {
      // Sanitize indices using this shorthand for ToInt32(argument)
      // http://www.ecma-international.org/ecma-262/6.0/#sec-toint32
      return index === undefined
        ? defaultIndex
        : isNeg(index)
          ? size === Infinity ? size : Math.max(0, size + index) | 0
          : size === undefined || size === index
            ? index
            : Math.min(size, index) | 0;
    }
    
    function isNeg(value) {
      // Account for -0 which is negative, but not less than 0.
      return value < 0 || (value === 0 && 1 / value === -Infinity);
    }
    
    function isImmutable(maybeImmutable) {
      return isCollection(maybeImmutable) || isRecord(maybeImmutable);
    }
    
    function isCollection(maybeCollection) {
      return !!(maybeCollection && maybeCollection[IS_ITERABLE_SENTINEL]);
    }
    
    function isKeyed(maybeKeyed) {
      return !!(maybeKeyed && maybeKeyed[IS_KEYED_SENTINEL]);
    }
    
    function isIndexed(maybeIndexed) {
      return !!(maybeIndexed && maybeIndexed[IS_INDEXED_SENTINEL]);
    }
    
    function isAssociative(maybeAssociative) {
      return isKeyed(maybeAssociative) || isIndexed(maybeAssociative);
    }
    
    function isOrdered(maybeOrdered) {
      return !!(maybeOrdered && maybeOrdered[IS_ORDERED_SENTINEL]);
    }
    
    function isRecord(maybeRecord) {
      return !!(maybeRecord && maybeRecord[IS_RECORD_SENTINEL]);
    }
    
    function isValueObject(maybeValue) {
      return !!(
        maybeValue &&
        typeof maybeValue.equals === 'function' &&
        typeof maybeValue.hashCode === 'function'
      );
    }
    
    var IS_ITERABLE_SENTINEL = '@@__IMMUTABLE_ITERABLE__@@';
    var IS_KEYED_SENTINEL = '@@__IMMUTABLE_KEYED__@@';
    var IS_INDEXED_SENTINEL = '@@__IMMUTABLE_INDEXED__@@';
    var IS_ORDERED_SENTINEL = '@@__IMMUTABLE_ORDERED__@@';
    var IS_RECORD_SENTINEL = '@@__IMMUTABLE_RECORD__@@';
    
    var Collection = function Collection(value) {
      return isCollection(value) ? value : Seq(value);
    };
    
    var KeyedCollection = (function (Collection) {
      function KeyedCollection(value) {
        return isKeyed(value) ? value : KeyedSeq(value);
      }
    
      if ( Collection ) KeyedCollection.__proto__ = Collection;
      KeyedCollection.prototype = Object.create( Collection && Collection.prototype );
      KeyedCollection.prototype.constructor = KeyedCollection;
    
      return KeyedCollection;
    }(Collection));
    
    var IndexedCollection = (function (Collection) {
      function IndexedCollection(value) {
        return isIndexed(value) ? value : IndexedSeq(value);
      }
    
      if ( Collection ) IndexedCollection.__proto__ = Collection;
      IndexedCollection.prototype = Object.create( Collection && Collection.prototype );
      IndexedCollection.prototype.constructor = IndexedCollection;
    
      return IndexedCollection;
    }(Collection));
    
    var SetCollection = (function (Collection) {
      function SetCollection(value) {
        return isCollection(value) && !isAssociative(value) ? value : SetSeq(value);
      }
    
      if ( Collection ) SetCollection.__proto__ = Collection;
      SetCollection.prototype = Object.create( Collection && Collection.prototype );
      SetCollection.prototype.constructor = SetCollection;
    
      return SetCollection;
    }(Collection));
    
    Collection.Keyed = KeyedCollection;
    Collection.Indexed = IndexedCollection;
    Collection.Set = SetCollection;
    
    var ITERATE_KEYS = 0;
    var ITERATE_VALUES = 1;
    var ITERATE_ENTRIES = 2;
    
    var REAL_ITERATOR_SYMBOL = typeof Symbol === 'function' && Symbol.iterator;
    var FAUX_ITERATOR_SYMBOL = '@@iterator';
    
    var ITERATOR_SYMBOL = REAL_ITERATOR_SYMBOL || FAUX_ITERATOR_SYMBOL;
    
    var Iterator = function Iterator(next) {
      this.next = next;
    };
    
    Iterator.prototype.toString = function toString () {
      return '[Iterator]';
    };
    
    Iterator.KEYS = ITERATE_KEYS;
    Iterator.VALUES = ITERATE_VALUES;
    Iterator.ENTRIES = ITERATE_ENTRIES;
    
    Iterator.prototype.inspect = Iterator.prototype.toSource = function() {
      return this.toString();
    };
    Iterator.prototype[ITERATOR_SYMBOL] = function() {
      return this;
    };
    
    function iteratorValue(type, k, v, iteratorResult) {
      var value = type === 0 ? k : type === 1 ? v : [k, v];
      iteratorResult
        ? (iteratorResult.value = value)
        : (iteratorResult = {
            value: value,
            done: false
          });
      return iteratorResult;
    }
    
    function iteratorDone() {
      return { value: undefined, done: true };
    }
    
    function hasIterator(maybeIterable) {
      return !!getIteratorFn(maybeIterable);
    }
    
    function isIterator(maybeIterator) {
      return maybeIterator && typeof maybeIterator.next === 'function';
    }
    
    function getIterator(iterable) {
      var iteratorFn = getIteratorFn(iterable);
      return iteratorFn && iteratorFn.call(iterable);
    }
    
    function getIteratorFn(iterable) {
      var iteratorFn =
        iterable &&
        ((REAL_ITERATOR_SYMBOL && iterable[REAL_ITERATOR_SYMBOL]) ||
          iterable[FAUX_ITERATOR_SYMBOL]);
      if (typeof iteratorFn === 'function') {
        return iteratorFn;
      }
    }
    
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    
    function isArrayLike(value) {
      return value && typeof value.length === 'number';
    }
    
    var Seq = (function (Collection$$1) {
      function Seq(value) {
        return value === null || value === undefined
          ? emptySequence()
          : isImmutable(value) ? value.toSeq() : seqFromValue(value);
      }
    
      if ( Collection$$1 ) Seq.__proto__ = Collection$$1;
      Seq.prototype = Object.create( Collection$$1 && Collection$$1.prototype );
      Seq.prototype.constructor = Seq;
    
      Seq.prototype.toSeq = function toSeq () {
        return this;
      };
    
      Seq.prototype.toString = function toString () {
        return this.__toString('Seq {', '}');
      };
    
      Seq.prototype.cacheResult = function cacheResult () {
        if (!this._cache && this.__iterateUncached) {
          this._cache = this.entrySeq().toArray();
          this.size = this._cache.length;
        }
        return this;
      };
    
      // abstract __iterateUncached(fn, reverse)
    
      Seq.prototype.__iterate = function __iterate (fn, reverse) {
        var this$1 = this;
    
        var cache = this._cache;
        if (cache) {
          var size = cache.length;
          var i = 0;
          while (i !== size) {
            var entry = cache[reverse ? size - ++i : i++];
            if (fn(entry[1], entry[0], this$1) === false) {
              break;
            }
          }
          return i;
        }
        return this.__iterateUncached(fn, reverse);
      };
    
      // abstract __iteratorUncached(type, reverse)
    
      Seq.prototype.__iterator = function __iterator (type, reverse) {
        var cache = this._cache;
        if (cache) {
          var size = cache.length;
          var i = 0;
          return new Iterator(function () {
            if (i === size) {
              return iteratorDone();
            }
            var entry = cache[reverse ? size - ++i : i++];
            return iteratorValue(type, entry[0], entry[1]);
          });
        }
        return this.__iteratorUncached(type, reverse);
      };
    
      return Seq;
    }(Collection));
    
    var KeyedSeq = (function (Seq) {
      function KeyedSeq(value) {
        return value === null || value === undefined
          ? emptySequence().toKeyedSeq()
          : isCollection(value)
            ? isKeyed(value) ? value.toSeq() : value.fromEntrySeq()
            : isRecord(value) ? value.toSeq() : keyedSeqFromValue(value);
      }
    
      if ( Seq ) KeyedSeq.__proto__ = Seq;
      KeyedSeq.prototype = Object.create( Seq && Seq.prototype );
      KeyedSeq.prototype.constructor = KeyedSeq;
    
      KeyedSeq.prototype.toKeyedSeq = function toKeyedSeq () {
        return this;
      };
    
      return KeyedSeq;
    }(Seq));
    
    var IndexedSeq = (function (Seq) {
      function IndexedSeq(value) {
        return value === null || value === undefined
          ? emptySequence()
          : isCollection(value)
            ? isKeyed(value) ? value.entrySeq() : value.toIndexedSeq()
            : isRecord(value)
              ? value.toSeq().entrySeq()
              : indexedSeqFromValue(value);
      }
    
      if ( Seq ) IndexedSeq.__proto__ = Seq;
      IndexedSeq.prototype = Object.create( Seq && Seq.prototype );
      IndexedSeq.prototype.constructor = IndexedSeq;
    
      IndexedSeq.of = function of (/*...values*/) {
        return IndexedSeq(arguments);
      };
    
      IndexedSeq.prototype.toIndexedSeq = function toIndexedSeq () {
        return this;
      };
    
      IndexedSeq.prototype.toString = function toString () {
        return this.__toString('Seq [', ']');
      };
    
      return IndexedSeq;
    }(Seq));
    
    var SetSeq = (function (Seq) {
      function SetSeq(value) {
        return (isCollection(value) && !isAssociative(value)
          ? value
          : IndexedSeq(value)
        ).toSetSeq();
      }
    
      if ( Seq ) SetSeq.__proto__ = Seq;
      SetSeq.prototype = Object.create( Seq && Seq.prototype );
      SetSeq.prototype.constructor = SetSeq;
    
      SetSeq.of = function of (/*...values*/) {
        return SetSeq(arguments);
      };
    
      SetSeq.prototype.toSetSeq = function toSetSeq () {
        return this;
      };
    
      return SetSeq;
    }(Seq));
    
    Seq.isSeq = isSeq;
    Seq.Keyed = KeyedSeq;
    Seq.Set = SetSeq;
    Seq.Indexed = IndexedSeq;
    
    var IS_SEQ_SENTINEL = '@@__IMMUTABLE_SEQ__@@';
    
    Seq.prototype[IS_SEQ_SENTINEL] = true;
    
    // #pragma Root Sequences
    
    var ArraySeq = (function (IndexedSeq) {
      function ArraySeq(array) {
        this._array = array;
        this.size = array.length;
      }
    
      if ( IndexedSeq ) ArraySeq.__proto__ = IndexedSeq;
      ArraySeq.prototype = Object.create( IndexedSeq && IndexedSeq.prototype );
      ArraySeq.prototype.constructor = ArraySeq;
    
      ArraySeq.prototype.get = function get (index, notSetValue) {
        return this.has(index) ? this._array[wrapIndex(this, index)] : notSetValue;
      };
    
      ArraySeq.prototype.__iterate = function __iterate (fn, reverse) {
        var this$1 = this;
    
        var array = this._array;
        var size = array.length;
        var i = 0;
        while (i !== size) {
          var ii = reverse ? size - ++i : i++;
          if (fn(array[ii], ii, this$1) === false) {
            break;
          }
        }
        return i;
      };
    
      ArraySeq.prototype.__iterator = function __iterator (type, reverse) {
        var array = this._array;
        var size = array.length;
        var i = 0;
        return new Iterator(function () {
          if (i === size) {
            return iteratorDone();
          }
          var ii = reverse ? size - ++i : i++;
          return iteratorValue(type, ii, array[ii]);
        });
      };
    
      return ArraySeq;
    }(IndexedSeq));
    
    var ObjectSeq = (function (KeyedSeq) {
      function ObjectSeq(object) {
        var keys = Object.keys(object);
        this._object = object;
        this._keys = keys;
        this.size = keys.length;
      }
    
      if ( KeyedSeq ) ObjectSeq.__proto__ = KeyedSeq;
      ObjectSeq.prototype = Object.create( KeyedSeq && KeyedSeq.prototype );
      ObjectSeq.prototype.constructor = ObjectSeq;
    
      ObjectSeq.prototype.get = function get (key, notSetValue) {
        if (notSetValue !== undefined && !this.has(key)) {
          return notSetValue;
        }
        return this._object[key];
      };
    
      ObjectSeq.prototype.has = function has (key) {
        return hasOwnProperty.call(this._object, key);
      };
    
      ObjectSeq.prototype.__iterate = function __iterate (fn, reverse) {
        var this$1 = this;
    
        var object = this._object;
        var keys = this._keys;
        var size = keys.length;
        var i = 0;
        while (i !== size) {
          var key = keys[reverse ? size - ++i : i++];
          if (fn(object[key], key, this$1) === false) {
            break;
          }
        }
        return i;
      };
    
      ObjectSeq.prototype.__iterator = function __iterator (type, reverse) {
        var object = this._object;
        var keys = this._keys;
        var size = keys.length;
        var i = 0;
        return new Iterator(function () {
          if (i === size) {
            return iteratorDone();
          }
          var key = keys[reverse ? size - ++i : i++];
          return iteratorValue(type, key, object[key]);
        });
      };
    
      return ObjectSeq;
    }(KeyedSeq));
    ObjectSeq.prototype[IS_ORDERED_SENTINEL] = true;
    
    var CollectionSeq = (function (IndexedSeq) {
      function CollectionSeq(collection) {
        this._collection = collection;
        this.size = collection.length || collection.size;
      }
    
      if ( IndexedSeq ) CollectionSeq.__proto__ = IndexedSeq;
      CollectionSeq.prototype = Object.create( IndexedSeq && IndexedSeq.prototype );
      CollectionSeq.prototype.constructor = CollectionSeq;
    
      CollectionSeq.prototype.__iterateUncached = function __iterateUncached (fn, reverse) {
        var this$1 = this;
    
        if (reverse) {
          return this.cacheResult().__iterate(fn, reverse);
        }
        var collection = this._collection;
        var iterator = getIterator(collection);
        var iterations = 0;
        if (isIterator(iterator)) {
          var step;
          while (!(step = iterator.next()).done) {
            if (fn(step.value, iterations++, this$1) === false) {
              break;
            }
          }
        }
        return iterations;
      };
    
      CollectionSeq.prototype.__iteratorUncached = function __iteratorUncached (type, reverse) {
        if (reverse) {
          return this.cacheResult().__iterator(type, reverse);
        }
        var collection = this._collection;
        var iterator = getIterator(collection);
        if (!isIterator(iterator)) {
          return new Iterator(iteratorDone);
        }
        var iterations = 0;
        return new Iterator(function () {
          var step = iterator.next();
          return step.done ? step : iteratorValue(type, iterations++, step.value);
        });
      };
    
      return CollectionSeq;
    }(IndexedSeq));
    
    var IteratorSeq = (function (IndexedSeq) {
      function IteratorSeq(iterator) {
        this._iterator = iterator;
        this._iteratorCache = [];
      }
    
      if ( IndexedSeq ) IteratorSeq.__proto__ = IndexedSeq;
      IteratorSeq.prototype = Object.create( IndexedSeq && IndexedSeq.prototype );
      IteratorSeq.prototype.constructor = IteratorSeq;
    
      IteratorSeq.prototype.__iterateUncached = function __iterateUncached (fn, reverse) {
        var this$1 = this;
    
        if (reverse) {
          return this.cacheResult().__iterate(fn, reverse);
        }
        var iterator = this._iterator;
        var cache = this._iteratorCache;
        var iterations = 0;
        while (iterations < cache.length) {
          if (fn(cache[iterations], iterations++, this$1) === false) {
            return iterations;
          }
        }
        var step;
        while (!(step = iterator.next()).done) {
          var val = step.value;
          cache[iterations] = val;
          if (fn(val, iterations++, this$1) === false) {
            break;
          }
        }
        return iterations;
      };
    
      IteratorSeq.prototype.__iteratorUncached = function __iteratorUncached (type, reverse) {
        if (reverse) {
          return this.cacheResult().__iterator(type, reverse);
        }
        var iterator = this._iterator;
        var cache = this._iteratorCache;
        var iterations = 0;
        return new Iterator(function () {
          if (iterations >= cache.length) {
            var step = iterator.next();
            if (step.done) {
              return step;
            }
            cache[iterations] = step.value;
          }
          return iteratorValue(type, iterations, cache[iterations++]);
        });
      };
    
      return IteratorSeq;
    }(IndexedSeq));
    
    // # pragma Helper functions
    
    function isSeq(maybeSeq) {
      return !!(maybeSeq && maybeSeq[IS_SEQ_SENTINEL]);
    }
    
    var EMPTY_SEQ;
    
    function emptySequence() {
      return EMPTY_SEQ || (EMPTY_SEQ = new ArraySeq([]));
    }
    
    function keyedSeqFromValue(value) {
      var seq = Array.isArray(value)
        ? new ArraySeq(value)
        : isIterator(value)
          ? new IteratorSeq(value)
          : hasIterator(value) ? new CollectionSeq(value) : undefined;
      if (seq) {
        return seq.fromEntrySeq();
      }
      if (typeof value === 'object') {
        return new ObjectSeq(value);
      }
      throw new TypeError(
        'Expected Array or collection object of [k, v] entries, or keyed object: ' +
          value
      );
    }
    
    function indexedSeqFromValue(value) {
      var seq = maybeIndexedSeqFromValue(value);
      if (seq) {
        return seq;
      }
      throw new TypeError(
        'Expected Array or collection object of values: ' + value
      );
    }
    
    function seqFromValue(value) {
      var seq = maybeIndexedSeqFromValue(value);
      if (seq) {
        return seq;
      }
      if (typeof value === 'object') {
        return new ObjectSeq(value);
      }
      throw new TypeError(
        'Expected Array or collection object of values, or keyed object: ' + value
      );
    }
    
    function maybeIndexedSeqFromValue(value) {
      return isArrayLike(value)
        ? new ArraySeq(value)
        : isIterator(value)
          ? new IteratorSeq(value)
          : hasIterator(value) ? new CollectionSeq(value) : undefined;
    }
    
    /**
     * An extension of the "same-value" algorithm as [described for use by ES6 Map
     * and Set](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map#Key_equality)
     *
     * NaN is considered the same as NaN, however -0 and 0 are considered the same
     * value, which is different from the algorithm described by
     * [`Object.is`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is).
     *
     * This is extended further to allow Objects to describe the values they
     * represent, by way of `valueOf` or `equals` (and `hashCode`).
     *
     * Note: because of this extension, the key equality of Immutable.Map and the
     * value equality of Immutable.Set will differ from ES6 Map and Set.
     *
     * ### Defining custom values
     *
     * The easiest way to describe the value an object represents is by implementing
     * `valueOf`. For example, `Date` represents a value by returning a unix
     * timestamp for `valueOf`:
     *
     *     var date1 = new Date(1234567890000); // Fri Feb 13 2009 ...
     *     var date2 = new Date(1234567890000);
     *     date1.valueOf(); // 1234567890000
     *     assert( date1 !== date2 );
     *     assert( Immutable.is( date1, date2 ) );
     *
     * Note: overriding `valueOf` may have other implications if you use this object
     * where JavaScript expects a primitive, such as implicit string coercion.
     *
     * For more complex types, especially collections, implementing `valueOf` may
     * not be performant. An alternative is to implement `equals` and `hashCode`.
     *
     * `equals` takes another object, presumably of similar type, and returns true
     * if it is equal. Equality is symmetrical, so the same result should be
     * returned if this and the argument are flipped.
     *
     *     assert( a.equals(b) === b.equals(a) );
     *
     * `hashCode` returns a 32bit integer number representing the object which will
     * be used to determine how to store the value object in a Map or Set. You must
     * provide both or neither methods, one must not exist without the other.
     *
     * Also, an important relationship between these methods must be upheld: if two
     * values are equal, they *must* return the same hashCode. If the values are not
     * equal, they might have the same hashCode; this is called a hash collision,
     * and while undesirable for performance reasons, it is acceptable.
     *
     *     if (a.equals(b)) {
     *       assert( a.hashCode() === b.hashCode() );
     *     }
     *
     * All Immutable collections are Value Objects: they implement `equals()`
     * and `hashCode()`.
     */
    function is(valueA, valueB) {
      if (valueA === valueB || (valueA !== valueA && valueB !== valueB)) {
        return true;
      }
      if (!valueA || !valueB) {
        return false;
      }
      if (
        typeof valueA.valueOf === 'function' &&
        typeof valueB.valueOf === 'function'
      ) {
        valueA = valueA.valueOf();
        valueB = valueB.valueOf();
        if (valueA === valueB || (valueA !== valueA && valueB !== valueB)) {
          return true;
        }
        if (!valueA || !valueB) {
          return false;
        }
      }
      return !!(
        isValueObject(valueA) &&
        isValueObject(valueB) &&
        valueA.equals(valueB)
      );
    }
    
    var imul =
      typeof Math.imul === 'function' && Math.imul(0xffffffff, 2) === -2
        ? Math.imul
        : function imul(a, b) {
            a |= 0; // int
            b |= 0; // int
            var c = a & 0xffff;
            var d = b & 0xffff;
            // Shift by 0 fixes the sign on the high part.
            return (c * d + ((((a >>> 16) * d + c * (b >>> 16)) << 16) >>> 0)) | 0; // int
          };
    
    // v8 has an optimization for storing 31-bit signed numbers.
    // Values which have either 00 or 11 as the high order bits qualify.
    // This function drops the highest order bit in a signed number, maintaining
    // the sign bit.
    function smi(i32) {
      return ((i32 >>> 1) & 0x40000000) | (i32 & 0xbfffffff);
    }
    
    function hash(o) {
      if (o === false || o === null || o === undefined) {
        return 0;
      }
      if (typeof o.valueOf === 'function') {
        o = o.valueOf();
        if (o === false || o === null || o === undefined) {
          return 0;
        }
      }
      if (o === true) {
        return 1;
      }
      var type = typeof o;
      if (type === 'number') {
        if (o !== o || o === Infinity) {
          return 0;
        }
        var h = o | 0;
        if (h !== o) {
          h ^= o * 0xffffffff;
        }
        while (o > 0xffffffff) {
          o /= 0xffffffff;
          h ^= o;
        }
        return smi(h);
      }
      if (type === 'string') {
        return o.length > STRING_HASH_CACHE_MIN_STRLEN
          ? cachedHashString(o)
          : hashString(o);
      }
      if (typeof o.hashCode === 'function') {
        // Drop any high bits from accidentally long hash codes.
        return smi(o.hashCode());
      }
      if (type === 'object') {
        return hashJSObj(o);
      }
      if (typeof o.toString === 'function') {
        return hashString(o.toString());
      }
      throw new Error('Value type ' + type + ' cannot be hashed.');
    }
    
    function cachedHashString(string) {
      var hashed = stringHashCache[string];
      if (hashed === undefined) {
        hashed = hashString(string);
        if (STRING_HASH_CACHE_SIZE === STRING_HASH_CACHE_MAX_SIZE) {
          STRING_HASH_CACHE_SIZE = 0;
          stringHashCache = {};
        }
        STRING_HASH_CACHE_SIZE++;
        stringHashCache[string] = hashed;
      }
      return hashed;
    }
    
    // http://jsperf.com/hashing-strings
    function hashString(string) {
      // This is the hash from JVM
      // The hash code for a string is computed as
      // s[0] * 31 ^ (n - 1) + s[1] * 31 ^ (n - 2) + ... + s[n - 1],
      // where s[i] is the ith character of the string and n is the length of
      // the string. We "mod" the result to make it between 0 (inclusive) and 2^31
      // (exclusive) by dropping high bits.
      var hashed = 0;
      for (var ii = 0; ii < string.length; ii++) {
        hashed = (31 * hashed + string.charCodeAt(ii)) | 0;
      }
      return smi(hashed);
    }
    
    function hashJSObj(obj) {
      var hashed;
      if (usingWeakMap) {
        hashed = weakMap.get(obj);
        if (hashed !== undefined) {
          return hashed;
        }
      }
    
      hashed = obj[UID_HASH_KEY];
      if (hashed !== undefined) {
        return hashed;
      }
    
      if (!canDefineProperty) {
        hashed = obj.propertyIsEnumerable && obj.propertyIsEnumerable[UID_HASH_KEY];
        if (hashed !== undefined) {
          return hashed;
        }
    
        hashed = getIENodeHash(obj);
        if (hashed !== undefined) {
          return hashed;
        }
      }
    
      hashed = ++objHashUID;
      if (objHashUID & 0x40000000) {
        objHashUID = 0;
      }
    
      if (usingWeakMap) {
        weakMap.set(obj, hashed);
      } else if (isExtensible !== undefined && isExtensible(obj) === false) {
        throw new Error('Non-extensible objects are not allowed as keys.');
      } else if (canDefineProperty) {
        Object.defineProperty(obj, UID_HASH_KEY, {
          enumerable: false,
          configurable: false,
          writable: false,
          value: hashed
        });
      } else if (
        obj.propertyIsEnumerable !== undefined &&
        obj.propertyIsEnumerable === obj.constructor.prototype.propertyIsEnumerable
      ) {
        // Since we can't define a non-enumerable property on the object
        // we'll hijack one of the less-used non-enumerable properties to
        // save our hash on it. Since this is a function it will not show up in
        // `JSON.stringify` which is what we want.
        obj.propertyIsEnumerable = function() {
          return this.constructor.prototype.propertyIsEnumerable.apply(
            this,
            arguments
          );
        };
        obj.propertyIsEnumerable[UID_HASH_KEY] = hashed;
      } else if (obj.nodeType !== undefined) {
        // At this point we couldn't get the IE `uniqueID` to use as a hash
        // and we couldn't use a non-enumerable property to exploit the
        // dontEnum bug so we simply add the `UID_HASH_KEY` on the node
        // itself.
        obj[UID_HASH_KEY] = hashed;
      } else {
        throw new Error('Unable to set a non-enumerable property on object.');
      }
    
      return hashed;
    }
    
    // Get references to ES5 object methods.
    var isExtensible = Object.isExtensible;
    
    // True if Object.defineProperty works as expected. IE8 fails this test.
    var canDefineProperty = (function() {
      try {
        Object.defineProperty({}, '@', {});
        return true;
      } catch (e) {
        return false;
      }
    })();
    
    // IE has a `uniqueID` property on DOM nodes. We can construct the hash from it
    // and avoid memory leaks from the IE cloneNode bug.
    function getIENodeHash(node) {
      if (node && node.nodeType > 0) {
        switch (node.nodeType) {
          case 1: // Element
            return node.uniqueID;
          case 9: // Document
            return node.documentElement && node.documentElement.uniqueID;
        }
      }
    }
    
    // If possible, use a WeakMap.
    var usingWeakMap = typeof WeakMap === 'function';
    var weakMap;
    if (usingWeakMap) {
      weakMap = new WeakMap();
    }
    
    var objHashUID = 0;
    
    var UID_HASH_KEY = '__immutablehash__';
    if (typeof Symbol === 'function') {
      UID_HASH_KEY = Symbol(UID_HASH_KEY);
    }
    
    var STRING_HASH_CACHE_MIN_STRLEN = 16;
    var STRING_HASH_CACHE_MAX_SIZE = 255;
    var STRING_HASH_CACHE_SIZE = 0;
    var stringHashCache = {};
    
    var ToKeyedSequence = (function (KeyedSeq$$1) {
      function ToKeyedSequence(indexed, useKeys) {
        this._iter = indexed;
        this._useKeys = useKeys;
        this.size = indexed.size;
      }
    
      if ( KeyedSeq$$1 ) ToKeyedSequence.__proto__ = KeyedSeq$$1;
      ToKeyedSequence.prototype = Object.create( KeyedSeq$$1 && KeyedSeq$$1.prototype );
      ToKeyedSequence.prototype.constructor = ToKeyedSequence;
    
      ToKeyedSequence.prototype.get = function get (key, notSetValue) {
        return this._iter.get(key, notSetValue);
      };
    
      ToKeyedSequence.prototype.has = function has (key) {
        return this._iter.has(key);
      };
    
      ToKeyedSequence.prototype.valueSeq = function valueSeq () {
        return this._iter.valueSeq();
      };
    
      ToKeyedSequence.prototype.reverse = function reverse () {
        var this$1 = this;
    
        var reversedSequence = reverseFactory(this, true);
        if (!this._useKeys) {
          reversedSequence.valueSeq = function () { return this$1._iter.toSeq().reverse(); };
        }
        return reversedSequence;
      };
    
      ToKeyedSequence.prototype.map = function map (mapper, context) {
        var this$1 = this;
    
        var mappedSequence = mapFactory(this, mapper, context);
        if (!this._useKeys) {
          mappedSequence.valueSeq = function () { return this$1._iter.toSeq().map(mapper, context); };
        }
        return mappedSequence;
      };
    
      ToKeyedSequence.prototype.__iterate = function __iterate (fn, reverse) {
        var this$1 = this;
    
        return this._iter.__iterate(function (v, k) { return fn(v, k, this$1); }, reverse);
      };
    
      ToKeyedSequence.prototype.__iterator = function __iterator (type, reverse) {
        return this._iter.__iterator(type, reverse);
      };
    
      return ToKeyedSequence;
    }(KeyedSeq));
    ToKeyedSequence.prototype[IS_ORDERED_SENTINEL] = true;
    
    var ToIndexedSequence = (function (IndexedSeq$$1) {
      function ToIndexedSequence(iter) {
        this._iter = iter;
        this.size = iter.size;
      }
    
      if ( IndexedSeq$$1 ) ToIndexedSequence.__proto__ = IndexedSeq$$1;
      ToIndexedSequence.prototype = Object.create( IndexedSeq$$1 && IndexedSeq$$1.prototype );
      ToIndexedSequence.prototype.constructor = ToIndexedSequence;
    
      ToIndexedSequence.prototype.includes = function includes (value) {
        return this._iter.includes(value);
      };
    
      ToIndexedSequence.prototype.__iterate = function __iterate (fn, reverse) {
        var this$1 = this;
    
        var i = 0;
        reverse && ensureSize(this);
        return this._iter.__iterate(
          function (v) { return fn(v, reverse ? this$1.size - ++i : i++, this$1); },
          reverse
        );
      };
    
      ToIndexedSequence.prototype.__iterator = function __iterator (type, reverse) {
        var this$1 = this;
    
        var iterator = this._iter.__iterator(ITERATE_VALUES, reverse);
        var i = 0;
        reverse && ensureSize(this);
        return new Iterator(function () {
          var step = iterator.next();
          return step.done
            ? step
            : iteratorValue(
                type,
                reverse ? this$1.size - ++i : i++,
                step.value,
                step
              );
        });
      };
    
      return ToIndexedSequence;
    }(IndexedSeq));
    
    var ToSetSequence = (function (SetSeq$$1) {
      function ToSetSequence(iter) {
        this._iter = iter;
        this.size = iter.size;
      }
    
      if ( SetSeq$$1 ) ToSetSequence.__proto__ = SetSeq$$1;
      ToSetSequence.prototype = Object.create( SetSeq$$1 && SetSeq$$1.prototype );
      ToSetSequence.prototype.constructor = ToSetSequence;
    
      ToSetSequence.prototype.has = function has (key) {
        return this._iter.includes(key);
      };
    
      ToSetSequence.prototype.__iterate = function __iterate (fn, reverse) {
        var this$1 = this;
    
        return this._iter.__iterate(function (v) { return fn(v, v, this$1); }, reverse);
      };
    
      ToSetSequence.prototype.__iterator = function __iterator (type, reverse) {
        var iterator = this._iter.__iterator(ITERATE_VALUES, reverse);
        return new Iterator(function () {
          var step = iterator.next();
          return step.done
            ? step
            : iteratorValue(type, step.value, step.value, step);
        });
      };
    
      return ToSetSequence;
    }(SetSeq));
    
    var FromEntriesSequence = (function (KeyedSeq$$1) {
      function FromEntriesSequence(entries) {
        this._iter = entries;
        this.size = entries.size;
      }
    
      if ( KeyedSeq$$1 ) FromEntriesSequence.__proto__ = KeyedSeq$$1;
      FromEntriesSequence.prototype = Object.create( KeyedSeq$$1 && KeyedSeq$$1.prototype );
      FromEntriesSequence.prototype.constructor = FromEntriesSequence;
    
      FromEntriesSequence.prototype.entrySeq = function entrySeq () {
        return this._iter.toSeq();
      };
    
      FromEntriesSequence.prototype.__iterate = function __iterate (fn, reverse) {
        var this$1 = this;
    
        return this._iter.__iterate(function (entry) {
          // Check if entry exists first so array access doesn't throw for holes
          // in the parent iteration.
          if (entry) {
            validateEntry(entry);
            var indexedCollection = isCollection(entry);
            return fn(
              indexedCollection ? entry.get(1) : entry[1],
              indexedCollection ? entry.get(0) : entry[0],
              this$1
            );
          }
        }, reverse);
      };
    
      FromEntriesSequence.prototype.__iterator = function __iterator (type, reverse) {
        var iterator = this._iter.__iterator(ITERATE_VALUES, reverse);
        return new Iterator(function () {
          while (true) {
            var step = iterator.next();
            if (step.done) {
              return step;
            }
            var entry = step.value;
            // Check if entry exists first so array access doesn't throw for holes
            // in the parent iteration.
            if (entry) {
              validateEntry(entry);
              var indexedCollection = isCollection(entry);
              return iteratorValue(
                type,
                indexedCollection ? entry.get(0) : entry[0],
                indexedCollection ? entry.get(1) : entry[1],
                step
              );
            }
          }
        });
      };
    
      return FromEntriesSequence;
    }(KeyedSeq));
    
    ToIndexedSequence.prototype.cacheResult = ToKeyedSequence.prototype.cacheResult = ToSetSequence.prototype.cacheResult = FromEntriesSequence.prototype.cacheResult = cacheResultThrough;
    
    function flipFactory(collection) {
      var flipSequence = makeSequence(collection);
      flipSequence._iter = collection;
      flipSequence.size = collection.size;
      flipSequence.flip = function () { return collection; };
      flipSequence.reverse = function() {
        var reversedSequence = collection.reverse.apply(this); // super.reverse()
        reversedSequence.flip = function () { return collection.reverse(); };
        return reversedSequence;
      };
      flipSequence.has = function (key) { return collection.includes(key); };
      flipSequence.includes = function (key) { return collection.has(key); };
      flipSequence.cacheResult = cacheResultThrough;
      flipSequence.__iterateUncached = function(fn, reverse) {
        var this$1 = this;
    
        return collection.__iterate(function (v, k) { return fn(k, v, this$1) !== false; }, reverse);
      };
      flipSequence.__iteratorUncached = function(type, reverse) {
        if (type === ITERATE_ENTRIES) {
          var iterator = collection.__iterator(type, reverse);
          return new Iterator(function () {
            var step = iterator.next();
            if (!step.done) {
              var k = step.value[0];
              step.value[0] = step.value[1];
              step.value[1] = k;
            }
            return step;
          });
        }
        return collection.__iterator(
          type === ITERATE_VALUES ? ITERATE_KEYS : ITERATE_VALUES,
          reverse
        );
      };
      return flipSequence;
    }
    
    function mapFactory(collection, mapper, context) {
      var mappedSequence = makeSequence(collection);
      mappedSequence.size = collection.size;
      mappedSequence.has = function (key) { return collection.has(key); };
      mappedSequence.get = function (key, notSetValue) {
        var v = collection.get(key, NOT_SET);
        return v === NOT_SET
          ? notSetValue
          : mapper.call(context, v, key, collection);
      };
      mappedSequence.__iterateUncached = function(fn, reverse) {
        var this$1 = this;
    
        return collection.__iterate(
          function (v, k, c) { return fn(mapper.call(context, v, k, c), k, this$1) !== false; },
          reverse
        );
      };
      mappedSequence.__iteratorUncached = function(type, reverse) {
        var iterator = collection.__iterator(ITERATE_ENTRIES, reverse);
        return new Iterator(function () {
          var step = iterator.next();
          if (step.done) {
            return step;
          }
          var entry = step.value;
          var key = entry[0];
          return iteratorValue(
            type,
            key,
            mapper.call(context, entry[1], key, collection),
            step
          );
        });
      };
      return mappedSequence;
    }
    
    function reverseFactory(collection, useKeys) {
      var this$1 = this;
    
      var reversedSequence = makeSequence(collection);
      reversedSequence._iter = collection;
      reversedSequence.size = collection.size;
      reversedSequence.reverse = function () { return collection; };
      if (collection.flip) {
        reversedSequence.flip = function() {
          var flipSequence = flipFactory(collection);
          flipSequence.reverse = function () { return collection.flip(); };
          return flipSequence;
        };
      }
      reversedSequence.get = function (key, notSetValue) { return collection.get(useKeys ? key : -1 - key, notSetValue); };
      reversedSequence.has = function (key) { return collection.has(useKeys ? key : -1 - key); };
      reversedSequence.includes = function (value) { return collection.includes(value); };
      reversedSequence.cacheResult = cacheResultThrough;
      reversedSequence.__iterate = function(fn, reverse) {
        var this$1 = this;
    
        var i = 0;
        reverse && ensureSize(collection);
        return collection.__iterate(
          function (v, k) { return fn(v, useKeys ? k : reverse ? this$1.size - ++i : i++, this$1); },
          !reverse
        );
      };
      reversedSequence.__iterator = function (type, reverse) {
        var i = 0;
        reverse && ensureSize(collection);
        var iterator = collection.__iterator(ITERATE_ENTRIES, !reverse);
        return new Iterator(function () {
          var step = iterator.next();
          if (step.done) {
            return step;
          }
          var entry = step.value;
          return iteratorValue(
            type,
            useKeys ? entry[0] : reverse ? this$1.size - ++i : i++,
            entry[1],
            step
          );
        });
      };
      return reversedSequence;
    }
    
    function filterFactory(collection, predicate, context, useKeys) {
      var filterSequence = makeSequence(collection);
      if (useKeys) {
        filterSequence.has = function (key) {
          var v = collection.get(key, NOT_SET);
          return v !== NOT_SET && !!predicate.call(context, v, key, collection);
        };
        filterSequence.get = function (key, notSetValue) {
          var v = collection.get(key, NOT_SET);
          return v !== NOT_SET && predicate.call(context, v, key, collection)
            ? v
            : notSetValue;
        };
      }
      filterSequence.__iterateUncached = function(fn, reverse) {
        var this$1 = this;
    
        var iterations = 0;
        collection.__iterate(function (v, k, c) {
          if (predicate.call(context, v, k, c)) {
            iterations++;
            return fn(v, useKeys ? k : iterations - 1, this$1);
          }
        }, reverse);
        return iterations;
      };
      filterSequence.__iteratorUncached = function(type, reverse) {
        var iterator = collection.__iterator(ITERATE_ENTRIES, reverse);
        var iterations = 0;
        return new Iterator(function () {
          while (true) {
            var step = iterator.next();
            if (step.done) {
              return step;
            }
            var entry = step.value;
            var key = entry[0];
            var value = entry[1];
            if (predicate.call(context, value, key, collection)) {
              return iteratorValue(type, useKeys ? key : iterations++, value, step);
            }
          }
        });
      };
      return filterSequence;
    }
    
    function countByFactory(collection, grouper, context) {
      var groups = Map().asMutable();
      collection.__iterate(function (v, k) {
        groups.update(grouper.call(context, v, k, collection), 0, function (a) { return a + 1; });
      });
      return groups.asImmutable();
    }
    
    function groupByFactory(collection, grouper, context) {
      var isKeyedIter = isKeyed(collection);
      var groups = (isOrdered(collection) ? OrderedMap() : Map()).asMutable();
      collection.__iterate(function (v, k) {
        groups.update(
          grouper.call(context, v, k, collection),
          function (a) { return ((a = a || []), a.push(isKeyedIter ? [k, v] : v), a); }
        );
      });
      var coerce = collectionClass(collection);
      return groups.map(function (arr) { return reify(collection, coerce(arr)); });
    }
    
    function sliceFactory(collection, begin, end, useKeys) {
      var originalSize = collection.size;
    
      if (wholeSlice(begin, end, originalSize)) {
        return collection;
      }
    
      var resolvedBegin = resolveBegin(begin, originalSize);
      var resolvedEnd = resolveEnd(end, originalSize);
    
      // begin or end will be NaN if they were provided as negative numbers and
      // this collection's size is unknown. In that case, cache first so there is
      // a known size and these do not resolve to NaN.
      if (resolvedBegin !== resolvedBegin || resolvedEnd !== resolvedEnd) {
        return sliceFactory(collection.toSeq().cacheResult(), begin, end, useKeys);
      }
    
      // Note: resolvedEnd is undefined when the original sequence's length is
      // unknown and this slice did not supply an end and should contain all
      // elements after resolvedBegin.
      // In that case, resolvedSize will be NaN and sliceSize will remain undefined.
      var resolvedSize = resolvedEnd - resolvedBegin;
      var sliceSize;
      if (resolvedSize === resolvedSize) {
        sliceSize = resolvedSize < 0 ? 0 : resolvedSize;
      }
    
      var sliceSeq = makeSequence(collection);
    
      // If collection.size is undefined, the size of the realized sliceSeq is
      // unknown at this point unless the number of items to slice is 0
      sliceSeq.size =
        sliceSize === 0 ? sliceSize : (collection.size && sliceSize) || undefined;
    
      if (!useKeys && isSeq(collection) && sliceSize >= 0) {
        sliceSeq.get = function(index, notSetValue) {
          index = wrapIndex(this, index);
          return index >= 0 && index < sliceSize
            ? collection.get(index + resolvedBegin, notSetValue)
            : notSetValue;
        };
      }
    
      sliceSeq.__iterateUncached = function(fn, reverse) {
        var this$1 = this;
    
        if (sliceSize === 0) {
          return 0;
        }
        if (reverse) {
          return this.cacheResult().__iterate(fn, reverse);
        }
        var skipped = 0;
        var isSkipping = true;
        var iterations = 0;
        collection.__iterate(function (v, k) {
          if (!(isSkipping && (isSkipping = skipped++ < resolvedBegin))) {
            iterations++;
            return (
              fn(v, useKeys ? k : iterations - 1, this$1) !== false &&
              iterations !== sliceSize
            );
          }
        });
        return iterations;
      };
    
      sliceSeq.__iteratorUncached = function(type, reverse) {
        if (sliceSize !== 0 && reverse) {
          return this.cacheResult().__iterator(type, reverse);
        }
        // Don't bother instantiating parent iterator if taking 0.
        if (sliceSize === 0) {
          return new Iterator(iteratorDone);
        }
        var iterator = collection.__iterator(type, reverse);
        var skipped = 0;
        var iterations = 0;
        return new Iterator(function () {
          while (skipped++ < resolvedBegin) {
            iterator.next();
          }
          if (++iterations > sliceSize) {
            return iteratorDone();
          }
          var step = iterator.next();
          if (useKeys || type === ITERATE_VALUES || step.done) {
            return step;
          }
          if (type === ITERATE_KEYS) {
            return iteratorValue(type, iterations - 1, undefined, step);
          }
          return iteratorValue(type, iterations - 1, step.value[1], step);
        });
      };
    
      return sliceSeq;
    }
    
    function takeWhileFactory(collection, predicate, context) {
      var takeSequence = makeSequence(collection);
      takeSequence.__iterateUncached = function(fn, reverse) {
        var this$1 = this;
    
        if (reverse) {
          return this.cacheResult().__iterate(fn, reverse);
        }
        var iterations = 0;
        collection.__iterate(
          function (v, k, c) { return predicate.call(context, v, k, c) && ++iterations && fn(v, k, this$1); }
        );
        return iterations;
      };
      takeSequence.__iteratorUncached = function(type, reverse) {
        var this$1 = this;
    
        if (reverse) {
          return this.cacheResult().__iterator(type, reverse);
        }
        var iterator = collection.__iterator(ITERATE_ENTRIES, reverse);
        var iterating = true;
        return new Iterator(function () {
          if (!iterating) {
            return iteratorDone();
          }
          var step = iterator.next();
          if (step.done) {
            return step;
          }
          var entry = step.value;
          var k = entry[0];
          var v = entry[1];
          if (!predicate.call(context, v, k, this$1)) {
            iterating = false;
            return iteratorDone();
          }
          return type === ITERATE_ENTRIES ? step : iteratorValue(type, k, v, step);
        });
      };
      return takeSequence;
    }
    
    function skipWhileFactory(collection, predicate, context, useKeys) {
      var skipSequence = makeSequence(collection);
      skipSequence.__iterateUncached = function(fn, reverse) {
        var this$1 = this;
    
        if (reverse) {
          return this.cacheResult().__iterate(fn, reverse);
        }
        var isSkipping = true;
        var iterations = 0;
        collection.__iterate(function (v, k, c) {
          if (!(isSkipping && (isSkipping = predicate.call(context, v, k, c)))) {
            iterations++;
            return fn(v, useKeys ? k : iterations - 1, this$1);
          }
        });
        return iterations;
      };
      skipSequence.__iteratorUncached = function(type, reverse) {
        var this$1 = this;
    
        if (reverse) {
          return this.cacheResult().__iterator(type, reverse);
        }
        var iterator = collection.__iterator(ITERATE_ENTRIES, reverse);
        var skipping = true;
        var iterations = 0;
        return new Iterator(function () {
          var step;
          var k;
          var v;
          do {
            step = iterator.next();
            if (step.done) {
              if (useKeys || type === ITERATE_VALUES) {
                return step;
              }
              if (type === ITERATE_KEYS) {
                return iteratorValue(type, iterations++, undefined, step);
              }
              return iteratorValue(type, iterations++, step.value[1], step);
            }
            var entry = step.value;
            k = entry[0];
            v = entry[1];
            skipping && (skipping = predicate.call(context, v, k, this$1));
          } while (skipping);
          return type === ITERATE_ENTRIES ? step : iteratorValue(type, k, v, step);
        });
      };
      return skipSequence;
    }
    
    function concatFactory(collection, values) {
      var isKeyedCollection = isKeyed(collection);
      var iters = [collection]
        .concat(values)
        .map(function (v) {
          if (!isCollection(v)) {
            v = isKeyedCollection
              ? keyedSeqFromValue(v)
              : indexedSeqFromValue(Array.isArray(v) ? v : [v]);
          } else if (isKeyedCollection) {
            v = KeyedCollection(v);
          }
          return v;
        })
        .filter(function (v) { return v.size !== 0; });
    
      if (iters.length === 0) {
        return collection;
      }
    
      if (iters.length === 1) {
        var singleton = iters[0];
        if (
          singleton === collection ||
          (isKeyedCollection && isKeyed(singleton)) ||
          (isIndexed(collection) && isIndexed(singleton))
        ) {
          return singleton;
        }
      }
    
      var concatSeq = new ArraySeq(iters);
      if (isKeyedCollection) {
        concatSeq = concatSeq.toKeyedSeq();
      } else if (!isIndexed(collection)) {
        concatSeq = concatSeq.toSetSeq();
      }
      concatSeq = concatSeq.flatten(true);
      concatSeq.size = iters.reduce(function (sum, seq) {
        if (sum !== undefined) {
          var size = seq.size;
          if (size !== undefined) {
            return sum + size;
          }
        }
      }, 0);
      return concatSeq;
    }
    
    function flattenFactory(collection, depth, useKeys) {
      var flatSequence = makeSequence(collection);
      flatSequence.__iterateUncached = function(fn, reverse) {
        if (reverse) {
          return this.cacheResult().__iterate(fn, reverse);
        }
        var iterations = 0;
        var stopped = false;
        function flatDeep(iter, currentDepth) {
          iter.__iterate(function (v, k) {
            if ((!depth || currentDepth < depth) && isCollection(v)) {
              flatDeep(v, currentDepth + 1);
            } else {
              iterations++;
              if (fn(v, useKeys ? k : iterations - 1, flatSequence) === false) {
                stopped = true;
              }
            }
            return !stopped;
          }, reverse);
        }
        flatDeep(collection, 0);
        return iterations;
      };
      flatSequence.__iteratorUncached = function(type, reverse) {
        if (reverse) {
          return this.cacheResult().__iterator(type, reverse);
        }
        var iterator = collection.__iterator(type, reverse);
        var stack = [];
        var iterations = 0;
        return new Iterator(function () {
          while (iterator) {
            var step = iterator.next();
            if (step.done !== false) {
              iterator = stack.pop();
              continue;
            }
            var v = step.value;
            if (type === ITERATE_ENTRIES) {
              v = v[1];
            }
            if ((!depth || stack.length < depth) && isCollection(v)) {
              stack.push(iterator);
              iterator = v.__iterator(type, reverse);
            } else {
              return useKeys ? step : iteratorValue(type, iterations++, v, step);
            }
          }
          return iteratorDone();
        });
      };
      return flatSequence;
    }
    
    function flatMapFactory(collection, mapper, context) {
      var coerce = collectionClass(collection);
      return collection
        .toSeq()
        .map(function (v, k) { return coerce(mapper.call(context, v, k, collection)); })
        .flatten(true);
    }
    
    function interposeFactory(collection, separator) {
      var interposedSequence = makeSequence(collection);
      interposedSequence.size = collection.size && collection.size * 2 - 1;
      interposedSequence.__iterateUncached = function(fn, reverse) {
        var this$1 = this;
    
        var iterations = 0;
        collection.__iterate(
          function (v) { return (!iterations || fn(separator, iterations++, this$1) !== false) &&
            fn(v, iterations++, this$1) !== false; },
          reverse
        );
        return iterations;
      };
      interposedSequence.__iteratorUncached = function(type, reverse) {
        var iterator = collection.__iterator(ITERATE_VALUES, reverse);
        var iterations = 0;
        var step;
        return new Iterator(function () {
          if (!step || iterations % 2) {
            step = iterator.next();
            if (step.done) {
              return step;
            }
          }
          return iterations % 2
            ? iteratorValue(type, iterations++, separator)
            : iteratorValue(type, iterations++, step.value, step);
        });
      };
      return interposedSequence;
    }
    
    function sortFactory(collection, comparator, mapper) {
      if (!comparator) {
        comparator = defaultComparator;
      }
      var isKeyedCollection = isKeyed(collection);
      var index = 0;
      var entries = collection
        .toSeq()
        .map(function (v, k) { return [k, v, index++, mapper ? mapper(v, k, collection) : v]; })
        .valueSeq()
        .toArray();
      entries.sort(function (a, b) { return comparator(a[3], b[3]) || a[2] - b[2]; }).forEach(
        isKeyedCollection
          ? function (v, i) {
              entries[i].length = 2;
            }
          : function (v, i) {
              entries[i] = v[1];
            }
      );
      return isKeyedCollection
        ? KeyedSeq(entries)
        : isIndexed(collection) ? IndexedSeq(entries) : SetSeq(entries);
    }
    
    function maxFactory(collection, comparator, mapper) {
      if (!comparator) {
        comparator = defaultComparator;
      }
      if (mapper) {
        var entry = collection
          .toSeq()
          .map(function (v, k) { return [v, mapper(v, k, collection)]; })
          .reduce(function (a, b) { return (maxCompare(comparator, a[1], b[1]) ? b : a); });
        return entry && entry[0];
      }
      return collection.reduce(function (a, b) { return (maxCompare(comparator, a, b) ? b : a); });
    }
    
    function maxCompare(comparator, a, b) {
      var comp = comparator(b, a);
      // b is considered the new max if the comparator declares them equal, but
      // they are not equal and b is in fact a nullish value.
      return (
        (comp === 0 && b !== a && (b === undefined || b === null || b !== b)) ||
        comp > 0
      );
    }
    
    function zipWithFactory(keyIter, zipper, iters, zipAll) {
      var zipSequence = makeSequence(keyIter);
      var sizes = new ArraySeq(iters).map(function (i) { return i.size; });
      zipSequence.size = zipAll ? sizes.max() : sizes.min();
      // Note: this a generic base implementation of __iterate in terms of
      // __iterator which may be more generically useful in the future.
      zipSequence.__iterate = function(fn, reverse) {
        var this$1 = this;
    
        /* generic:
        var iterator = this.__iterator(ITERATE_ENTRIES, reverse);
        var step;
        var iterations = 0;
        while (!(step = iterator.next()).done) {
          iterations++;
          if (fn(step.value[1], step.value[0], this) === false) {
            break;
          }
        }
        return iterations;
        */
        // indexed:
        var iterator = this.__iterator(ITERATE_VALUES, reverse);
        var step;
        var iterations = 0;
        while (!(step = iterator.next()).done) {
          if (fn(step.value, iterations++, this$1) === false) {
            break;
          }
        }
        return iterations;
      };
      zipSequence.__iteratorUncached = function(type, reverse) {
        var iterators = iters.map(
          function (i) { return ((i = Collection(i)), getIterator(reverse ? i.reverse() : i)); }
        );
        var iterations = 0;
        var isDone = false;
        return new Iterator(function () {
          var steps;
          if (!isDone) {
            steps = iterators.map(function (i) { return i.next(); });
            isDone = zipAll ? steps.every(function (s) { return s.done; }) : steps.some(function (s) { return s.done; });
          }
          if (isDone) {
            return iteratorDone();
          }
          return iteratorValue(
            type,
            iterations++,
            zipper.apply(null, steps.map(function (s) { return s.value; }))
          );
        });
      };
      return zipSequence;
    }
    
    // #pragma Helper Functions
    
    function reify(iter, seq) {
      return iter === seq ? iter : isSeq(iter) ? seq : iter.constructor(seq);
    }
    
    function validateEntry(entry) {
      if (entry !== Object(entry)) {
        throw new TypeError('Expected [K, V] tuple: ' + entry);
      }
    }
    
    function collectionClass(collection) {
      return isKeyed(collection)
        ? KeyedCollection
        : isIndexed(collection) ? IndexedCollection : SetCollection;
    }
    
    function makeSequence(collection) {
      return Object.create(
        (isKeyed(collection)
          ? KeyedSeq
          : isIndexed(collection) ? IndexedSeq : SetSeq
        ).prototype
      );
    }
    
    function cacheResultThrough() {
      if (this._iter.cacheResult) {
        this._iter.cacheResult();
        this.size = this._iter.size;
        return this;
      }
      return Seq.prototype.cacheResult.call(this);
    }
    
    function defaultComparator(a, b) {
      if (a === undefined && b === undefined) {
        return 0;
      }
    
      if (a === undefined) {
        return 1;
      }
    
      if (b === undefined) {
        return -1;
      }
    
      return a > b ? 1 : a < b ? -1 : 0;
    }
    
    // http://jsperf.com/copy-array-inline
    function arrCopy(arr, offset) {
      offset = offset || 0;
      var len = Math.max(0, arr.length - offset);
      var newArr = new Array(len);
      for (var ii = 0; ii < len; ii++) {
        newArr[ii] = arr[ii + offset];
      }
      return newArr;
    }
    
    function invariant(condition, error) {
      if (!condition) { throw new Error(error); }
    }
    
    function assertNotInfinite(size) {
      invariant(
        size !== Infinity,
        'Cannot perform this action with an infinite size.'
      );
    }
    
    function coerceKeyPath(keyPath) {
      if (isArrayLike(keyPath) && typeof keyPath !== 'string') {
        return keyPath;
      }
      if (isOrdered(keyPath)) {
        return keyPath.toArray();
      }
      throw new TypeError(
        'Invalid keyPath: expected Ordered Collection or Array: ' + keyPath
      );
    }
    
    function isPlainObj(value) {
      return (
        value && (value.constructor === Object || value.constructor === undefined)
      );
    }
    
    /**
     * Returns true if the value is a potentially-persistent data structure, either
     * provided by Immutable.js or a plain Array or Object.
     */
    function isDataStructure(value) {
      return isImmutable(value) || Array.isArray(value) || isPlainObj(value);
    }
    
    /**
     * Converts a value to a string, adding quotes if a string was provided.
     */
    function quoteString(value) {
      try {
        return typeof value === 'string' ? JSON.stringify(value) : String(value);
      } catch (_ignoreError) {
        return JSON.stringify(value);
      }
    }
    
    function has(collection, key) {
      return isImmutable(collection)
        ? collection.has(key)
        : isDataStructure(collection) && hasOwnProperty.call(collection, key);
    }
    
    function get(collection, key, notSetValue) {
      return isImmutable(collection)
        ? collection.get(key, notSetValue)
        : !has(collection, key)
          ? notSetValue
          : typeof collection.get === 'function'
            ? collection.get(key)
            : collection[key];
    }
    
    function shallowCopy(from) {
      if (Array.isArray(from)) {
        return arrCopy(from);
      }
      var to = {};
      for (var key in from) {
        if (hasOwnProperty.call(from, key)) {
          to[key] = from[key];
        }
      }
      return to;
    }
    
    function remove(collection, key) {
      if (!isDataStructure(collection)) {
        throw new TypeError(
          'Cannot update non-data-structure value: ' + collection
        );
      }
      if (isImmutable(collection)) {
        if (!collection.remove) {
          throw new TypeError(
            'Cannot update immutable value without .remove() method: ' + collection
          );
        }
        return collection.remove(key);
      }
      if (!hasOwnProperty.call(collection, key)) {
        return collection;
      }
      var collectionCopy = shallowCopy(collection);
      if (Array.isArray(collectionCopy)) {
        collectionCopy.splice(key, 1);
      } else {
        delete collectionCopy[key];
      }
      return collectionCopy;
    }
    
    function set(collection, key, value) {
      if (!isDataStructure(collection)) {
        throw new TypeError(
          'Cannot update non-data-structure value: ' + collection
        );
      }
      if (isImmutable(collection)) {
        if (!collection.set) {
          throw new TypeError(
            'Cannot update immutable value without .set() method: ' + collection
          );
        }
        return collection.set(key, value);
      }
      if (hasOwnProperty.call(collection, key) && value === collection[key]) {
        return collection;
      }
      var collectionCopy = shallowCopy(collection);
      collectionCopy[key] = value;
      return collectionCopy;
    }
    
    function updateIn(collection, keyPath, notSetValue, updater) {
      if (!updater) {
        updater = notSetValue;
        notSetValue = undefined;
      }
      var updatedValue = updateInDeeply(
        isImmutable(collection),
        collection,
        coerceKeyPath(keyPath),
        0,
        notSetValue,
        updater
      );
      return updatedValue === NOT_SET ? notSetValue : updatedValue;
    }
    
    function updateInDeeply(
      inImmutable,
      existing,
      keyPath,
      i,
      notSetValue,
      updater
    ) {
      var wasNotSet = existing === NOT_SET;
      if (i === keyPath.length) {
        var existingValue = wasNotSet ? notSetValue : existing;
        var newValue = updater(existingValue);
        return newValue === existingValue ? existing : newValue;
      }
      if (!wasNotSet && !isDataStructure(existing)) {
        throw new TypeError(
          'Cannot update within non-data-structure value in path [' +
            keyPath.slice(0, i).map(quoteString) +
            ']: ' +
            existing
        );
      }
      var key = keyPath[i];
      var nextExisting = wasNotSet ? NOT_SET : get(existing, key, NOT_SET);
      var nextUpdated = updateInDeeply(
        nextExisting === NOT_SET ? inImmutable : isImmutable(nextExisting),
        nextExisting,
        keyPath,
        i + 1,
        notSetValue,
        updater
      );
      return nextUpdated === nextExisting
        ? existing
        : nextUpdated === NOT_SET
          ? remove(existing, key)
          : set(
              wasNotSet ? (inImmutable ? emptyMap() : {}) : existing,
              key,
              nextUpdated
            );
    }
    
    function setIn$1(collection, keyPath, value) {
      return updateIn(collection, keyPath, NOT_SET, function () { return value; });
    }
    
    function setIn$$1(keyPath, v) {
      return setIn$1(this, keyPath, v);
    }
    
    function removeIn(collection, keyPath) {
      return updateIn(collection, keyPath, function () { return NOT_SET; });
    }
    
    function deleteIn(keyPath) {
      return removeIn(this, keyPath);
    }
    
    function update$1(collection, key, notSetValue, updater) {
      return updateIn(collection, [key], notSetValue, updater);
    }
    
    function update$$1(key, notSetValue, updater) {
      return arguments.length === 1
        ? key(this)
        : update$1(this, key, notSetValue, updater);
    }
    
    function updateIn$1(keyPath, notSetValue, updater) {
      return updateIn(this, keyPath, notSetValue, updater);
    }
    
    function merge() {
      var iters = [], len = arguments.length;
      while ( len-- ) iters[ len ] = arguments[ len ];
    
      return mergeIntoKeyedWith(this, iters);
    }
    
    function mergeWith(merger) {
      var iters = [], len = arguments.length - 1;
      while ( len-- > 0 ) iters[ len ] = arguments[ len + 1 ];
    
      return mergeIntoKeyedWith(this, iters, merger);
    }
    
    function mergeIntoKeyedWith(collection, collections, merger) {
      var iters = [];
      for (var ii = 0; ii < collections.length; ii++) {
        var collection$1 = KeyedCollection(collections[ii]);
        if (collection$1.size !== 0) {
          iters.push(collection$1);
        }
      }
      if (iters.length === 0) {
        return collection;
      }
      if (collection.size === 0 && !collection.__ownerID && iters.length === 1) {
        return collection.constructor(iters[0]);
      }
      return collection.withMutations(function (collection) {
        var mergeIntoCollection = merger
          ? function (value, key) {
              update$1(
                collection,
                key,
                NOT_SET,
                function (oldVal) { return (oldVal === NOT_SET ? value : merger(oldVal, value, key)); }
              );
            }
          : function (value, key) {
              collection.set(key, value);
            };
        for (var ii = 0; ii < iters.length; ii++) {
          iters[ii].forEach(mergeIntoCollection);
        }
      });
    }
    
    function merge$1(collection) {
      var sources = [], len = arguments.length - 1;
      while ( len-- > 0 ) sources[ len ] = arguments[ len + 1 ];
    
      return mergeWithSources(collection, sources);
    }
    
    function mergeWith$1(merger, collection) {
      var sources = [], len = arguments.length - 2;
      while ( len-- > 0 ) sources[ len ] = arguments[ len + 2 ];
    
      return mergeWithSources(collection, sources, merger);
    }
    
    function mergeDeep$1(collection) {
      var sources = [], len = arguments.length - 1;
      while ( len-- > 0 ) sources[ len ] = arguments[ len + 1 ];
    
      return mergeDeepWithSources(collection, sources);
    }
    
    function mergeDeepWith$1(merger, collection) {
      var sources = [], len = arguments.length - 2;
      while ( len-- > 0 ) sources[ len ] = arguments[ len + 2 ];
    
      return mergeDeepWithSources(collection, sources, merger);
    }
    
    function mergeDeepWithSources(collection, sources, merger) {
      return mergeWithSources(collection, sources, deepMergerWith(merger));
    }
    
    function mergeWithSources(collection, sources, merger) {
      if (!isDataStructure(collection)) {
        throw new TypeError(
          'Cannot merge into non-data-structure value: ' + collection
        );
      }
      if (isImmutable(collection)) {
        return collection.mergeWith
          ? collection.mergeWith.apply(collection, [ merger ].concat( sources ))
          : collection.concat.apply(collection, sources);
      }
      var isArray = Array.isArray(collection);
      var merged = collection;
      var Collection$$1 = isArray ? IndexedCollection : KeyedCollection;
      var mergeItem = isArray
        ? function (value) {
            // Copy on write
            if (merged === collection) {
              merged = shallowCopy(merged);
            }
            merged.push(value);
          }
        : function (value, key) {
            var hasVal = hasOwnProperty.call(merged, key);
            var nextVal =
              hasVal && merger ? merger(merged[key], value, key) : value;
            if (!hasVal || nextVal !== merged[key]) {
              // Copy on write
              if (merged === collection) {
                merged = shallowCopy(merged);
              }
              merged[key] = nextVal;
            }
          };
      for (var i = 0; i < sources.length; i++) {
        Collection$$1(sources[i]).forEach(mergeItem);
      }
      return merged;
    }
    
    function deepMergerWith(merger) {
      function deepMerger(oldValue, newValue, key) {
        return isDataStructure(oldValue) && isDataStructure(newValue)
          ? mergeWithSources(oldValue, [newValue], deepMerger)
          : merger ? merger(oldValue, newValue, key) : newValue;
      }
      return deepMerger;
    }
    
    function mergeDeep() {
      var iters = [], len = arguments.length;
      while ( len-- ) iters[ len ] = arguments[ len ];
    
      return mergeDeepWithSources(this, iters);
    }
    
    function mergeDeepWith(merger) {
      var iters = [], len = arguments.length - 1;
      while ( len-- > 0 ) iters[ len ] = arguments[ len + 1 ];
    
      return mergeDeepWithSources(this, iters, merger);
    }
    
    function mergeIn(keyPath) {
      var iters = [], len = arguments.length - 1;
      while ( len-- > 0 ) iters[ len ] = arguments[ len + 1 ];
    
      return updateIn(this, keyPath, emptyMap(), function (m) { return mergeWithSources(m, iters); });
    }
    
    function mergeDeepIn(keyPath) {
      var iters = [], len = arguments.length - 1;
      while ( len-- > 0 ) iters[ len ] = arguments[ len + 1 ];
    
      return updateIn(this, keyPath, emptyMap(), function (m) { return mergeDeepWithSources(m, iters); }
      );
    }
    
    function withMutations(fn) {
      var mutable = this.asMutable();
      fn(mutable);
      return mutable.wasAltered() ? mutable.__ensureOwner(this.__ownerID) : this;
    }
    
    function asMutable() {
      return this.__ownerID ? this : this.__ensureOwner(new OwnerID());
    }
    
    function asImmutable() {
      return this.__ensureOwner();
    }
    
    function wasAltered() {
      return this.__altered;
    }
    
    var Map = (function (KeyedCollection$$1) {
      function Map(value) {
        return value === null || value === undefined
          ? emptyMap()
          : isMap(value) && !isOrdered(value)
            ? value
            : emptyMap().withMutations(function (map) {
                var iter = KeyedCollection$$1(value);
                assertNotInfinite(iter.size);
                iter.forEach(function (v, k) { return map.set(k, v); });
              });
      }
    
      if ( KeyedCollection$$1 ) Map.__proto__ = KeyedCollection$$1;
      Map.prototype = Object.create( KeyedCollection$$1 && KeyedCollection$$1.prototype );
      Map.prototype.constructor = Map;
    
      Map.of = function of () {
        var keyValues = [], len = arguments.length;
        while ( len-- ) keyValues[ len ] = arguments[ len ];
    
        return emptyMap().withMutations(function (map) {
          for (var i = 0; i < keyValues.length; i += 2) {
            if (i + 1 >= keyValues.length) {
              throw new Error('Missing value for key: ' + keyValues[i]);
            }
            map.set(keyValues[i], keyValues[i + 1]);
          }
        });
      };
    
      Map.prototype.toString = function toString () {
        return this.__toString('Map {', '}');
      };
    
      // @pragma Access
    
      Map.prototype.get = function get (k, notSetValue) {
        return this._root
          ? this._root.get(0, undefined, k, notSetValue)
          : notSetValue;
      };
    
      // @pragma Modification
    
      Map.prototype.set = function set (k, v) {
        return updateMap(this, k, v);
      };
    
      Map.prototype.remove = function remove (k) {
        return updateMap(this, k, NOT_SET);
      };
    
      Map.prototype.deleteAll = function deleteAll (keys) {
        var collection = Collection(keys);
    
        if (collection.size === 0) {
          return this;
        }
    
        return this.withMutations(function (map) {
          collection.forEach(function (key) { return map.remove(key); });
        });
      };
    
      Map.prototype.clear = function clear () {
        if (this.size === 0) {
          return this;
        }
        if (this.__ownerID) {
          this.size = 0;
          this._root = null;
          this.__hash = undefined;
          this.__altered = true;
          return this;
        }
        return emptyMap();
      };
    
      // @pragma Composition
    
      Map.prototype.sort = function sort (comparator) {
        // Late binding
        return OrderedMap(sortFactory(this, comparator));
      };
    
      Map.prototype.sortBy = function sortBy (mapper, comparator) {
        // Late binding
        return OrderedMap(sortFactory(this, comparator, mapper));
      };
    
      // @pragma Mutability
    
      Map.prototype.__iterator = function __iterator (type, reverse) {
        return new MapIterator(this, type, reverse);
      };
    
      Map.prototype.__iterate = function __iterate (fn, reverse) {
        var this$1 = this;
    
        var iterations = 0;
        this._root &&
          this._root.iterate(function (entry) {
            iterations++;
            return fn(entry[1], entry[0], this$1);
          }, reverse);
        return iterations;
      };
    
      Map.prototype.__ensureOwner = function __ensureOwner (ownerID) {
        if (ownerID === this.__ownerID) {
          return this;
        }
        if (!ownerID) {
          if (this.size === 0) {
            return emptyMap();
          }
          this.__ownerID = ownerID;
          this.__altered = false;
          return this;
        }
        return makeMap(this.size, this._root, ownerID, this.__hash);
      };
    
      return Map;
    }(KeyedCollection));
    
    function isMap(maybeMap) {
      return !!(maybeMap && maybeMap[IS_MAP_SENTINEL]);
    }
    
    Map.isMap = isMap;
    
    var IS_MAP_SENTINEL = '@@__IMMUTABLE_MAP__@@';
    
    var MapPrototype = Map.prototype;
    MapPrototype[IS_MAP_SENTINEL] = true;
    MapPrototype[DELETE] = MapPrototype.remove;
    MapPrototype.removeAll = MapPrototype.deleteAll;
    MapPrototype.concat = MapPrototype.merge;
    MapPrototype.setIn = setIn$$1;
    MapPrototype.removeIn = MapPrototype.deleteIn = deleteIn;
    MapPrototype.update = update$$1;
    MapPrototype.updateIn = updateIn$1;
    MapPrototype.merge = merge;
    MapPrototype.mergeWith = mergeWith;
    MapPrototype.mergeDeep = mergeDeep;
    MapPrototype.mergeDeepWith = mergeDeepWith;
    MapPrototype.mergeIn = mergeIn;
    MapPrototype.mergeDeepIn = mergeDeepIn;
    MapPrototype.withMutations = withMutations;
    MapPrototype.wasAltered = wasAltered;
    MapPrototype.asImmutable = asImmutable;
    MapPrototype['@@transducer/init'] = MapPrototype.asMutable = asMutable;
    MapPrototype['@@transducer/step'] = function(result, arr) {
      return result.set(arr[0], arr[1]);
    };
    MapPrototype['@@transducer/result'] = function(obj) {
      return obj.asImmutable();
    };
    
    // #pragma Trie Nodes
    
    var ArrayMapNode = function ArrayMapNode(ownerID, entries) {
      this.ownerID = ownerID;
      this.entries = entries;
    };
    
    ArrayMapNode.prototype.get = function get (shift, keyHash, key, notSetValue) {
      var entries = this.entries;
      for (var ii = 0, len = entries.length; ii < len; ii++) {
        if (is(key, entries[ii][0])) {
          return entries[ii][1];
        }
      }
      return notSetValue;
    };
    
    ArrayMapNode.prototype.update = function update$$1 (ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
      var removed = value === NOT_SET;
    
      var entries = this.entries;
      var idx = 0;
      var len = entries.length;
      for (; idx < len; idx++) {
        if (is(key, entries[idx][0])) {
          break;
        }
      }
      var exists = idx < len;
    
      if (exists ? entries[idx][1] === value : removed) {
        return this;
      }
    
      SetRef(didAlter);
      (removed || !exists) && SetRef(didChangeSize);
    
      if (removed && entries.length === 1) {
        return; // undefined
      }
    
      if (!exists && !removed && entries.length >= MAX_ARRAY_MAP_SIZE) {
        return createNodes(ownerID, entries, key, value);
      }
    
      var isEditable = ownerID && ownerID === this.ownerID;
      var newEntries = isEditable ? entries : arrCopy(entries);
    
      if (exists) {
        if (removed) {
          idx === len - 1
            ? newEntries.pop()
            : (newEntries[idx] = newEntries.pop());
        } else {
          newEntries[idx] = [key, value];
        }
      } else {
        newEntries.push([key, value]);
      }
    
      if (isEditable) {
        this.entries = newEntries;
        return this;
      }
    
      return new ArrayMapNode(ownerID, newEntries);
    };
    
    var BitmapIndexedNode = function BitmapIndexedNode(ownerID, bitmap, nodes) {
      this.ownerID = ownerID;
      this.bitmap = bitmap;
      this.nodes = nodes;
    };
    
    BitmapIndexedNode.prototype.get = function get (shift, keyHash, key, notSetValue) {
      if (keyHash === undefined) {
        keyHash = hash(key);
      }
      var bit = 1 << ((shift === 0 ? keyHash : keyHash >>> shift) & MASK);
      var bitmap = this.bitmap;
      return (bitmap & bit) === 0
        ? notSetValue
        : this.nodes[popCount(bitmap & (bit - 1))].get(
            shift + SHIFT,
            keyHash,
            key,
            notSetValue
          );
    };
    
    BitmapIndexedNode.prototype.update = function update$$1 (ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
      if (keyHash === undefined) {
        keyHash = hash(key);
      }
      var keyHashFrag = (shift === 0 ? keyHash : keyHash >>> shift) & MASK;
      var bit = 1 << keyHashFrag;
      var bitmap = this.bitmap;
      var exists = (bitmap & bit) !== 0;
    
      if (!exists && value === NOT_SET) {
        return this;
      }
    
      var idx = popCount(bitmap & (bit - 1));
      var nodes = this.nodes;
      var node = exists ? nodes[idx] : undefined;
      var newNode = updateNode(
        node,
        ownerID,
        shift + SHIFT,
        keyHash,
        key,
        value,
        didChangeSize,
        didAlter
      );
    
      if (newNode === node) {
        return this;
      }
    
      if (!exists && newNode && nodes.length >= MAX_BITMAP_INDEXED_SIZE) {
        return expandNodes(ownerID, nodes, bitmap, keyHashFrag, newNode);
      }
    
      if (
        exists &&
        !newNode &&
        nodes.length === 2 &&
        isLeafNode(nodes[idx ^ 1])
      ) {
        return nodes[idx ^ 1];
      }
    
      if (exists && newNode && nodes.length === 1 && isLeafNode(newNode)) {
        return newNode;
      }
    
      var isEditable = ownerID && ownerID === this.ownerID;
      var newBitmap = exists ? (newNode ? bitmap : bitmap ^ bit) : bitmap | bit;
      var newNodes = exists
        ? newNode
          ? setAt(nodes, idx, newNode, isEditable)
          : spliceOut(nodes, idx, isEditable)
        : spliceIn(nodes, idx, newNode, isEditable);
    
      if (isEditable) {
        this.bitmap = newBitmap;
        this.nodes = newNodes;
        return this;
      }
    
      return new BitmapIndexedNode(ownerID, newBitmap, newNodes);
    };
    
    var HashArrayMapNode = function HashArrayMapNode(ownerID, count, nodes) {
      this.ownerID = ownerID;
      this.count = count;
      this.nodes = nodes;
    };
    
    HashArrayMapNode.prototype.get = function get (shift, keyHash, key, notSetValue) {
      if (keyHash === undefined) {
        keyHash = hash(key);
      }
      var idx = (shift === 0 ? keyHash : keyHash >>> shift) & MASK;
      var node = this.nodes[idx];
      return node
        ? node.get(shift + SHIFT, keyHash, key, notSetValue)
        : notSetValue;
    };
    
    HashArrayMapNode.prototype.update = function update$$1 (ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
      if (keyHash === undefined) {
        keyHash = hash(key);
      }
      var idx = (shift === 0 ? keyHash : keyHash >>> shift) & MASK;
      var removed = value === NOT_SET;
      var nodes = this.nodes;
      var node = nodes[idx];
    
      if (removed && !node) {
        return this;
      }
    
      var newNode = updateNode(
        node,
        ownerID,
        shift + SHIFT,
        keyHash,
        key,
        value,
        didChangeSize,
        didAlter
      );
      if (newNode === node) {
        return this;
      }
    
      var newCount = this.count;
      if (!node) {
        newCount++;
      } else if (!newNode) {
        newCount--;
        if (newCount < MIN_HASH_ARRAY_MAP_SIZE) {
          return packNodes(ownerID, nodes, newCount, idx);
        }
      }
    
      var isEditable = ownerID && ownerID === this.ownerID;
      var newNodes = setAt(nodes, idx, newNode, isEditable);
    
      if (isEditable) {
        this.count = newCount;
        this.nodes = newNodes;
        return this;
      }
    
      return new HashArrayMapNode(ownerID, newCount, newNodes);
    };
    
    var HashCollisionNode = function HashCollisionNode(ownerID, keyHash, entries) {
      this.ownerID = ownerID;
      this.keyHash = keyHash;
      this.entries = entries;
    };
    
    HashCollisionNode.prototype.get = function get (shift, keyHash, key, notSetValue) {
      var entries = this.entries;
      for (var ii = 0, len = entries.length; ii < len; ii++) {
        if (is(key, entries[ii][0])) {
          return entries[ii][1];
        }
      }
      return notSetValue;
    };
    
    HashCollisionNode.prototype.update = function update$$1 (ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
      if (keyHash === undefined) {
        keyHash = hash(key);
      }
    
      var removed = value === NOT_SET;
    
      if (keyHash !== this.keyHash) {
        if (removed) {
          return this;
        }
        SetRef(didAlter);
        SetRef(didChangeSize);
        return mergeIntoNode(this, ownerID, shift, keyHash, [key, value]);
      }
    
      var entries = this.entries;
      var idx = 0;
      var len = entries.length;
      for (; idx < len; idx++) {
        if (is(key, entries[idx][0])) {
          break;
        }
      }
      var exists = idx < len;
    
      if (exists ? entries[idx][1] === value : removed) {
        return this;
      }
    
      SetRef(didAlter);
      (removed || !exists) && SetRef(didChangeSize);
    
      if (removed && len === 2) {
        return new ValueNode(ownerID, this.keyHash, entries[idx ^ 1]);
      }
    
      var isEditable = ownerID && ownerID === this.ownerID;
      var newEntries = isEditable ? entries : arrCopy(entries);
    
      if (exists) {
        if (removed) {
          idx === len - 1
            ? newEntries.pop()
            : (newEntries[idx] = newEntries.pop());
        } else {
          newEntries[idx] = [key, value];
        }
      } else {
        newEntries.push([key, value]);
      }
    
      if (isEditable) {
        this.entries = newEntries;
        return this;
      }
    
      return new HashCollisionNode(ownerID, this.keyHash, newEntries);
    };
    
    var ValueNode = function ValueNode(ownerID, keyHash, entry) {
      this.ownerID = ownerID;
      this.keyHash = keyHash;
      this.entry = entry;
    };
    
    ValueNode.prototype.get = function get (shift, keyHash, key, notSetValue) {
      return is(key, this.entry[0]) ? this.entry[1] : notSetValue;
    };
    
    ValueNode.prototype.update = function update$$1 (ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
      var removed = value === NOT_SET;
      var keyMatch = is(key, this.entry[0]);
      if (keyMatch ? value === this.entry[1] : removed) {
        return this;
      }
    
      SetRef(didAlter);
    
      if (removed) {
        SetRef(didChangeSize);
        return; // undefined
      }
    
      if (keyMatch) {
        if (ownerID && ownerID === this.ownerID) {
          this.entry[1] = value;
          return this;
        }
        return new ValueNode(ownerID, this.keyHash, [key, value]);
      }
    
      SetRef(didChangeSize);
      return mergeIntoNode(this, ownerID, shift, hash(key), [key, value]);
    };
    
    // #pragma Iterators
    
    ArrayMapNode.prototype.iterate = HashCollisionNode.prototype.iterate = function(
      fn,
      reverse
    ) {
      var entries = this.entries;
      for (var ii = 0, maxIndex = entries.length - 1; ii <= maxIndex; ii++) {
        if (fn(entries[reverse ? maxIndex - ii : ii]) === false) {
          return false;
        }
      }
    };
    
    BitmapIndexedNode.prototype.iterate = HashArrayMapNode.prototype.iterate = function(
      fn,
      reverse
    ) {
      var nodes = this.nodes;
      for (var ii = 0, maxIndex = nodes.length - 1; ii <= maxIndex; ii++) {
        var node = nodes[reverse ? maxIndex - ii : ii];
        if (node && node.iterate(fn, reverse) === false) {
          return false;
        }
      }
    };
    
    // eslint-disable-next-line no-unused-vars
    ValueNode.prototype.iterate = function(fn, reverse) {
      return fn(this.entry);
    };
    
    var MapIterator = (function (Iterator$$1) {
      function MapIterator(map, type, reverse) {
        this._type = type;
        this._reverse = reverse;
        this._stack = map._root && mapIteratorFrame(map._root);
      }
    
      if ( Iterator$$1 ) MapIterator.__proto__ = Iterator$$1;
      MapIterator.prototype = Object.create( Iterator$$1 && Iterator$$1.prototype );
      MapIterator.prototype.constructor = MapIterator;
    
      MapIterator.prototype.next = function next () {
        var this$1 = this;
    
        var type = this._type;
        var stack = this._stack;
        while (stack) {
          var node = stack.node;
          var index = stack.index++;
          var maxIndex = (void 0);
          if (node.entry) {
            if (index === 0) {
              return mapIteratorValue(type, node.entry);
            }
          } else if (node.entries) {
            maxIndex = node.entries.length - 1;
            if (index <= maxIndex) {
              return mapIteratorValue(
                type,
                node.entries[this$1._reverse ? maxIndex - index : index]
              );
            }
          } else {
            maxIndex = node.nodes.length - 1;
            if (index <= maxIndex) {
              var subNode = node.nodes[this$1._reverse ? maxIndex - index : index];
              if (subNode) {
                if (subNode.entry) {
                  return mapIteratorValue(type, subNode.entry);
                }
                stack = this$1._stack = mapIteratorFrame(subNode, stack);
              }
              continue;
            }
          }
          stack = this$1._stack = this$1._stack.__prev;
        }
        return iteratorDone();
      };
    
      return MapIterator;
    }(Iterator));
    
    function mapIteratorValue(type, entry) {
      return iteratorValue(type, entry[0], entry[1]);
    }
    
    function mapIteratorFrame(node, prev) {
      return {
        node: node,
        index: 0,
        __prev: prev
      };
    }
    
    function makeMap(size, root, ownerID, hash$$1) {
      var map = Object.create(MapPrototype);
      map.size = size;
      map._root = root;
      map.__ownerID = ownerID;
      map.__hash = hash$$1;
      map.__altered = false;
      return map;
    }
    
    var EMPTY_MAP;
    function emptyMap() {
      return EMPTY_MAP || (EMPTY_MAP = makeMap(0));
    }
    
    function updateMap(map, k, v) {
      var newRoot;
      var newSize;
      if (!map._root) {
        if (v === NOT_SET) {
          return map;
        }
        newSize = 1;
        newRoot = new ArrayMapNode(map.__ownerID, [[k, v]]);
      } else {
        var didChangeSize = MakeRef(CHANGE_LENGTH);
        var didAlter = MakeRef(DID_ALTER);
        newRoot = updateNode(
          map._root,
          map.__ownerID,
          0,
          undefined,
          k,
          v,
          didChangeSize,
          didAlter
        );
        if (!didAlter.value) {
          return map;
        }
        newSize = map.size + (didChangeSize.value ? (v === NOT_SET ? -1 : 1) : 0);
      }
      if (map.__ownerID) {
        map.size = newSize;
        map._root = newRoot;
        map.__hash = undefined;
        map.__altered = true;
        return map;
      }
      return newRoot ? makeMap(newSize, newRoot) : emptyMap();
    }
    
    function updateNode(
      node,
      ownerID,
      shift,
      keyHash,
      key,
      value,
      didChangeSize,
      didAlter
    ) {
      if (!node) {
        if (value === NOT_SET) {
          return node;
        }
        SetRef(didAlter);
        SetRef(didChangeSize);
        return new ValueNode(ownerID, keyHash, [key, value]);
      }
      return node.update(
        ownerID,
        shift,
        keyHash,
        key,
        value,
        didChangeSize,
        didAlter
      );
    }
    
    function isLeafNode(node) {
      return (
        node.constructor === ValueNode || node.constructor === HashCollisionNode
      );
    }
    
    function mergeIntoNode(node, ownerID, shift, keyHash, entry) {
      if (node.keyHash === keyHash) {
        return new HashCollisionNode(ownerID, keyHash, [node.entry, entry]);
      }
    
      var idx1 = (shift === 0 ? node.keyHash : node.keyHash >>> shift) & MASK;
      var idx2 = (shift === 0 ? keyHash : keyHash >>> shift) & MASK;
    
      var newNode;
      var nodes =
        idx1 === idx2
          ? [mergeIntoNode(node, ownerID, shift + SHIFT, keyHash, entry)]
          : ((newNode = new ValueNode(ownerID, keyHash, entry)),
            idx1 < idx2 ? [node, newNode] : [newNode, node]);
    
      return new BitmapIndexedNode(ownerID, (1 << idx1) | (1 << idx2), nodes);
    }
    
    function createNodes(ownerID, entries, key, value) {
      if (!ownerID) {
        ownerID = new OwnerID();
      }
      var node = new ValueNode(ownerID, hash(key), [key, value]);
      for (var ii = 0; ii < entries.length; ii++) {
        var entry = entries[ii];
        node = node.update(ownerID, 0, undefined, entry[0], entry[1]);
      }
      return node;
    }
    
    function packNodes(ownerID, nodes, count, excluding) {
      var bitmap = 0;
      var packedII = 0;
      var packedNodes = new Array(count);
      for (var ii = 0, bit = 1, len = nodes.length; ii < len; ii++, bit <<= 1) {
        var node = nodes[ii];
        if (node !== undefined && ii !== excluding) {
          bitmap |= bit;
          packedNodes[packedII++] = node;
        }
      }
      return new BitmapIndexedNode(ownerID, bitmap, packedNodes);
    }
    
    function expandNodes(ownerID, nodes, bitmap, including, node) {
      var count = 0;
      var expandedNodes = new Array(SIZE);
      for (var ii = 0; bitmap !== 0; ii++, bitmap >>>= 1) {
        expandedNodes[ii] = bitmap & 1 ? nodes[count++] : undefined;
      }
      expandedNodes[including] = node;
      return new HashArrayMapNode(ownerID, count + 1, expandedNodes);
    }
    
    function popCount(x) {
      x -= (x >> 1) & 0x55555555;
      x = (x & 0x33333333) + ((x >> 2) & 0x33333333);
      x = (x + (x >> 4)) & 0x0f0f0f0f;
      x += x >> 8;
      x += x >> 16;
      return x & 0x7f;
    }
    
    function setAt(array, idx, val, canEdit) {
      var newArray = canEdit ? array : arrCopy(array);
      newArray[idx] = val;
      return newArray;
    }
    
    function spliceIn(array, idx, val, canEdit) {
      var newLen = array.length + 1;
      if (canEdit && idx + 1 === newLen) {
        array[idx] = val;
        return array;
      }
      var newArray = new Array(newLen);
      var after = 0;
      for (var ii = 0; ii < newLen; ii++) {
        if (ii === idx) {
          newArray[ii] = val;
          after = -1;
        } else {
          newArray[ii] = array[ii + after];
        }
      }
      return newArray;
    }
    
    function spliceOut(array, idx, canEdit) {
      var newLen = array.length - 1;
      if (canEdit && idx === newLen) {
        array.pop();
        return array;
      }
      var newArray = new Array(newLen);
      var after = 0;
      for (var ii = 0; ii < newLen; ii++) {
        if (ii === idx) {
          after = 1;
        }
        newArray[ii] = array[ii + after];
      }
      return newArray;
    }
    
    var MAX_ARRAY_MAP_SIZE = SIZE / 4;
    var MAX_BITMAP_INDEXED_SIZE = SIZE / 2;
    var MIN_HASH_ARRAY_MAP_SIZE = SIZE / 4;
    
    var List = (function (IndexedCollection$$1) {
      function List(value) {
        var empty = emptyList();
        if (value === null || value === undefined) {
          return empty;
        }
        if (isList(value)) {
          return value;
        }
        var iter = IndexedCollection$$1(value);
        var size = iter.size;
        if (size === 0) {
          return empty;
        }
        assertNotInfinite(size);
        if (size > 0 && size < SIZE) {
          return makeList(0, size, SHIFT, null, new VNode(iter.toArray()));
        }
        return empty.withMutations(function (list) {
          list.setSize(size);
          iter.forEach(function (v, i) { return list.set(i, v); });
        });
      }
    
      if ( IndexedCollection$$1 ) List.__proto__ = IndexedCollection$$1;
      List.prototype = Object.create( IndexedCollection$$1 && IndexedCollection$$1.prototype );
      List.prototype.constructor = List;
    
      List.of = function of (/*...values*/) {
        return this(arguments);
      };
    
      List.prototype.toString = function toString () {
        return this.__toString('List [', ']');
      };
    
      // @pragma Access
    
      List.prototype.get = function get (index, notSetValue) {
        index = wrapIndex(this, index);
        if (index >= 0 && index < this.size) {
          index += this._origin;
          var node = listNodeFor(this, index);
          return node && node.array[index & MASK];
        }
        return notSetValue;
      };
    
      // @pragma Modification
    
      List.prototype.set = function set (index, value) {
        return updateList(this, index, value);
      };
    
      List.prototype.remove = function remove (index) {
        return !this.has(index)
          ? this
          : index === 0
            ? this.shift()
            : index === this.size - 1 ? this.pop() : this.splice(index, 1);
      };
    
      List.prototype.insert = function insert (index, value) {
        return this.splice(index, 0, value);
      };
    
      List.prototype.clear = function clear () {
        if (this.size === 0) {
          return this;
        }
        if (this.__ownerID) {
          this.size = this._origin = this._capacity = 0;
          this._level = SHIFT;
          this._root = this._tail = null;
          this.__hash = undefined;
          this.__altered = true;
          return this;
        }
        return emptyList();
      };
    
      List.prototype.push = function push (/*...values*/) {
        var values = arguments;
        var oldSize = this.size;
        return this.withMutations(function (list) {
          setListBounds(list, 0, oldSize + values.length);
          for (var ii = 0; ii < values.length; ii++) {
            list.set(oldSize + ii, values[ii]);
          }
        });
      };
    
      List.prototype.pop = function pop () {
        return setListBounds(this, 0, -1);
      };
    
      List.prototype.unshift = function unshift (/*...values*/) {
        var values = arguments;
        return this.withMutations(function (list) {
          setListBounds(list, -values.length);
          for (var ii = 0; ii < values.length; ii++) {
            list.set(ii, values[ii]);
          }
        });
      };
    
      List.prototype.shift = function shift () {
        return setListBounds(this, 1);
      };
    
      // @pragma Composition
    
      List.prototype.concat = function concat (/*...collections*/) {
        var arguments$1 = arguments;
    
        var seqs = [];
        for (var i = 0; i < arguments.length; i++) {
          var argument = arguments$1[i];
          var seq = IndexedCollection$$1(
            typeof argument !== 'string' && hasIterator(argument)
              ? argument
              : [argument]
          );
          if (seq.size !== 0) {
            seqs.push(seq);
          }
        }
        if (seqs.length === 0) {
          return this;
        }
        if (this.size === 0 && !this.__ownerID && seqs.length === 1) {
          return this.constructor(seqs[0]);
        }
        return this.withMutations(function (list) {
          seqs.forEach(function (seq) { return seq.forEach(function (value) { return list.push(value); }); });
        });
      };
    
      List.prototype.setSize = function setSize (size) {
        return setListBounds(this, 0, size);
      };
    
      // @pragma Iteration
    
      List.prototype.slice = function slice (begin, end) {
        var size = this.size;
        if (wholeSlice(begin, end, size)) {
          return this;
        }
        return setListBounds(
          this,
          resolveBegin(begin, size),
          resolveEnd(end, size)
        );
      };
    
      List.prototype.__iterator = function __iterator (type, reverse) {
        var index = reverse ? this.size : 0;
        var values = iterateList(this, reverse);
        return new Iterator(function () {
          var value = values();
          return value === DONE
            ? iteratorDone()
            : iteratorValue(type, reverse ? --index : index++, value);
        });
      };
    
      List.prototype.__iterate = function __iterate (fn, reverse) {
        var this$1 = this;
    
        var index = reverse ? this.size : 0;
        var values = iterateList(this, reverse);
        var value;
        while ((value = values()) !== DONE) {
          if (fn(value, reverse ? --index : index++, this$1) === false) {
            break;
          }
        }
        return index;
      };
    
      List.prototype.__ensureOwner = function __ensureOwner (ownerID) {
        if (ownerID === this.__ownerID) {
          return this;
        }
        if (!ownerID) {
          if (this.size === 0) {
            return emptyList();
          }
          this.__ownerID = ownerID;
          this.__altered = false;
          return this;
        }
        return makeList(
          this._origin,
          this._capacity,
          this._level,
          this._root,
          this._tail,
          ownerID,
          this.__hash
        );
      };
    
      return List;
    }(IndexedCollection));
    
    function isList(maybeList) {
      return !!(maybeList && maybeList[IS_LIST_SENTINEL]);
    }
    
    List.isList = isList;
    
    var IS_LIST_SENTINEL = '@@__IMMUTABLE_LIST__@@';
    
    var ListPrototype = List.prototype;
    ListPrototype[IS_LIST_SENTINEL] = true;
    ListPrototype[DELETE] = ListPrototype.remove;
    ListPrototype.merge = ListPrototype.concat;
    ListPrototype.setIn = setIn$$1;
    ListPrototype.deleteIn = ListPrototype.removeIn = deleteIn;
    ListPrototype.update = update$$1;
    ListPrototype.updateIn = updateIn$1;
    ListPrototype.mergeIn = mergeIn;
    ListPrototype.mergeDeepIn = mergeDeepIn;
    ListPrototype.withMutations = withMutations;
    ListPrototype.wasAltered = wasAltered;
    ListPrototype.asImmutable = asImmutable;
    ListPrototype['@@transducer/init'] = ListPrototype.asMutable = asMutable;
    ListPrototype['@@transducer/step'] = function(result, arr) {
      return result.push(arr);
    };
    ListPrototype['@@transducer/result'] = function(obj) {
      return obj.asImmutable();
    };
    
    var VNode = function VNode(array, ownerID) {
      this.array = array;
      this.ownerID = ownerID;
    };
    
    // TODO: seems like these methods are very similar
    
    VNode.prototype.removeBefore = function removeBefore (ownerID, level, index) {
      if (index === level ? 1 << level : 0 || this.array.length === 0) {
        return this;
      }
      var originIndex = (index >>> level) & MASK;
      if (originIndex >= this.array.length) {
        return new VNode([], ownerID);
      }
      var removingFirst = originIndex === 0;
      var newChild;
      if (level > 0) {
        var oldChild = this.array[originIndex];
        newChild =
          oldChild && oldChild.removeBefore(ownerID, level - SHIFT, index);
        if (newChild === oldChild && removingFirst) {
          return this;
        }
      }
      if (removingFirst && !newChild) {
        return this;
      }
      var editable = editableVNode(this, ownerID);
      if (!removingFirst) {
        for (var ii = 0; ii < originIndex; ii++) {
          editable.array[ii] = undefined;
        }
      }
      if (newChild) {
        editable.array[originIndex] = newChild;
      }
      return editable;
    };
    
    VNode.prototype.removeAfter = function removeAfter (ownerID, level, index) {
      if (index === (level ? 1 << level : 0) || this.array.length === 0) {
        return this;
      }
      var sizeIndex = ((index - 1) >>> level) & MASK;
      if (sizeIndex >= this.array.length) {
        return this;
      }
    
      var newChild;
      if (level > 0) {
        var oldChild = this.array[sizeIndex];
        newChild =
          oldChild && oldChild.removeAfter(ownerID, level - SHIFT, index);
        if (newChild === oldChild && sizeIndex === this.array.length - 1) {
          return this;
        }
      }
    
      var editable = editableVNode(this, ownerID);
      editable.array.splice(sizeIndex + 1);
      if (newChild) {
        editable.array[sizeIndex] = newChild;
      }
      return editable;
    };
    
    var DONE = {};
    
    function iterateList(list, reverse) {
      var left = list._origin;
      var right = list._capacity;
      var tailPos = getTailOffset(right);
      var tail = list._tail;
    
      return iterateNodeOrLeaf(list._root, list._level, 0);
    
      function iterateNodeOrLeaf(node, level, offset) {
        return level === 0
          ? iterateLeaf(node, offset)
          : iterateNode(node, level, offset);
      }
    
      function iterateLeaf(node, offset) {
        var array = offset === tailPos ? tail && tail.array : node && node.array;
        var from = offset > left ? 0 : left - offset;
        var to = right - offset;
        if (to > SIZE) {
          to = SIZE;
        }
        return function () {
          if (from === to) {
            return DONE;
          }
          var idx = reverse ? --to : from++;
          return array && array[idx];
        };
      }
    
      function iterateNode(node, level, offset) {
        var values;
        var array = node && node.array;
        var from = offset > left ? 0 : (left - offset) >> level;
        var to = ((right - offset) >> level) + 1;
        if (to > SIZE) {
          to = SIZE;
        }
        return function () {
          while (true) {
            if (values) {
              var value = values();
              if (value !== DONE) {
                return value;
              }
              values = null;
            }
            if (from === to) {
              return DONE;
            }
            var idx = reverse ? --to : from++;
            values = iterateNodeOrLeaf(
              array && array[idx],
              level - SHIFT,
              offset + (idx << level)
            );
          }
        };
      }
    }
    
    function makeList(origin, capacity, level, root, tail, ownerID, hash) {
      var list = Object.create(ListPrototype);
      list.size = capacity - origin;
      list._origin = origin;
      list._capacity = capacity;
      list._level = level;
      list._root = root;
      list._tail = tail;
      list.__ownerID = ownerID;
      list.__hash = hash;
      list.__altered = false;
      return list;
    }
    
    var EMPTY_LIST;
    function emptyList() {
      return EMPTY_LIST || (EMPTY_LIST = makeList(0, 0, SHIFT));
    }
    
    function updateList(list, index, value) {
      index = wrapIndex(list, index);
    
      if (index !== index) {
        return list;
      }
    
      if (index >= list.size || index < 0) {
        return list.withMutations(function (list) {
          index < 0
            ? setListBounds(list, index).set(0, value)
            : setListBounds(list, 0, index + 1).set(index, value);
        });
      }
    
      index += list._origin;
    
      var newTail = list._tail;
      var newRoot = list._root;
      var didAlter = MakeRef(DID_ALTER);
      if (index >= getTailOffset(list._capacity)) {
        newTail = updateVNode(newTail, list.__ownerID, 0, index, value, didAlter);
      } else {
        newRoot = updateVNode(
          newRoot,
          list.__ownerID,
          list._level,
          index,
          value,
          didAlter
        );
      }
    
      if (!didAlter.value) {
        return list;
      }
    
      if (list.__ownerID) {
        list._root = newRoot;
        list._tail = newTail;
        list.__hash = undefined;
        list.__altered = true;
        return list;
      }
      return makeList(list._origin, list._capacity, list._level, newRoot, newTail);
    }
    
    function updateVNode(node, ownerID, level, index, value, didAlter) {
      var idx = (index >>> level) & MASK;
      var nodeHas = node && idx < node.array.length;
      if (!nodeHas && value === undefined) {
        return node;
      }
    
      var newNode;
    
      if (level > 0) {
        var lowerNode = node && node.array[idx];
        var newLowerNode = updateVNode(
          lowerNode,
          ownerID,
          level - SHIFT,
          index,
          value,
          didAlter
        );
        if (newLowerNode === lowerNode) {
          return node;
        }
        newNode = editableVNode(node, ownerID);
        newNode.array[idx] = newLowerNode;
        return newNode;
      }
    
      if (nodeHas && node.array[idx] === value) {
        return node;
      }
    
      SetRef(didAlter);
    
      newNode = editableVNode(node, ownerID);
      if (value === undefined && idx === newNode.array.length - 1) {
        newNode.array.pop();
      } else {
        newNode.array[idx] = value;
      }
      return newNode;
    }
    
    function editableVNode(node, ownerID) {
      if (ownerID && node && ownerID === node.ownerID) {
        return node;
      }
      return new VNode(node ? node.array.slice() : [], ownerID);
    }
    
    function listNodeFor(list, rawIndex) {
      if (rawIndex >= getTailOffset(list._capacity)) {
        return list._tail;
      }
      if (rawIndex < 1 << (list._level + SHIFT)) {
        var node = list._root;
        var level = list._level;
        while (node && level > 0) {
          node = node.array[(rawIndex >>> level) & MASK];
          level -= SHIFT;
        }
        return node;
      }
    }
    
    function setListBounds(list, begin, end) {
      // Sanitize begin & end using this shorthand for ToInt32(argument)
      // http://www.ecma-international.org/ecma-262/6.0/#sec-toint32
      if (begin !== undefined) {
        begin |= 0;
      }
      if (end !== undefined) {
        end |= 0;
      }
      var owner = list.__ownerID || new OwnerID();
      var oldOrigin = list._origin;
      var oldCapacity = list._capacity;
      var newOrigin = oldOrigin + begin;
      var newCapacity =
        end === undefined
          ? oldCapacity
          : end < 0 ? oldCapacity + end : oldOrigin + end;
      if (newOrigin === oldOrigin && newCapacity === oldCapacity) {
        return list;
      }
    
      // If it's going to end after it starts, it's empty.
      if (newOrigin >= newCapacity) {
        return list.clear();
      }
    
      var newLevel = list._level;
      var newRoot = list._root;
    
      // New origin might need creating a higher root.
      var offsetShift = 0;
      while (newOrigin + offsetShift < 0) {
        newRoot = new VNode(
          newRoot && newRoot.array.length ? [undefined, newRoot] : [],
          owner
        );
        newLevel += SHIFT;
        offsetShift += 1 << newLevel;
      }
      if (offsetShift) {
        newOrigin += offsetShift;
        oldOrigin += offsetShift;
        newCapacity += offsetShift;
        oldCapacity += offsetShift;
      }
    
      var oldTailOffset = getTailOffset(oldCapacity);
      var newTailOffset = getTailOffset(newCapacity);
    
      // New size might need creating a higher root.
      while (newTailOffset >= 1 << (newLevel + SHIFT)) {
        newRoot = new VNode(
          newRoot && newRoot.array.length ? [newRoot] : [],
          owner
        );
        newLevel += SHIFT;
      }
    
      // Locate or create the new tail.
      var oldTail = list._tail;
      var newTail =
        newTailOffset < oldTailOffset
          ? listNodeFor(list, newCapacity - 1)
          : newTailOffset > oldTailOffset ? new VNode([], owner) : oldTail;
    
      // Merge Tail into tree.
      if (
        oldTail &&
        newTailOffset > oldTailOffset &&
        newOrigin < oldCapacity &&
        oldTail.array.length
      ) {
        newRoot = editableVNode(newRoot, owner);
        var node = newRoot;
        for (var level = newLevel; level > SHIFT; level -= SHIFT) {
          var idx = (oldTailOffset >>> level) & MASK;
          node = node.array[idx] = editableVNode(node.array[idx], owner);
        }
        node.array[(oldTailOffset >>> SHIFT) & MASK] = oldTail;
      }
    
      // If the size has been reduced, there's a chance the tail needs to be trimmed.
      if (newCapacity < oldCapacity) {
        newTail = newTail && newTail.removeAfter(owner, 0, newCapacity);
      }
    
      // If the new origin is within the tail, then we do not need a root.
      if (newOrigin >= newTailOffset) {
        newOrigin -= newTailOffset;
        newCapacity -= newTailOffset;
        newLevel = SHIFT;
        newRoot = null;
        newTail = newTail && newTail.removeBefore(owner, 0, newOrigin);
    
        // Otherwise, if the root has been trimmed, garbage collect.
      } else if (newOrigin > oldOrigin || newTailOffset < oldTailOffset) {
        offsetShift = 0;
    
        // Identify the new top root node of the subtree of the old root.
        while (newRoot) {
          var beginIndex = (newOrigin >>> newLevel) & MASK;
          if ((beginIndex !== newTailOffset >>> newLevel) & MASK) {
            break;
          }
          if (beginIndex) {
            offsetShift += (1 << newLevel) * beginIndex;
          }
          newLevel -= SHIFT;
          newRoot = newRoot.array[beginIndex];
        }
    
        // Trim the new sides of the new root.
        if (newRoot && newOrigin > oldOrigin) {
          newRoot = newRoot.removeBefore(owner, newLevel, newOrigin - offsetShift);
        }
        if (newRoot && newTailOffset < oldTailOffset) {
          newRoot = newRoot.removeAfter(
            owner,
            newLevel,
            newTailOffset - offsetShift
          );
        }
        if (offsetShift) {
          newOrigin -= offsetShift;
          newCapacity -= offsetShift;
        }
      }
    
      if (list.__ownerID) {
        list.size = newCapacity - newOrigin;
        list._origin = newOrigin;
        list._capacity = newCapacity;
        list._level = newLevel;
        list._root = newRoot;
        list._tail = newTail;
        list.__hash = undefined;
        list.__altered = true;
        return list;
      }
      return makeList(newOrigin, newCapacity, newLevel, newRoot, newTail);
    }
    
    function getTailOffset(size) {
      return size < SIZE ? 0 : ((size - 1) >>> SHIFT) << SHIFT;
    }
    
    var OrderedMap = (function (Map$$1) {
      function OrderedMap(value) {
        return value === null || value === undefined
          ? emptyOrderedMap()
          : isOrderedMap(value)
            ? value
            : emptyOrderedMap().withMutations(function (map) {
                var iter = KeyedCollection(value);
                assertNotInfinite(iter.size);
                iter.forEach(function (v, k) { return map.set(k, v); });
              });
      }
    
      if ( Map$$1 ) OrderedMap.__proto__ = Map$$1;
      OrderedMap.prototype = Object.create( Map$$1 && Map$$1.prototype );
      OrderedMap.prototype.constructor = OrderedMap;
    
      OrderedMap.of = function of (/*...values*/) {
        return this(arguments);
      };
    
      OrderedMap.prototype.toString = function toString () {
        return this.__toString('OrderedMap {', '}');
      };
    
      // @pragma Access
    
      OrderedMap.prototype.get = function get (k, notSetValue) {
        var index = this._map.get(k);
        return index !== undefined ? this._list.get(index)[1] : notSetValue;
      };
    
      // @pragma Modification
    
      OrderedMap.prototype.clear = function clear () {
        if (this.size === 0) {
          return this;
        }
        if (this.__ownerID) {
          this.size = 0;
          this._map.clear();
          this._list.clear();
          return this;
        }
        return emptyOrderedMap();
      };
    
      OrderedMap.prototype.set = function set (k, v) {
        return updateOrderedMap(this, k, v);
      };
    
      OrderedMap.prototype.remove = function remove (k) {
        return updateOrderedMap(this, k, NOT_SET);
      };
    
      OrderedMap.prototype.wasAltered = function wasAltered () {
        return this._map.wasAltered() || this._list.wasAltered();
      };
    
      OrderedMap.prototype.__iterate = function __iterate (fn, reverse) {
        var this$1 = this;
    
        return this._list.__iterate(
          function (entry) { return entry && fn(entry[1], entry[0], this$1); },
          reverse
        );
      };
    
      OrderedMap.prototype.__iterator = function __iterator (type, reverse) {
        return this._list.fromEntrySeq().__iterator(type, reverse);
      };
    
      OrderedMap.prototype.__ensureOwner = function __ensureOwner (ownerID) {
        if (ownerID === this.__ownerID) {
          return this;
        }
        var newMap = this._map.__ensureOwner(ownerID);
        var newList = this._list.__ensureOwner(ownerID);
        if (!ownerID) {
          if (this.size === 0) {
            return emptyOrderedMap();
          }
          this.__ownerID = ownerID;
          this._map = newMap;
          this._list = newList;
          return this;
        }
        return makeOrderedMap(newMap, newList, ownerID, this.__hash);
      };
    
      return OrderedMap;
    }(Map));
    
    function isOrderedMap(maybeOrderedMap) {
      return isMap(maybeOrderedMap) && isOrdered(maybeOrderedMap);
    }
    
    OrderedMap.isOrderedMap = isOrderedMap;
    
    OrderedMap.prototype[IS_ORDERED_SENTINEL] = true;
    OrderedMap.prototype[DELETE] = OrderedMap.prototype.remove;
    
    function makeOrderedMap(map, list, ownerID, hash) {
      var omap = Object.create(OrderedMap.prototype);
      omap.size = map ? map.size : 0;
      omap._map = map;
      omap._list = list;
      omap.__ownerID = ownerID;
      omap.__hash = hash;
      return omap;
    }
    
    var EMPTY_ORDERED_MAP;
    function emptyOrderedMap() {
      return (
        EMPTY_ORDERED_MAP ||
        (EMPTY_ORDERED_MAP = makeOrderedMap(emptyMap(), emptyList()))
      );
    }
    
    function updateOrderedMap(omap, k, v) {
      var map = omap._map;
      var list = omap._list;
      var i = map.get(k);
      var has = i !== undefined;
      var newMap;
      var newList;
      if (v === NOT_SET) {
        // removed
        if (!has) {
          return omap;
        }
        if (list.size >= SIZE && list.size >= map.size * 2) {
          newList = list.filter(function (entry, idx) { return entry !== undefined && i !== idx; });
          newMap = newList
            .toKeyedSeq()
            .map(function (entry) { return entry[0]; })
            .flip()
            .toMap();
          if (omap.__ownerID) {
            newMap.__ownerID = newList.__ownerID = omap.__ownerID;
          }
        } else {
          newMap = map.remove(k);
          newList = i === list.size - 1 ? list.pop() : list.set(i, undefined);
        }
      } else if (has) {
        if (v === list.get(i)[1]) {
          return omap;
        }
        newMap = map;
        newList = list.set(i, [k, v]);
      } else {
        newMap = map.set(k, list.size);
        newList = list.set(list.size, [k, v]);
      }
      if (omap.__ownerID) {
        omap.size = newMap.size;
        omap._map = newMap;
        omap._list = newList;
        omap.__hash = undefined;
        return omap;
      }
      return makeOrderedMap(newMap, newList);
    }
    
    var Stack = (function (IndexedCollection$$1) {
      function Stack(value) {
        return value === null || value === undefined
          ? emptyStack()
          : isStack(value) ? value : emptyStack().pushAll(value);
      }
    
      if ( IndexedCollection$$1 ) Stack.__proto__ = IndexedCollection$$1;
      Stack.prototype = Object.create( IndexedCollection$$1 && IndexedCollection$$1.prototype );
      Stack.prototype.constructor = Stack;
    
      Stack.of = function of (/*...values*/) {
        return this(arguments);
      };
    
      Stack.prototype.toString = function toString () {
        return this.__toString('Stack [', ']');
      };
    
      // @pragma Access
    
      Stack.prototype.get = function get (index, notSetValue) {
        var head = this._head;
        index = wrapIndex(this, index);
        while (head && index--) {
          head = head.next;
        }
        return head ? head.value : notSetValue;
      };
    
      Stack.prototype.peek = function peek () {
        return this._head && this._head.value;
      };
    
      // @pragma Modification
    
      Stack.prototype.push = function push (/*...values*/) {
        var arguments$1 = arguments;
    
        if (arguments.length === 0) {
          return this;
        }
        var newSize = this.size + arguments.length;
        var head = this._head;
        for (var ii = arguments.length - 1; ii >= 0; ii--) {
          head = {
            value: arguments$1[ii],
            next: head
          };
        }
        if (this.__ownerID) {
          this.size = newSize;
          this._head = head;
          this.__hash = undefined;
          this.__altered = true;
          return this;
        }
        return makeStack(newSize, head);
      };
    
      Stack.prototype.pushAll = function pushAll (iter) {
        iter = IndexedCollection$$1(iter);
        if (iter.size === 0) {
          return this;
        }
        if (this.size === 0 && isStack(iter)) {
          return iter;
        }
        assertNotInfinite(iter.size);
        var newSize = this.size;
        var head = this._head;
        iter.__iterate(function (value) {
          newSize++;
          head = {
            value: value,
            next: head
          };
        }, /* reverse */ true);
        if (this.__ownerID) {
          this.size = newSize;
          this._head = head;
          this.__hash = undefined;
          this.__altered = true;
          return this;
        }
        return makeStack(newSize, head);
      };
    
      Stack.prototype.pop = function pop () {
        return this.slice(1);
      };
    
      Stack.prototype.clear = function clear () {
        if (this.size === 0) {
          return this;
        }
        if (this.__ownerID) {
          this.size = 0;
          this._head = undefined;
          this.__hash = undefined;
          this.__altered = true;
          return this;
        }
        return emptyStack();
      };
    
      Stack.prototype.slice = function slice (begin, end) {
        if (wholeSlice(begin, end, this.size)) {
          return this;
        }
        var resolvedBegin = resolveBegin(begin, this.size);
        var resolvedEnd = resolveEnd(end, this.size);
        if (resolvedEnd !== this.size) {
          // super.slice(begin, end);
          return IndexedCollection$$1.prototype.slice.call(this, begin, end);
        }
        var newSize = this.size - resolvedBegin;
        var head = this._head;
        while (resolvedBegin--) {
          head = head.next;
        }
        if (this.__ownerID) {
          this.size = newSize;
          this._head = head;
          this.__hash = undefined;
          this.__altered = true;
          return this;
        }
        return makeStack(newSize, head);
      };
    
      // @pragma Mutability
    
      Stack.prototype.__ensureOwner = function __ensureOwner (ownerID) {
        if (ownerID === this.__ownerID) {
          return this;
        }
        if (!ownerID) {
          if (this.size === 0) {
            return emptyStack();
          }
          this.__ownerID = ownerID;
          this.__altered = false;
          return this;
        }
        return makeStack(this.size, this._head, ownerID, this.__hash);
      };
    
      // @pragma Iteration
    
      Stack.prototype.__iterate = function __iterate (fn, reverse) {
        var this$1 = this;
    
        if (reverse) {
          return new ArraySeq(this.toArray()).__iterate(
            function (v, k) { return fn(v, k, this$1); },
            reverse
          );
        }
        var iterations = 0;
        var node = this._head;
        while (node) {
          if (fn(node.value, iterations++, this$1) === false) {
            break;
          }
          node = node.next;
        }
        return iterations;
      };
    
      Stack.prototype.__iterator = function __iterator (type, reverse) {
        if (reverse) {
          return new ArraySeq(this.toArray()).__iterator(type, reverse);
        }
        var iterations = 0;
        var node = this._head;
        return new Iterator(function () {
          if (node) {
            var value = node.value;
            node = node.next;
            return iteratorValue(type, iterations++, value);
          }
          return iteratorDone();
        });
      };
    
      return Stack;
    }(IndexedCollection));
    
    function isStack(maybeStack) {
      return !!(maybeStack && maybeStack[IS_STACK_SENTINEL]);
    }
    
    Stack.isStack = isStack;
    
    var IS_STACK_SENTINEL = '@@__IMMUTABLE_STACK__@@';
    
    var StackPrototype = Stack.prototype;
    StackPrototype[IS_STACK_SENTINEL] = true;
    StackPrototype.shift = StackPrototype.pop;
    StackPrototype.unshift = StackPrototype.push;
    StackPrototype.unshiftAll = StackPrototype.pushAll;
    StackPrototype.withMutations = withMutations;
    StackPrototype.wasAltered = wasAltered;
    StackPrototype.asImmutable = asImmutable;
    StackPrototype['@@transducer/init'] = StackPrototype.asMutable = asMutable;
    StackPrototype['@@transducer/step'] = function(result, arr) {
      return result.unshift(arr);
    };
    StackPrototype['@@transducer/result'] = function(obj) {
      return obj.asImmutable();
    };
    
    function makeStack(size, head, ownerID, hash) {
      var map = Object.create(StackPrototype);
      map.size = size;
      map._head = head;
      map.__ownerID = ownerID;
      map.__hash = hash;
      map.__altered = false;
      return map;
    }
    
    var EMPTY_STACK;
    function emptyStack() {
      return EMPTY_STACK || (EMPTY_STACK = makeStack(0));
    }
    
    function deepEqual(a, b) {
      if (a === b) {
        return true;
      }
    
      if (
        !isCollection(b) ||
        (a.size !== undefined && b.size !== undefined && a.size !== b.size) ||
        (a.__hash !== undefined &&
          b.__hash !== undefined &&
          a.__hash !== b.__hash) ||
        isKeyed(a) !== isKeyed(b) ||
        isIndexed(a) !== isIndexed(b) ||
        isOrdered(a) !== isOrdered(b)
      ) {
        return false;
      }
    
      if (a.size === 0 && b.size === 0) {
        return true;
      }
    
      var notAssociative = !isAssociative(a);
    
      if (isOrdered(a)) {
        var entries = a.entries();
        return (
          b.every(function (v, k) {
            var entry = entries.next().value;
            return entry && is(entry[1], v) && (notAssociative || is(entry[0], k));
          }) && entries.next().done
        );
      }
    
      var flipped = false;
    
      if (a.size === undefined) {
        if (b.size === undefined) {
          if (typeof a.cacheResult === 'function') {
            a.cacheResult();
          }
        } else {
          flipped = true;
          var _ = a;
          a = b;
          b = _;
        }
      }
    
      var allEqual = true;
      var bSize = b.__iterate(function (v, k) {
        if (
          notAssociative
            ? !a.has(v)
            : flipped ? !is(v, a.get(k, NOT_SET)) : !is(a.get(k, NOT_SET), v)
        ) {
          allEqual = false;
          return false;
        }
      });
    
      return allEqual && a.size === bSize;
    }
    
    /**
     * Contributes additional methods to a constructor
     */
    function mixin(ctor, methods) {
      var keyCopier = function (key) {
        ctor.prototype[key] = methods[key];
      };
      Object.keys(methods).forEach(keyCopier);
      Object.getOwnPropertySymbols &&
        Object.getOwnPropertySymbols(methods).forEach(keyCopier);
      return ctor;
    }
    
    function toJS(value) {
      return isDataStructure(value)
        ? Seq(value)
            .map(toJS)
            .toJSON()
        : value;
    }
    
    var Set = (function (SetCollection$$1) {
      function Set(value) {
        return value === null || value === undefined
          ? emptySet()
          : isSet(value) && !isOrdered(value)
            ? value
            : emptySet().withMutations(function (set) {
                var iter = SetCollection$$1(value);
                assertNotInfinite(iter.size);
                iter.forEach(function (v) { return set.add(v); });
              });
      }
    
      if ( SetCollection$$1 ) Set.__proto__ = SetCollection$$1;
      Set.prototype = Object.create( SetCollection$$1 && SetCollection$$1.prototype );
      Set.prototype.constructor = Set;
    
      Set.of = function of (/*...values*/) {
        return this(arguments);
      };
    
      Set.fromKeys = function fromKeys (value) {
        return this(KeyedCollection(value).keySeq());
      };
    
      Set.intersect = function intersect (sets) {
        sets = Collection(sets).toArray();
        return sets.length
          ? SetPrototype.intersect.apply(Set(sets.pop()), sets)
          : emptySet();
      };
    
      Set.union = function union (sets) {
        sets = Collection(sets).toArray();
        return sets.length
          ? SetPrototype.union.apply(Set(sets.pop()), sets)
          : emptySet();
      };
    
      Set.prototype.toString = function toString () {
        return this.__toString('Set {', '}');
      };
    
      // @pragma Access
    
      Set.prototype.has = function has (value) {
        return this._map.has(value);
      };
    
      // @pragma Modification
    
      Set.prototype.add = function add (value) {
        return updateSet(this, this._map.set(value, value));
      };
    
      Set.prototype.remove = function remove (value) {
        return updateSet(this, this._map.remove(value));
      };
    
      Set.prototype.clear = function clear () {
        return updateSet(this, this._map.clear());
      };
    
      // @pragma Composition
    
      Set.prototype.union = function union () {
        var iters = [], len = arguments.length;
        while ( len-- ) iters[ len ] = arguments[ len ];
    
        iters = iters.filter(function (x) { return x.size !== 0; });
        if (iters.length === 0) {
          return this;
        }
        if (this.size === 0 && !this.__ownerID && iters.length === 1) {
          return this.constructor(iters[0]);
        }
        return this.withMutations(function (set) {
          for (var ii = 0; ii < iters.length; ii++) {
            SetCollection$$1(iters[ii]).forEach(function (value) { return set.add(value); });
          }
        });
      };
    
      Set.prototype.intersect = function intersect () {
        var iters = [], len = arguments.length;
        while ( len-- ) iters[ len ] = arguments[ len ];
    
        if (iters.length === 0) {
          return this;
        }
        iters = iters.map(function (iter) { return SetCollection$$1(iter); });
        var toRemove = [];
        this.forEach(function (value) {
          if (!iters.every(function (iter) { return iter.includes(value); })) {
            toRemove.push(value);
          }
        });
        return this.withMutations(function (set) {
          toRemove.forEach(function (value) {
            set.remove(value);
          });
        });
      };
    
      Set.prototype.subtract = function subtract () {
        var iters = [], len = arguments.length;
        while ( len-- ) iters[ len ] = arguments[ len ];
    
        if (iters.length === 0) {
          return this;
        }
        iters = iters.map(function (iter) { return SetCollection$$1(iter); });
        var toRemove = [];
        this.forEach(function (value) {
          if (iters.some(function (iter) { return iter.includes(value); })) {
            toRemove.push(value);
          }
        });
        return this.withMutations(function (set) {
          toRemove.forEach(function (value) {
            set.remove(value);
          });
        });
      };
    
      Set.prototype.sort = function sort (comparator) {
        // Late binding
        return OrderedSet(sortFactory(this, comparator));
      };
    
      Set.prototype.sortBy = function sortBy (mapper, comparator) {
        // Late binding
        return OrderedSet(sortFactory(this, comparator, mapper));
      };
    
      Set.prototype.wasAltered = function wasAltered () {
        return this._map.wasAltered();
      };
    
      Set.prototype.__iterate = function __iterate (fn, reverse) {
        var this$1 = this;
    
        return this._map.__iterate(function (k) { return fn(k, k, this$1); }, reverse);
      };
    
      Set.prototype.__iterator = function __iterator (type, reverse) {
        return this._map.__iterator(type, reverse);
      };
    
      Set.prototype.__ensureOwner = function __ensureOwner (ownerID) {
        if (ownerID === this.__ownerID) {
          return this;
        }
        var newMap = this._map.__ensureOwner(ownerID);
        if (!ownerID) {
          if (this.size === 0) {
            return this.__empty();
          }
          this.__ownerID = ownerID;
          this._map = newMap;
          return this;
        }
        return this.__make(newMap, ownerID);
      };
    
      return Set;
    }(SetCollection));
    
    function isSet(maybeSet) {
      return !!(maybeSet && maybeSet[IS_SET_SENTINEL]);
    }
    
    Set.isSet = isSet;
    
    var IS_SET_SENTINEL = '@@__IMMUTABLE_SET__@@';
    
    var SetPrototype = Set.prototype;
    SetPrototype[IS_SET_SENTINEL] = true;
    SetPrototype[DELETE] = SetPrototype.remove;
    SetPrototype.merge = SetPrototype.concat = SetPrototype.union;
    SetPrototype.withMutations = withMutations;
    SetPrototype.asImmutable = asImmutable;
    SetPrototype['@@transducer/init'] = SetPrototype.asMutable = asMutable;
    SetPrototype['@@transducer/step'] = function(result, arr) {
      return result.add(arr);
    };
    SetPrototype['@@transducer/result'] = function(obj) {
      return obj.asImmutable();
    };
    
    SetPrototype.__empty = emptySet;
    SetPrototype.__make = makeSet;
    
    function updateSet(set, newMap) {
      if (set.__ownerID) {
        set.size = newMap.size;
        set._map = newMap;
        return set;
      }
      return newMap === set._map
        ? set
        : newMap.size === 0 ? set.__empty() : set.__make(newMap);
    }
    
    function makeSet(map, ownerID) {
      var set = Object.create(SetPrototype);
      set.size = map ? map.size : 0;
      set._map = map;
      set.__ownerID = ownerID;
      return set;
    }
    
    var EMPTY_SET;
    function emptySet() {
      return EMPTY_SET || (EMPTY_SET = makeSet(emptyMap()));
    }
    
    /**
     * Returns a lazy seq of nums from start (inclusive) to end
     * (exclusive), by step, where start defaults to 0, step to 1, and end to
     * infinity. When start is equal to end, returns empty list.
     */
    var Range = (function (IndexedSeq$$1) {
      function Range(start, end, step) {
        if (!(this instanceof Range)) {
          return new Range(start, end, step);
        }
        invariant(step !== 0, 'Cannot step a Range by 0');
        start = start || 0;
        if (end === undefined) {
          end = Infinity;
        }
        step = step === undefined ? 1 : Math.abs(step);
        if (end < start) {
          step = -step;
        }
        this._start = start;
        this._end = end;
        this._step = step;
        this.size = Math.max(0, Math.ceil((end - start) / step - 1) + 1);
        if (this.size === 0) {
          if (EMPTY_RANGE) {
            return EMPTY_RANGE;
          }
          EMPTY_RANGE = this;
        }
      }
    
      if ( IndexedSeq$$1 ) Range.__proto__ = IndexedSeq$$1;
      Range.prototype = Object.create( IndexedSeq$$1 && IndexedSeq$$1.prototype );
      Range.prototype.constructor = Range;
    
      Range.prototype.toString = function toString () {
        if (this.size === 0) {
          return 'Range []';
        }
        return (
          'Range [ ' +
          this._start +
          '...' +
          this._end +
          (this._step !== 1 ? ' by ' + this._step : '') +
          ' ]'
        );
      };
    
      Range.prototype.get = function get (index, notSetValue) {
        return this.has(index)
          ? this._start + wrapIndex(this, index) * this._step
          : notSetValue;
      };
    
      Range.prototype.includes = function includes (searchValue) {
        var possibleIndex = (searchValue - this._start) / this._step;
        return (
          possibleIndex >= 0 &&
          possibleIndex < this.size &&
          possibleIndex === Math.floor(possibleIndex)
        );
      };
    
      Range.prototype.slice = function slice (begin, end) {
        if (wholeSlice(begin, end, this.size)) {
          return this;
        }
        begin = resolveBegin(begin, this.size);
        end = resolveEnd(end, this.size);
        if (end <= begin) {
          return new Range(0, 0);
        }
        return new Range(
          this.get(begin, this._end),
          this.get(end, this._end),
          this._step
        );
      };
    
      Range.prototype.indexOf = function indexOf (searchValue) {
        var offsetValue = searchValue - this._start;
        if (offsetValue % this._step === 0) {
          var index = offsetValue / this._step;
          if (index >= 0 && index < this.size) {
            return index;
          }
        }
        return -1;
      };
    
      Range.prototype.lastIndexOf = function lastIndexOf (searchValue) {
        return this.indexOf(searchValue);
      };
    
      Range.prototype.__iterate = function __iterate (fn, reverse) {
        var this$1 = this;
    
        var size = this.size;
        var step = this._step;
        var value = reverse ? this._start + (size - 1) * step : this._start;
        var i = 0;
        while (i !== size) {
          if (fn(value, reverse ? size - ++i : i++, this$1) === false) {
            break;
          }
          value += reverse ? -step : step;
        }
        return i;
      };
    
      Range.prototype.__iterator = function __iterator (type, reverse) {
        var size = this.size;
        var step = this._step;
        var value = reverse ? this._start + (size - 1) * step : this._start;
        var i = 0;
        return new Iterator(function () {
          if (i === size) {
            return iteratorDone();
          }
          var v = value;
          value += reverse ? -step : step;
          return iteratorValue(type, reverse ? size - ++i : i++, v);
        });
      };
    
      Range.prototype.equals = function equals (other) {
        return other instanceof Range
          ? this._start === other._start &&
              this._end === other._end &&
              this._step === other._step
          : deepEqual(this, other);
      };
    
      return Range;
    }(IndexedSeq));
    
    var EMPTY_RANGE;
    
    function getIn$1(collection, searchKeyPath, notSetValue) {
      var keyPath = coerceKeyPath(searchKeyPath);
      var i = 0;
      while (i !== keyPath.length) {
        collection = get(collection, keyPath[i++], NOT_SET);
        if (collection === NOT_SET) {
          return notSetValue;
        }
      }
      return collection;
    }
    
    function getIn$$1(searchKeyPath, notSetValue) {
      return getIn$1(this, searchKeyPath, notSetValue);
    }
    
    function hasIn$1(collection, keyPath) {
      return getIn$1(collection, keyPath, NOT_SET) !== NOT_SET;
    }
    
    function hasIn$$1(searchKeyPath) {
      return hasIn$1(this, searchKeyPath);
    }
    
    function toObject() {
      assertNotInfinite(this.size);
      var object = {};
      this.__iterate(function (v, k) {
        object[k] = v;
      });
      return object;
    }
    
    // Note: all of these methods are deprecated.
    Collection.isIterable = isCollection;
    Collection.isKeyed = isKeyed;
    Collection.isIndexed = isIndexed;
    Collection.isAssociative = isAssociative;
    Collection.isOrdered = isOrdered;
    
    Collection.Iterator = Iterator;
    
    mixin(Collection, {
      // ### Conversion to other types
    
      toArray: function toArray() {
        assertNotInfinite(this.size);
        var array = new Array(this.size || 0);
        var useTuples = isKeyed(this);
        var i = 0;
        this.__iterate(function (v, k) {
          // Keyed collections produce an array of tuples.
          array[i++] = useTuples ? [k, v] : v;
        });
        return array;
      },
    
      toIndexedSeq: function toIndexedSeq() {
        return new ToIndexedSequence(this);
      },
    
      toJS: function toJS$1() {
        return toJS(this);
      },
    
      toKeyedSeq: function toKeyedSeq() {
        return new ToKeyedSequence(this, true);
      },
    
      toMap: function toMap() {
        // Use Late Binding here to solve the circular dependency.
        return Map(this.toKeyedSeq());
      },
    
      toObject: toObject,
    
      toOrderedMap: function toOrderedMap() {
        // Use Late Binding here to solve the circular dependency.
        return OrderedMap(this.toKeyedSeq());
      },
    
      toOrderedSet: function toOrderedSet() {
        // Use Late Binding here to solve the circular dependency.
        return OrderedSet(isKeyed(this) ? this.valueSeq() : this);
      },
    
      toSet: function toSet() {
        // Use Late Binding here to solve the circular dependency.
        return Set(isKeyed(this) ? this.valueSeq() : this);
      },
    
      toSetSeq: function toSetSeq() {
        return new ToSetSequence(this);
      },
    
      toSeq: function toSeq() {
        return isIndexed(this)
          ? this.toIndexedSeq()
          : isKeyed(this) ? this.toKeyedSeq() : this.toSetSeq();
      },
    
      toStack: function toStack() {
        // Use Late Binding here to solve the circular dependency.
        return Stack(isKeyed(this) ? this.valueSeq() : this);
      },
    
      toList: function toList() {
        // Use Late Binding here to solve the circular dependency.
        return List(isKeyed(this) ? this.valueSeq() : this);
      },
    
      // ### Common JavaScript methods and properties
    
      toString: function toString() {
        return '[Collection]';
      },
    
      __toString: function __toString(head, tail) {
        if (this.size === 0) {
          return head + tail;
        }
        return (
          head +
          ' ' +
          this.toSeq()
            .map(this.__toStringMapper)
            .join(', ') +
          ' ' +
          tail
        );
      },
    
      // ### ES6 Collection methods (ES6 Array and Map)
    
      concat: function concat() {
        var values = [], len = arguments.length;
        while ( len-- ) values[ len ] = arguments[ len ];
    
        return reify(this, concatFactory(this, values));
      },
    
      includes: function includes(searchValue) {
        return this.some(function (value) { return is(value, searchValue); });
      },
    
      entries: function entries() {
        return this.__iterator(ITERATE_ENTRIES);
      },
    
      every: function every(predicate, context) {
        assertNotInfinite(this.size);
        var returnValue = true;
        this.__iterate(function (v, k, c) {
          if (!predicate.call(context, v, k, c)) {
            returnValue = false;
            return false;
          }
        });
        return returnValue;
      },
    
      filter: function filter(predicate, context) {
        return reify(this, filterFactory(this, predicate, context, true));
      },
    
      find: function find(predicate, context, notSetValue) {
        var entry = this.findEntry(predicate, context);
        return entry ? entry[1] : notSetValue;
      },
    
      forEach: function forEach(sideEffect, context) {
        assertNotInfinite(this.size);
        return this.__iterate(context ? sideEffect.bind(context) : sideEffect);
      },
    
      join: function join(separator) {
        assertNotInfinite(this.size);
        separator = separator !== undefined ? '' + separator : ',';
        var joined = '';
        var isFirst = true;
        this.__iterate(function (v) {
          isFirst ? (isFirst = false) : (joined += separator);
          joined += v !== null && v !== undefined ? v.toString() : '';
        });
        return joined;
      },
    
      keys: function keys() {
        return this.__iterator(ITERATE_KEYS);
      },
    
      map: function map(mapper, context) {
        return reify(this, mapFactory(this, mapper, context));
      },
    
      reduce: function reduce$1(reducer, initialReduction, context) {
        return reduce(
          this,
          reducer,
          initialReduction,
          context,
          arguments.length < 2,
          false
        );
      },
    
      reduceRight: function reduceRight(reducer, initialReduction, context) {
        return reduce(
          this,
          reducer,
          initialReduction,
          context,
          arguments.length < 2,
          true
        );
      },
    
      reverse: function reverse() {
        return reify(this, reverseFactory(this, true));
      },
    
      slice: function slice(begin, end) {
        return reify(this, sliceFactory(this, begin, end, true));
      },
    
      some: function some(predicate, context) {
        return !this.every(not(predicate), context);
      },
    
      sort: function sort(comparator) {
        return reify(this, sortFactory(this, comparator));
      },
    
      values: function values() {
        return this.__iterator(ITERATE_VALUES);
      },
    
      // ### More sequential methods
    
      butLast: function butLast() {
        return this.slice(0, -1);
      },
    
      isEmpty: function isEmpty() {
        return this.size !== undefined ? this.size === 0 : !this.some(function () { return true; });
      },
    
      count: function count(predicate, context) {
        return ensureSize(
          predicate ? this.toSeq().filter(predicate, context) : this
        );
      },
    
      countBy: function countBy(grouper, context) {
        return countByFactory(this, grouper, context);
      },
    
      equals: function equals(other) {
        return deepEqual(this, other);
      },
    
      entrySeq: function entrySeq() {
        var collection = this;
        if (collection._cache) {
          // We cache as an entries array, so we can just return the cache!
          return new ArraySeq(collection._cache);
        }
        var entriesSequence = collection
          .toSeq()
          .map(entryMapper)
          .toIndexedSeq();
        entriesSequence.fromEntrySeq = function () { return collection.toSeq(); };
        return entriesSequence;
      },
    
      filterNot: function filterNot(predicate, context) {
        return this.filter(not(predicate), context);
      },
    
      findEntry: function findEntry(predicate, context, notSetValue) {
        var found = notSetValue;
        this.__iterate(function (v, k, c) {
          if (predicate.call(context, v, k, c)) {
            found = [k, v];
            return false;
          }
        });
        return found;
      },
    
      findKey: function findKey(predicate, context) {
        var entry = this.findEntry(predicate, context);
        return entry && entry[0];
      },
    
      findLast: function findLast(predicate, context, notSetValue) {
        return this.toKeyedSeq()
          .reverse()
          .find(predicate, context, notSetValue);
      },
    
      findLastEntry: function findLastEntry(predicate, context, notSetValue) {
        return this.toKeyedSeq()
          .reverse()
          .findEntry(predicate, context, notSetValue);
      },
    
      findLastKey: function findLastKey(predicate, context) {
        return this.toKeyedSeq()
          .reverse()
          .findKey(predicate, context);
      },
    
      first: function first() {
        return this.find(returnTrue);
      },
    
      flatMap: function flatMap(mapper, context) {
        return reify(this, flatMapFactory(this, mapper, context));
      },
    
      flatten: function flatten(depth) {
        return reify(this, flattenFactory(this, depth, true));
      },
    
      fromEntrySeq: function fromEntrySeq() {
        return new FromEntriesSequence(this);
      },
    
      get: function get(searchKey, notSetValue) {
        return this.find(function (_, key) { return is(key, searchKey); }, undefined, notSetValue);
      },
    
      getIn: getIn$$1,
    
      groupBy: function groupBy(grouper, context) {
        return groupByFactory(this, grouper, context);
      },
    
      has: function has(searchKey) {
        return this.get(searchKey, NOT_SET) !== NOT_SET;
      },
    
      hasIn: hasIn$$1,
    
      isSubset: function isSubset(iter) {
        iter = typeof iter.includes === 'function' ? iter : Collection(iter);
        return this.every(function (value) { return iter.includes(value); });
      },
    
      isSuperset: function isSuperset(iter) {
        iter = typeof iter.isSubset === 'function' ? iter : Collection(iter);
        return iter.isSubset(this);
      },
    
      keyOf: function keyOf(searchValue) {
        return this.findKey(function (value) { return is(value, searchValue); });
      },
    
      keySeq: function keySeq() {
        return this.toSeq()
          .map(keyMapper)
          .toIndexedSeq();
      },
    
      last: function last() {
        return this.toSeq()
          .reverse()
          .first();
      },
    
      lastKeyOf: function lastKeyOf(searchValue) {
        return this.toKeyedSeq()
          .reverse()
          .keyOf(searchValue);
      },
    
      max: function max(comparator) {
        return maxFactory(this, comparator);
      },
    
      maxBy: function maxBy(mapper, comparator) {
        return maxFactory(this, comparator, mapper);
      },
    
      min: function min(comparator) {
        return maxFactory(
          this,
          comparator ? neg(comparator) : defaultNegComparator
        );
      },
    
      minBy: function minBy(mapper, comparator) {
        return maxFactory(
          this,
          comparator ? neg(comparator) : defaultNegComparator,
          mapper
        );
      },
    
      rest: function rest() {
        return this.slice(1);
      },
    
      skip: function skip(amount) {
        return amount === 0 ? this : this.slice(Math.max(0, amount));
      },
    
      skipLast: function skipLast(amount) {
        return amount === 0 ? this : this.slice(0, -Math.max(0, amount));
      },
    
      skipWhile: function skipWhile(predicate, context) {
        return reify(this, skipWhileFactory(this, predicate, context, true));
      },
    
      skipUntil: function skipUntil(predicate, context) {
        return this.skipWhile(not(predicate), context);
      },
    
      sortBy: function sortBy(mapper, comparator) {
        return reify(this, sortFactory(this, comparator, mapper));
      },
    
      take: function take(amount) {
        return this.slice(0, Math.max(0, amount));
      },
    
      takeLast: function takeLast(amount) {
        return this.slice(-Math.max(0, amount));
      },
    
      takeWhile: function takeWhile(predicate, context) {
        return reify(this, takeWhileFactory(this, predicate, context));
      },
    
      takeUntil: function takeUntil(predicate, context) {
        return this.takeWhile(not(predicate), context);
      },
    
      update: function update(fn) {
        return fn(this);
      },
    
      valueSeq: function valueSeq() {
        return this.toIndexedSeq();
      },
    
      // ### Hashable Object
    
      hashCode: function hashCode() {
        return this.__hash || (this.__hash = hashCollection(this));
      }
    
      // ### Internal
    
      // abstract __iterate(fn, reverse)
    
      // abstract __iterator(type, reverse)
    });
    
    var CollectionPrototype = Collection.prototype;
    CollectionPrototype[IS_ITERABLE_SENTINEL] = true;
    CollectionPrototype[ITERATOR_SYMBOL] = CollectionPrototype.values;
    CollectionPrototype.toJSON = CollectionPrototype.toArray;
    CollectionPrototype.__toStringMapper = quoteString;
    CollectionPrototype.inspect = CollectionPrototype.toSource = function() {
      return this.toString();
    };
    CollectionPrototype.chain = CollectionPrototype.flatMap;
    CollectionPrototype.contains = CollectionPrototype.includes;
    
    mixin(KeyedCollection, {
      // ### More sequential methods
    
      flip: function flip() {
        return reify(this, flipFactory(this));
      },
    
      mapEntries: function mapEntries(mapper, context) {
        var this$1 = this;
    
        var iterations = 0;
        return reify(
          this,
          this.toSeq()
            .map(function (v, k) { return mapper.call(context, [k, v], iterations++, this$1); })
            .fromEntrySeq()
        );
      },
    
      mapKeys: function mapKeys(mapper, context) {
        var this$1 = this;
    
        return reify(
          this,
          this.toSeq()
            .flip()
            .map(function (k, v) { return mapper.call(context, k, v, this$1); })
            .flip()
        );
      }
    });
    
    var KeyedCollectionPrototype = KeyedCollection.prototype;
    KeyedCollectionPrototype[IS_KEYED_SENTINEL] = true;
    KeyedCollectionPrototype[ITERATOR_SYMBOL] = CollectionPrototype.entries;
    KeyedCollectionPrototype.toJSON = toObject;
    KeyedCollectionPrototype.__toStringMapper = function (v, k) { return quoteString(k) + ': ' + quoteString(v); };
    
    mixin(IndexedCollection, {
      // ### Conversion to other types
    
      toKeyedSeq: function toKeyedSeq() {
        return new ToKeyedSequence(this, false);
      },
    
      // ### ES6 Collection methods (ES6 Array and Map)
    
      filter: function filter(predicate, context) {
        return reify(this, filterFactory(this, predicate, context, false));
      },
    
      findIndex: function findIndex(predicate, context) {
        var entry = this.findEntry(predicate, context);
        return entry ? entry[0] : -1;
      },
    
      indexOf: function indexOf(searchValue) {
        var key = this.keyOf(searchValue);
        return key === undefined ? -1 : key;
      },
    
      lastIndexOf: function lastIndexOf(searchValue) {
        var key = this.lastKeyOf(searchValue);
        return key === undefined ? -1 : key;
      },
    
      reverse: function reverse() {
        return reify(this, reverseFactory(this, false));
      },
    
      slice: function slice(begin, end) {
        return reify(this, sliceFactory(this, begin, end, false));
      },
    
      splice: function splice(index, removeNum /*, ...values*/) {
        var numArgs = arguments.length;
        removeNum = Math.max(removeNum || 0, 0);
        if (numArgs === 0 || (numArgs === 2 && !removeNum)) {
          return this;
        }
        // If index is negative, it should resolve relative to the size of the
        // collection. However size may be expensive to compute if not cached, so
        // only call count() if the number is in fact negative.
        index = resolveBegin(index, index < 0 ? this.count() : this.size);
        var spliced = this.slice(0, index);
        return reify(
          this,
          numArgs === 1
            ? spliced
            : spliced.concat(arrCopy(arguments, 2), this.slice(index + removeNum))
        );
      },
    
      // ### More collection methods
    
      findLastIndex: function findLastIndex(predicate, context) {
        var entry = this.findLastEntry(predicate, context);
        return entry ? entry[0] : -1;
      },
    
      first: function first() {
        return this.get(0);
      },
    
      flatten: function flatten(depth) {
        return reify(this, flattenFactory(this, depth, false));
      },
    
      get: function get(index, notSetValue) {
        index = wrapIndex(this, index);
        return index < 0 ||
          (this.size === Infinity || (this.size !== undefined && index > this.size))
          ? notSetValue
          : this.find(function (_, key) { return key === index; }, undefined, notSetValue);
      },
    
      has: function has(index) {
        index = wrapIndex(this, index);
        return (
          index >= 0 &&
          (this.size !== undefined
            ? this.size === Infinity || index < this.size
            : this.indexOf(index) !== -1)
        );
      },
    
      interpose: function interpose(separator) {
        return reify(this, interposeFactory(this, separator));
      },
    
      interleave: function interleave(/*...collections*/) {
        var collections = [this].concat(arrCopy(arguments));
        var zipped = zipWithFactory(this.toSeq(), IndexedSeq.of, collections);
        var interleaved = zipped.flatten(true);
        if (zipped.size) {
          interleaved.size = zipped.size * collections.length;
        }
        return reify(this, interleaved);
      },
    
      keySeq: function keySeq() {
        return Range(0, this.size);
      },
    
      last: function last() {
        return this.get(-1);
      },
    
      skipWhile: function skipWhile(predicate, context) {
        return reify(this, skipWhileFactory(this, predicate, context, false));
      },
    
      zip: function zip(/*, ...collections */) {
        var collections = [this].concat(arrCopy(arguments));
        return reify(this, zipWithFactory(this, defaultZipper, collections));
      },
    
      zipAll: function zipAll(/*, ...collections */) {
        var collections = [this].concat(arrCopy(arguments));
        return reify(this, zipWithFactory(this, defaultZipper, collections, true));
      },
    
      zipWith: function zipWith(zipper /*, ...collections */) {
        var collections = arrCopy(arguments);
        collections[0] = this;
        return reify(this, zipWithFactory(this, zipper, collections));
      }
    });
    
    var IndexedCollectionPrototype = IndexedCollection.prototype;
    IndexedCollectionPrototype[IS_INDEXED_SENTINEL] = true;
    IndexedCollectionPrototype[IS_ORDERED_SENTINEL] = true;
    
    mixin(SetCollection, {
      // ### ES6 Collection methods (ES6 Array and Map)
    
      get: function get(value, notSetValue) {
        return this.has(value) ? value : notSetValue;
      },
    
      includes: function includes(value) {
        return this.has(value);
      },
    
      // ### More sequential methods
    
      keySeq: function keySeq() {
        return this.valueSeq();
      }
    });
    
    SetCollection.prototype.has = CollectionPrototype.includes;
    SetCollection.prototype.contains = SetCollection.prototype.includes;
    
    // Mixin subclasses
    
    mixin(KeyedSeq, KeyedCollection.prototype);
    mixin(IndexedSeq, IndexedCollection.prototype);
    mixin(SetSeq, SetCollection.prototype);
    
    // #pragma Helper functions
    
    function reduce(collection, reducer, reduction, context, useFirst, reverse) {
      assertNotInfinite(collection.size);
      collection.__iterate(function (v, k, c) {
        if (useFirst) {
          useFirst = false;
          reduction = v;
        } else {
          reduction = reducer.call(context, reduction, v, k, c);
        }
      }, reverse);
      return reduction;
    }
    
    function keyMapper(v, k) {
      return k;
    }
    
    function entryMapper(v, k) {
      return [k, v];
    }
    
    function not(predicate) {
      return function() {
        return !predicate.apply(this, arguments);
      };
    }
    
    function neg(predicate) {
      return function() {
        return -predicate.apply(this, arguments);
      };
    }
    
    function defaultZipper() {
      return arrCopy(arguments);
    }
    
    function defaultNegComparator(a, b) {
      return a < b ? 1 : a > b ? -1 : 0;
    }
    
    function hashCollection(collection) {
      if (collection.size === Infinity) {
        return 0;
      }
      var ordered = isOrdered(collection);
      var keyed = isKeyed(collection);
      var h = ordered ? 1 : 0;
      var size = collection.__iterate(
        keyed
          ? ordered
            ? function (v, k) {
                h = (31 * h + hashMerge(hash(v), hash(k))) | 0;
              }
            : function (v, k) {
                h = (h + hashMerge(hash(v), hash(k))) | 0;
              }
          : ordered
            ? function (v) {
                h = (31 * h + hash(v)) | 0;
              }
            : function (v) {
                h = (h + hash(v)) | 0;
              }
      );
      return murmurHashOfSize(size, h);
    }
    
    function murmurHashOfSize(size, h) {
      h = imul(h, 0xcc9e2d51);
      h = imul((h << 15) | (h >>> -15), 0x1b873593);
      h = imul((h << 13) | (h >>> -13), 5);
      h = ((h + 0xe6546b64) | 0) ^ size;
      h = imul(h ^ (h >>> 16), 0x85ebca6b);
      h = imul(h ^ (h >>> 13), 0xc2b2ae35);
      h = smi(h ^ (h >>> 16));
      return h;
    }
    
    function hashMerge(a, b) {
      return (a ^ (b + 0x9e3779b9 + (a << 6) + (a >> 2))) | 0; // int
    }
    
    var OrderedSet = (function (Set$$1) {
      function OrderedSet(value) {
        return value === null || value === undefined
          ? emptyOrderedSet()
          : isOrderedSet(value)
            ? value
            : emptyOrderedSet().withMutations(function (set) {
                var iter = SetCollection(value);
                assertNotInfinite(iter.size);
                iter.forEach(function (v) { return set.add(v); });
              });
      }
    
      if ( Set$$1 ) OrderedSet.__proto__ = Set$$1;
      OrderedSet.prototype = Object.create( Set$$1 && Set$$1.prototype );
      OrderedSet.prototype.constructor = OrderedSet;
    
      OrderedSet.of = function of (/*...values*/) {
        return this(arguments);
      };
    
      OrderedSet.fromKeys = function fromKeys (value) {
        return this(KeyedCollection(value).keySeq());
      };
    
      OrderedSet.prototype.toString = function toString () {
        return this.__toString('OrderedSet {', '}');
      };
    
      return OrderedSet;
    }(Set));
    
    function isOrderedSet(maybeOrderedSet) {
      return isSet(maybeOrderedSet) && isOrdered(maybeOrderedSet);
    }
    
    OrderedSet.isOrderedSet = isOrderedSet;
    
    var OrderedSetPrototype = OrderedSet.prototype;
    OrderedSetPrototype[IS_ORDERED_SENTINEL] = true;
    OrderedSetPrototype.zip = IndexedCollectionPrototype.zip;
    OrderedSetPrototype.zipWith = IndexedCollectionPrototype.zipWith;
    
    OrderedSetPrototype.__empty = emptyOrderedSet;
    OrderedSetPrototype.__make = makeOrderedSet;
    
    function makeOrderedSet(map, ownerID) {
      var set = Object.create(OrderedSetPrototype);
      set.size = map ? map.size : 0;
      set._map = map;
      set.__ownerID = ownerID;
      return set;
    }
    
    var EMPTY_ORDERED_SET;
    function emptyOrderedSet() {
      return (
        EMPTY_ORDERED_SET || (EMPTY_ORDERED_SET = makeOrderedSet(emptyOrderedMap()))
      );
    }
    
    var Record = function Record(defaultValues, name) {
      var hasInitialized;
    
      var RecordType = function Record(values) {
        var this$1 = this;
    
        if (values instanceof RecordType) {
          return values;
        }
        if (!(this instanceof RecordType)) {
          return new RecordType(values);
        }
        if (!hasInitialized) {
          hasInitialized = true;
          var keys = Object.keys(defaultValues);
          var indices = (RecordTypePrototype._indices = {});
          RecordTypePrototype._name = name;
          RecordTypePrototype._keys = keys;
          RecordTypePrototype._defaultValues = defaultValues;
          for (var i = 0; i < keys.length; i++) {
            var propName = keys[i];
            indices[propName] = i;
            if (RecordTypePrototype[propName]) {
              /* eslint-disable no-console */
              typeof console === 'object' &&
                console.warn &&
                console.warn(
                  'Cannot define ' +
                    recordName(this$1) +
                    ' with property "' +
                    propName +
                    '" since that property name is part of the Record API.'
                );
              /* eslint-enable no-console */
            } else {
              setProp(RecordTypePrototype, propName);
            }
          }
        }
        this.__ownerID = undefined;
        this._values = List().withMutations(function (l) {
          l.setSize(this$1._keys.length);
          KeyedCollection(values).forEach(function (v, k) {
            l.set(this$1._indices[k], v === this$1._defaultValues[k] ? undefined : v);
          });
        });
      };
    
      var RecordTypePrototype = (RecordType.prototype = Object.create(
        RecordPrototype
      ));
      RecordTypePrototype.constructor = RecordType;
    
      return RecordType;
    };
    
    Record.prototype.toString = function toString () {
        var this$1 = this;
    
      var str = recordName(this) + ' { ';
      var keys = this._keys;
      var k;
      for (var i = 0, l = keys.length; i !== l; i++) {
        k = keys[i];
        str += (i ? ', ' : '') + k + ': ' + quoteString(this$1.get(k));
      }
      return str + ' }';
    };
    
    Record.prototype.equals = function equals (other) {
      return (
        this === other ||
        (other &&
          this._keys === other._keys &&
          recordSeq(this).equals(recordSeq(other)))
      );
    };
    
    Record.prototype.hashCode = function hashCode () {
      return recordSeq(this).hashCode();
    };
    
    // @pragma Access
    
    Record.prototype.has = function has (k) {
      return this._indices.hasOwnProperty(k);
    };
    
    Record.prototype.get = function get (k, notSetValue) {
      if (!this.has(k)) {
        return notSetValue;
      }
      var index = this._indices[k];
      var value = this._values.get(index);
      return value === undefined ? this._defaultValues[k] : value;
    };
    
    // @pragma Modification
    
    Record.prototype.set = function set (k, v) {
      if (this.has(k)) {
        var newValues = this._values.set(
          this._indices[k],
          v === this._defaultValues[k] ? undefined : v
        );
        if (newValues !== this._values && !this.__ownerID) {
          return makeRecord(this, newValues);
        }
      }
      return this;
    };
    
    Record.prototype.remove = function remove (k) {
      return this.set(k);
    };
    
    Record.prototype.clear = function clear () {
      var newValues = this._values.clear().setSize(this._keys.length);
      return this.__ownerID ? this : makeRecord(this, newValues);
    };
    
    Record.prototype.wasAltered = function wasAltered () {
      return this._values.wasAltered();
    };
    
    Record.prototype.toSeq = function toSeq () {
      return recordSeq(this);
    };
    
    Record.prototype.toJS = function toJS$1 () {
      return toJS(this);
    };
    
    Record.prototype.entries = function entries () {
      return this.__iterator(ITERATE_ENTRIES);
    };
    
    Record.prototype.__iterator = function __iterator (type, reverse) {
      return recordSeq(this).__iterator(type, reverse);
    };
    
    Record.prototype.__iterate = function __iterate (fn, reverse) {
      return recordSeq(this).__iterate(fn, reverse);
    };
    
    Record.prototype.__ensureOwner = function __ensureOwner (ownerID) {
      if (ownerID === this.__ownerID) {
        return this;
      }
      var newValues = this._values.__ensureOwner(ownerID);
      if (!ownerID) {
        this.__ownerID = ownerID;
        this._values = newValues;
        return this;
      }
      return makeRecord(this, newValues, ownerID);
    };
    
    Record.isRecord = isRecord;
    Record.getDescriptiveName = recordName;
    var RecordPrototype = Record.prototype;
    RecordPrototype[IS_RECORD_SENTINEL] = true;
    RecordPrototype[DELETE] = RecordPrototype.remove;
    RecordPrototype.deleteIn = RecordPrototype.removeIn = deleteIn;
    RecordPrototype.getIn = getIn$$1;
    RecordPrototype.hasIn = CollectionPrototype.hasIn;
    RecordPrototype.merge = merge;
    RecordPrototype.mergeWith = mergeWith;
    RecordPrototype.mergeIn = mergeIn;
    RecordPrototype.mergeDeep = mergeDeep;
    RecordPrototype.mergeDeepWith = mergeDeepWith;
    RecordPrototype.mergeDeepIn = mergeDeepIn;
    RecordPrototype.setIn = setIn$$1;
    RecordPrototype.update = update$$1;
    RecordPrototype.updateIn = updateIn$1;
    RecordPrototype.withMutations = withMutations;
    RecordPrototype.asMutable = asMutable;
    RecordPrototype.asImmutable = asImmutable;
    RecordPrototype[ITERATOR_SYMBOL] = RecordPrototype.entries;
    RecordPrototype.toJSON = RecordPrototype.toObject =
      CollectionPrototype.toObject;
    RecordPrototype.inspect = RecordPrototype.toSource = function() {
      return this.toString();
    };
    
    function makeRecord(likeRecord, values, ownerID) {
      var record = Object.create(Object.getPrototypeOf(likeRecord));
      record._values = values;
      record.__ownerID = ownerID;
      return record;
    }
    
    function recordName(record) {
      return record._name || record.constructor.name || 'Record';
    }
    
    function recordSeq(record) {
      return keyedSeqFromValue(record._keys.map(function (k) { return [k, record.get(k)]; }));
    }
    
    function setProp(prototype, name) {
      try {
        Object.defineProperty(prototype, name, {
          get: function() {
            return this.get(name);
          },
          set: function(value) {
            invariant(this.__ownerID, 'Cannot set on an immutable record.');
            this.set(name, value);
          }
        });
      } catch (error) {
        // Object.defineProperty failed. Probably IE8.
      }
    }
    
    /**
     * Returns a lazy Seq of `value` repeated `times` times. When `times` is
     * undefined, returns an infinite sequence of `value`.
     */
    var Repeat = (function (IndexedSeq$$1) {
      function Repeat(value, times) {
        if (!(this instanceof Repeat)) {
          return new Repeat(value, times);
        }
        this._value = value;
        this.size = times === undefined ? Infinity : Math.max(0, times);
        if (this.size === 0) {
          if (EMPTY_REPEAT) {
            return EMPTY_REPEAT;
          }
          EMPTY_REPEAT = this;
        }
      }
    
      if ( IndexedSeq$$1 ) Repeat.__proto__ = IndexedSeq$$1;
      Repeat.prototype = Object.create( IndexedSeq$$1 && IndexedSeq$$1.prototype );
      Repeat.prototype.constructor = Repeat;
    
      Repeat.prototype.toString = function toString () {
        if (this.size === 0) {
          return 'Repeat []';
        }
        return 'Repeat [ ' + this._value + ' ' + this.size + ' times ]';
      };
    
      Repeat.prototype.get = function get (index, notSetValue) {
        return this.has(index) ? this._value : notSetValue;
      };
    
      Repeat.prototype.includes = function includes (searchValue) {
        return is(this._value, searchValue);
      };
    
      Repeat.prototype.slice = function slice (begin, end) {
        var size = this.size;
        return wholeSlice(begin, end, size)
          ? this
          : new Repeat(
              this._value,
              resolveEnd(end, size) - resolveBegin(begin, size)
            );
      };
    
      Repeat.prototype.reverse = function reverse () {
        return this;
      };
    
      Repeat.prototype.indexOf = function indexOf (searchValue) {
        if (is(this._value, searchValue)) {
          return 0;
        }
        return -1;
      };
    
      Repeat.prototype.lastIndexOf = function lastIndexOf (searchValue) {
        if (is(this._value, searchValue)) {
          return this.size;
        }
        return -1;
      };
    
      Repeat.prototype.__iterate = function __iterate (fn, reverse) {
        var this$1 = this;
    
        var size = this.size;
        var i = 0;
        while (i !== size) {
          if (fn(this$1._value, reverse ? size - ++i : i++, this$1) === false) {
            break;
          }
        }
        return i;
      };
    
      Repeat.prototype.__iterator = function __iterator (type, reverse) {
        var this$1 = this;
    
        var size = this.size;
        var i = 0;
        return new Iterator(
          function () { return i === size
              ? iteratorDone()
              : iteratorValue(type, reverse ? size - ++i : i++, this$1._value); }
        );
      };
    
      Repeat.prototype.equals = function equals (other) {
        return other instanceof Repeat
          ? is(this._value, other._value)
          : deepEqual(other);
      };
    
      return Repeat;
    }(IndexedSeq));
    
    var EMPTY_REPEAT;
    
    function fromJS(value, converter) {
      return fromJSWith(
        [],
        converter || defaultConverter,
        value,
        '',
        converter && converter.length > 2 ? [] : undefined,
        { '': value }
      );
    }
    
    function fromJSWith(stack, converter, value, key, keyPath, parentValue) {
      var toSeq = Array.isArray(value)
        ? IndexedSeq
        : isPlainObj(value) ? KeyedSeq : null;
      if (toSeq) {
        if (~stack.indexOf(value)) {
          throw new TypeError('Cannot convert circular structure to Immutable');
        }
        stack.push(value);
        keyPath && key !== '' && keyPath.push(key);
        var converted = converter.call(
          parentValue,
          key,
          toSeq(value).map(function (v, k) { return fromJSWith(stack, converter, v, k, keyPath, value); }
          ),
          keyPath && keyPath.slice()
        );
        stack.pop();
        keyPath && keyPath.pop();
        return converted;
      }
      return value;
    }
    
    function defaultConverter(k, v) {
      return isKeyed(v) ? v.toMap() : v.toList();
    }
    
    var version = "4.0.0-rc.9";
    
    // Functional read/write API
    var Immutable = {
      version: version,
    
      Collection: Collection,
      // Note: Iterable is deprecated
      Iterable: Collection,
    
      Seq: Seq,
      Map: Map,
      OrderedMap: OrderedMap,
      List: List,
      Stack: Stack,
      Set: Set,
      OrderedSet: OrderedSet,
    
      Record: Record,
      Range: Range,
      Repeat: Repeat,
    
      is: is,
      fromJS: fromJS,
      hash: hash,
    
      isImmutable: isImmutable,
      isCollection: isCollection,
      isKeyed: isKeyed,
      isIndexed: isIndexed,
      isAssociative: isAssociative,
      isOrdered: isOrdered,
      isValueObject: isValueObject,
    
      get: get,
      getIn: getIn$1,
      has: has,
      hasIn: hasIn$1,
      merge: merge$1,
      mergeDeep: mergeDeep$1,
      mergeWith: mergeWith$1,
      mergeDeepWith: mergeDeepWith$1,
      remove: remove,
      removeIn: removeIn,
      set: set,
      setIn: setIn$1,
      update: update$1,
      updateIn: updateIn
    };
    
    // Note: Iterable is deprecated
    var Iterable = Collection;
    
    exports['default'] = Immutable;
    exports.version = version;
    exports.Collection = Collection;
    exports.Iterable = Iterable;
    exports.Seq = Seq;
    exports.Map = Map;
    exports.OrderedMap = OrderedMap;
    exports.List = List;
    exports.Stack = Stack;
    exports.Set = Set;
    exports.OrderedSet = OrderedSet;
    exports.Record = Record;
    exports.Range = Range;
    exports.Repeat = Repeat;
    exports.is = is;
    exports.fromJS = fromJS;
    exports.hash = hash;
    exports.isImmutable = isImmutable;
    exports.isCollection = isCollection;
    exports.isKeyed = isKeyed;
    exports.isIndexed = isIndexed;
    exports.isAssociative = isAssociative;
    exports.isOrdered = isOrdered;
    exports.isValueObject = isValueObject;
    exports.get = get;
    exports.getIn = getIn$1;
    exports.has = has;
    exports.hasIn = hasIn$1;
    exports.merge = merge$1;
    exports.mergeDeep = mergeDeep$1;
    exports.mergeWith = mergeWith$1;
    exports.mergeDeepWith = mergeDeepWith$1;
    exports.remove = remove;
    exports.removeIn = removeIn;
    exports.set = set;
    exports.setIn = setIn$1;
    exports.update = update$1;
    exports.updateIn = updateIn;
    
    Object.defineProperty(exports, '__esModule', { value: true });
    
    return exports;
    
    })
    )();
    const runtime__runtime = ((function (Immutable, runtime__minimal) {
        let raise_arity_error = runtime__minimal["raise-arity-error"]
    
        function is_string(arg) {
            if (1 !== arguments.length) {
                raise_arity_error("string?", 1, arguments.length);
            }
    
            if (typeof arg === 'string' || arg instanceof String) {
                return true;
            } else {
                return false;
            }
        }
    
        function is_number(arg) {
            if (1 !== arguments.length) {
                raise_arity_error("number?", 1, arguments.length);
            }
    
            return Number(parseFloat(arg)) === arg;
        }
    
        function is_identifier(arg) {
            if (1 !== arguments.length) {
                raise_arity_error("identifier?", 1, arguments.length);
            }
    
            return is_js_object(arg) && arg.identifier !== undefined;
        }
    
        // Arrays are objects in JS, but I'm going to treat them as disjoint.
        function is_js_object(arg) {
            if (1 !== arguments.length) {
                raise_arity_error("js-object?", 1, arguments.length);
            }
    
            return arg !== null && typeof arg === 'object' && !Array.isArray(arg);
        }
    
        function is_js_array(arg) {
            if (1 !== arguments.length) {
                raise_arity_error("js-array?", 1, arguments.length);
            }
    
            return Array.isArray(arg);
        }
    
        function make_keyword(str) {
            return str;
        }
    
        function make_identifier(str) {
            if (1 !== arguments.length) {
                raise_arity_error("make-identifier", 1, arguments.length);
            }
            string_c("make-identifier", str);
    
            return Object.assign(Object.create(ValueObject), { identifier: str });
        }
    
        function get_identifier_string(id) {
            if (1 !== arguments.length) {
                raise_arity_error("identifier-string", 1, arguments.length);
            }
    
            identifier_c("identifier-string", id);
    
            return id["identifier"];
        }
    
        function number_c(name, v) {
            if (2 !== arguments.length) {
                raise_arity_error("number/c", 2, arguments.length);
            }
    
            if (!is_number(v)) {
                throw Error(name + ": contract violation\n  expected: number?\n  given: " + v);
            }
        }
    
        function string_c(name, v) {
            if (2 !== arguments.length) {
                raise_arity_error("string/c", 2, arguments.length);
            }
    
            if (!is_string(v)) {
                throw Error(name + ": contract violation\n  expected: string?\n  given: " + v);
            }
        }
    
        function identifier_c(name, v) {
            if (2 !== arguments.length) {
                raise_arity_error("identifier/c", 2, arguments.length);
            }
    
            if (!is_identifier(v)) {
                throw Error(name + ": contract violation\n  expected: identifier?\n  given: " + v);
            }
        }
    
        function checked_num_binop(name, f) {
            function wrapped(a, b) {
                if (2 !== arguments.length) {
                    raise_arity_error(name, 2, arguments.length);
                }
                number_c(name, a);
                number_c(name, b);
                return f(a, b);
            }
            return wrapped;
        }
    
        function displayln(v) {
            if (1 !== arguments.length) {
                raise_arity_error("displayln", 1, arguments.length);
            }
            console.log(String(v));
        }
    
        function has(c, k) {
            if (2 !== arguments.length) {
                raise_arity_error("has", 2, arguments.length);
            }
    
            if (Immutable.isCollection(c)) {
                return c.has(k);
            } else if (is_js_object(c)) {
                return c[k] !== undefined;
            } else if (is_js_array(c)) {
                return c[k] !== undefined;
            } else if (is_string(c)) {
                return c[k] !== undefined;
            } else {
                throw Error("has: contract violation\n  expected: (or/c collection/c array/c object/c string/c) \n given: " + c)
            }
        }
    
    
        function get(c, k) {
            if (2 !== arguments.length) {
                raise_arity_error("get", 2, arguments.length);
            }
    
            if (!(Immutable.isCollection(c) || is_js_array(c) || is_js_object(c) || is_string(c))) {
                throw Error("get: contract violation\n  expected: (or/c collection/c array/c object/c string/c) \n given: " + c)
            }
    
            var res;
            if (Immutable.isCollection(c)) {
                res = c.get(k)
            } else {
                res = c[k];
            }
    
    
            if (res === undefined) {
                throw Error("get: no value found for key\n  key: " + k + "\n  in: " + String(c));
            }
            return res;
        }
    
        function error(name, message) {
            if (2 !== arguments.length) {
                raise_arity_error("error", 2, arguments.length);
            }
    
            throw Error(name + ": " + message);
        }
    
        function string_append() {
            let res = "";
            for (var i = 0; i < arguments.length; i++) {
                string_c("string-append", arguments[i]);
                res = res + arguments[i];
            }
            return res;
        }
    
        function not(arg) {
            if (1 !== arguments.length) {
                raise_arity_error("not", 1, arguments.length);
            }
            return arg === false;
        }
    
        function threeeq(a, b) {
            if (2 !== arguments.length) {
                raise_arity_error("===", 2, arguments.length);
            }
    
            return a === b;
        }
    
        function threeneq(a, b) {
            if (2 !== arguments.length) {
                raise_arity_error("!==", 2, arguments.length);
            }
    
            return a !== b;
        }
    
        function quoteString(value) {
            try {
                return typeof value === 'string' ? JSON.stringify(value) : String(value);
            } catch (_ignoreError) {
                return JSON.stringify(value);
            }
        }
    
        const ValueObject = {
            toString: function () {
                var keys = Object.getOwnPropertyNames(this)
    
                var str = "{ ";
                var k;
                for (var i = 0, l = keys.length; i !== l; i++) {
                    k = keys[i];
                    str += (i ? ', ' : '') + k + ': ' + quoteString(this[k]);
                }
                return str + ' }';
            },
            // Super inefficient equals and hashcode implementations...
            toAlist: function () {
                var that = this;
                const keys = Object.getOwnPropertyNames(that).sort()
                return Immutable.List(keys.map(function(k) { return Immutable.List([k, that[k]]); }));
            },
            equals: function(other) {
                if (Object.getPrototypeOf(other) !== ValueObject) {
                    return false;
                }
                return Immutable.is(this.toAlist(), other.toAlist());
            },
            hashCode: function() {
                return this.toAlist().hashCode();
            }
        }
    
        function obj() {
            if (arguments.length % 2 !== 0) {
                throw Error("obj: expected an even number of arguments")
            }
    
            let res = Object.create(ValueObject);
    
            for (var i = 0; i < arguments.length; i = i + 2) {
                string_c("obj", arguments[i]);
                res[arguments[i]] = arguments[i + 1];
            }
    
            return res;
        }
    
        function hash() {
            if (arguments.length % 2 !== 0) {
                throw Error("hash: expected an even number of arguments")
            }
    
            let res = Immutable.Map();
    
            for (var i = 0; i < arguments.length; i = i + 2) {
                res = res.set(arguments[i], arguments[i + 1]);
            }
    
            return res;
        }
    
        function list() {
            return Immutable.List(arguments);
        }
    
        function assoc(c, k, v) {
            if (3 !== arguments.length) {
                raise_arity_error("assoc", 3, arguments.length);
            }
    
            if (Immutable.isKeyed(c)) {
                return c.set(k, v);
            } else if (Immutable.isIndexed(c)) {
                if (!is_number(k)) {
                    throw Error("assoc: collection is indexed, but key is not a number\n  key: " + k);
                }
                if (!(k <= c.size)) {
                    throw Error("assoc: assignment would leave undefined indices");
                }
                return c.set(k, v);
            } else if (is_js_object(c)) {
                var res = Object.assign(Object.create(Object.getPrototypeOf(c)), c)
                res[k] = v;
                return res;
            } else {
                throw Error("assoc: contract violation\n  expected: (or/c collection/c object/c) \n given: " + c)
            }
        }
    
        function empty(c) {
            if (1 !== arguments.length) {
                raise_arity_error("empty?", 1, arguments.length);
            }
    
            if (Immutable.isCollection(c)) {
                return c.isEmpty();
            } else if (is_js_array(c)) {
                return c.length === 0;
            } else {
                throw Error("empty?: contract violation\n  expected: (or/c collection/c array/c)\n  given: " + c)
            }
        }
    
        function first(l) {
            if (1 !== arguments.length) {
                raise_arity_error("first", 1, arguments.length);
            }
            list_c("first", l);
    
            if (l.isEmpty()) {
                throw Error("first: cannot get first of empty list")
            }
    
            return l.first();
        }
    
        function rest(l) {
            if (1 !== arguments.length) {
                raise_arity_error("rest", 1, arguments.length);
            }
            list_c("rest", l);
    
            if (l.isEmpty()) {
                throw Error("rest: cannot get rest of empty list")
            }
    
            return l.rest();
        }
    
        function cons(e, l) {
            if (2 !== arguments.length) {
                raise_arity_error("cons", 2, arguments.length);
            }
            list_c("cons", l);
    
            return l.unshift(e);
        }
    
        function append(l1, l2) {
            if (2 !== arguments.length) {
                raise_arity_error("append", 2, arguments.length);
            }
            list_c("append", l1);
            list_c("append", l2);
    
            return l1.concat(l2);
        }
    
        function reverse(l) {
            if (1 !== arguments.length) {
                raise_arity_error("reverse", 1, arguments.length);
            }
            list_c("reverse", l);
    
            return l.reverse();
        }
    
        function list_to_array(l) {
            if (1 !== arguments.length) {
                raise_arity_error("list->array", 1, arguments.length);
            }
            list_c("list->array", l);
    
            return l.toArray();
        }
    
        function array_to_list(a) {
            if (1 !== arguments.length) {
                raise_arity_error("array->list", 1, arguments.length);
            }
    
            if (!is_js_array(a)) {
                throw Error("array->list: contract violation\n  expected: array/c\n  given: " + a)
            }
    
            return Immutable.List(a);
        }
    
    
        function size(c) {
            if (Immutable.isCollection(c)) {
                return c.size;
            } else if (is_js_array(c)) {
                return c.length;
            } else if (is_string(c)) {
                return c.length;
            } else {
                throw Error("size: contract violation\n  expected: (or/c collection/c array/c)\n  given: " + c);
            }
        }
    
        function number_to_string(n) {
            if (1 !== arguments.length) {
                raise_arity_error("number->string", 1, arguments.length);
            }
    
            number_c("number->string", n)
    
            return n.toString();
        }
    
        function is_function(arg) {
            if (1 !== arguments.length) {
                raise_arity_error("function?", 1, arguments.length);
            }
    
            return typeof arg === "function";
        }
    
        function function_c(name, arg) {
            if (!is_function(arg)) {
                throw Error(name + ": contract violation\n  expected: function/c\n  given: " + arg);
            }
        }
    
        function variadic(f) {
            if (1 !== arguments.length) {
                raise_arity_error("variadic", 1, arguments.length);
            }
            function_c("variadic", f);
    
            function wrap() {
                return f(Immutable.List(arguments));
            }
    
            return wrap;
        }
    
        function list_c(name, arg) {
            if (!Immutable.List.isList(arg)) {
                throw Error(name + ": contract violation\n  expected: list/c\n  given: " + String(arg));
            }
        }
    
        function apply(f, args) {
            if (2 !== arguments.length) {
                raise_arity_error("apply", 2, arguments.length);
            }
            function_c("apply", f);
            list_c("apply", args);
    
            return f.apply({}, args.toArray());
        }
    
        function substring(s, i1, i2) {
            if (3 !== arguments.length) {
                raise_arity_error("substring", 3, arguments.length);
            }
    
            string_c("substring", s);
            number_c("substring", i1);
            number_c("substring", i2);
    
            return s.substring(i1, i2);
        }
    
        function string_to_integer(s) {
            if (1 !== arguments.length) {
                raise_arity_error("string->integer", 1, arguments.length);
            }
    
            string_c("string->integer", s)
    
            if (/^(\-|\+)?([0-9]+|Infinity)$/.test(s)) {
                return Number(s);
            } else {
                throw Error("string->integer: string cannot be parsed as an integer: " + s);
            }
        }
    
        function read_stdin(callback) {
            if (1 !== arguments.length) {
                raise_arity_error("read-stdin", 1, arguments.length);
            }
            function_c("read-stdin", callback);
    
            let chunks = [];
            process.stdin.resume()
            process.stdin.on('data', function(chunk) { chunks.push(chunk); });
            process.stdin.on('end', function() {
                let string = chunks.join("");
                callback(string);
            });
        }
    
        function to_string(v) {
            if (1 !== arguments.length) {
                raise_arity_error("to-string", 1, arguments.length);
            }
    
            return v.toString()
        }
    
    
        function character_code(s) {
            if (1 !== arguments.length) {
                raise_arity_error("character-code", 1, arguments.length);
            }
            if (!(is_string(s) && s.length === 1)) {
                throw Error("character-code: contract violation\n  expected: a length 1 string\n  given: " + s);
            }
            return s.charCodeAt(0);
        }
    
        function contains(c, v) {
            if (2 !== arguments.length) {
                raise_arity_error("contains", 2, arguments.length);
            }
            if (!(Immutable.isCollection(c))) {
                throw Error("contains: contract violation\n  expected: collection/c\n  given: " + c);
            }
            return c.contains(v);
        }
    
        function array() {
            return Array.prototype.slice.call(arguments);
        }
    
        function map(f, list) {
            if (2 !== arguments.length) {
                raise_arity_error("map", 2, arguments.length);
            }
            function_c("map", f);
            list_c("map", list);
    
            return list.map(function (el) { return f(el); });
        }
    
        function foldl(f, init, list) {
            if (3 !== arguments.length) {
                raise_arity_error("foldl", 3, arguments.length);
            }
            function_c("foldl", f);
            list_c("foldl", list);
    
            return list.reduce(function (acc, el) { return f(acc, el); }, init);
        }
    
        function Box(init) {
            this.val = init;
        }
    
        function box(init) {
            if (1 !== arguments.length) {
                raise_arity_error("box", 1, arguments.length);
            }
            return new Box(init);
        }
    
        function is_box(v) {
            if (1 !== arguments.length) {
                raise_arity_error("box?", 1, arguments.length);
            }
            return v instanceof Box;
        }
    
        function unbox(b) {
            if (1 !== arguments.length) {
                raise_arity_error("unbox", 1, arguments.length);
            }
            if (!is_box(b)) {
                throw Error("unbox: contract violation\n  expected: box/c\n  given: " + b)
            }
            return b.val;
        }
    
    
        function set_box_bang(b, v) {
            if (2 !== arguments.length) {
                raise_arity_error("set-box!", 2, arguments.length);
            }
    
            if (!is_box(b)) {
                throw Error("set-box!: contract violation\n  expected: box/c\n  given: " + b)
            }
    
            b.val = v;
        }
    
        function string_split(s, sep) {
            if (2 !== arguments.length) {
                raise_arity_error("string-split", 2, arguments.length);
            }
            string_c("string-split", s);
            string_c("string-split", sep);
    
            return array_to_list(s.split(sep));
        }
    
        function string_join(l, sep) {
            if (2 !== arguments.length) {
                raise_arity_error("string-join", 2, arguments.length);
            }
            list_c("string-join", l);
            string_c("string-join", sep);
    
            return list_to_array(l).join(sep);
        }
    
        function string_trim(s) {
            if (1 !== arguments.length) {
                raise_arity_error("string-trim", 1, arguments.length);
            }
            string_c("string-trim", s);
            return s.trim();
        }
    
        function equal(v1, v2) {
            if (2 !== arguments.length) {
                raise_arity_error("equal?", 2, arguments.length);
            }
            return Immutable.is(v1, v2);
        }
    
        function zip(f, l1, l2) {
            if (3 !== arguments.length) {
                raise_arity_error("zip", 3, arguments.length)
            }
            function_c("zip", f);
            list_c("zip", l1);
            list_c("zip", l2);
            return l1.zipWith((a, b) => f(a, b), l2)
        }
    
        function subset(l1, l2) {
            if (2 !== arguments.length) {
                raise_arity_error("subset", 2, arguments.length)
            }
            list_c("subset", l1);
            list_c("subset", l2);
    
            return l1.isSubset(l2);
        }
    
        function is_list(v) {
            if (1 !== arguments.length) {
                raise_arity_error("list?", 1, arguments.length)
            }
            return Immutable.List.isList(v);
        }
    
        return {
            "number?": is_number,
            "string?": is_string,
            "identifier?": is_identifier,
            "js-object?": is_js_object,
            "js-array?": is_js_array,
            "make-identifier": make_identifier,
            "identifier-string": get_identifier_string,
            "true": true,
            "false": false,
            "+": checked_num_binop("+", (a, b) => a + b),
            "-": checked_num_binop("-", (a, b) => a - b),
            "*": checked_num_binop("*", (a, b) => a * b),
            "/": checked_num_binop("/", (a, b) => a / b),
            "%": checked_num_binop("%", (a, b) => a % b),
            "<": checked_num_binop("<", (a, b) => a < b),
            ">": checked_num_binop(">", (a, b) => a > b),
            ">=": checked_num_binop(">=", (a, b) => a >= b),
            "<=": checked_num_binop("<=", (a, b) => a <= b),
            "=": checked_num_binop("=", (a, b) => a === b),
            "displayln": displayln,
            "raise-arity-error": raise_arity_error,
            "number/c": number_c,
            "string/c": string_c,
            "identifier/c": identifier_c,
            "has": has,
            "get": get,
            "make-keyword": make_keyword,
            "error": error,
            "string-append": string_append,
            "not": not,
            "===": threeeq,
            "!==": threeneq,
            "obj": obj,
            "hash": hash,
            "list": list,
            "assoc": assoc,
            "empty?": empty,
            "append": append,
            "null": null,
            "number->string": number_to_string,
            "first": first,
            "rest": rest,
            "variadic": variadic,
            "cons": cons,
            "size": size,
            "function?": is_function,
            "apply": apply,
            "substring": substring,
            "list/c": list_c,
            "function/c": function_c,
            "newline": "\n",
            "double-quote": "\"",
            "string->integer": string_to_integer,
            "read-stdin": read_stdin,
            "to-string": to_string,
            "character-code": character_code,
            "contains": contains,
            "reverse": reverse,
            "array": array,
            "list->array": list_to_array,
            "map": map,
            "foldl": foldl,
            "array->list": array_to_list,
            "box": box,
            "box?": is_box,
            "unbox": unbox,
            "set-box!": set_box_bang,
            "string-split": string_split,
            "string-join": string_join,
            "equal?": equal,
            "zip": zip,
            "subset": subset,
            "list?": is_list,
            "string-trim": string_trim,
            "now": Date.now
        }
    })
    )(vendor__immutable, runtime__minimal);
    const compile__module = ((function ($runtime, runtime__runtime9) {
        const andmap10 = function (f18, l19) {
            if (2 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 0', 2, arguments['length']);
            {
                var f12 = f18;
                var l13 = l19;
                while (true) {
                    return runtime__runtime9['foldl'](function (a16, b17) {
                        if (2 !== arguments['length'])
                            $runtime['raise-arity-error']('anonymous procedure 1', 2, arguments['length']);
                        {
                            var a14 = a16;
                            var b15 = b17;
                            while (true) {
                                if (false !== a14)
                                    return b15;
                                else
                                    return false;
                            }
                        }
                    }, runtime__runtime9['true'], runtime__runtime9['map'](f12, l13));
                }
            }
        };
        const compiled_module11 = function (imports23, exports24, body_code25) {
            if (3 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 2', 3, arguments['length']);
            {
                var imports20 = imports23;
                var exports21 = exports24;
                var body_code22 = body_code25;
                while (true) {
                    if (false !== runtime__runtime9['not'](false !== (false !== (false !== runtime__runtime9['list?'](imports20) ? andmap10(runtime__runtime9['string?'], imports20) : false) ? false !== runtime__runtime9['list?'](exports21) ? andmap10(runtime__runtime9['string?'], exports21) : false : false) ? runtime__runtime9['string?'](body_code22) : false))
                        return runtime__runtime9['error']('compiled-module', 'malformed module declaration');
                    else
                        return runtime__runtime9['obj']('imports', imports20, 'exports', exports21, 'body-code', body_code22);
                }
            }
        };
        return { 'compiled-module': compiled_module11 };
    }))(runtime__minimal, runtime__runtime);
    const compile__parser_tools = ((function ($runtime, runtime__runtime26) {
        const input_has_chars_huh_27 = function (input66, n_chars67) {
            if (2 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 3', 2, arguments['length']);
            {
                var input64 = input66;
                var n_chars65 = n_chars67;
                while (true) {
                    return runtime__runtime26['has'](runtime__runtime26['get'](input64, 'string'), runtime__runtime26['+'](runtime__runtime26['get'](input64, 'index'), runtime__runtime26['-'](n_chars65, 1)));
                }
            }
        };
        const step_input28 = function (input71) {
            if (1 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 4', 1, arguments['length']);
            {
                var input68 = input71;
                while (true) {
                    const pos69 = runtime__runtime26['get'](input68, 'srcpos');
                    const index70 = runtime__runtime26['get'](input68, 'index');
                    return runtime__runtime26['assoc'](runtime__runtime26['assoc'](input68, 'index', runtime__runtime26['+'](1, index70)), 'srcpos', false !== runtime__runtime26['==='](runtime__runtime26['newline'], runtime__runtime26['get'](runtime__runtime26['get'](input68, 'string'), index70)) ? runtime__runtime26['obj']('line', runtime__runtime26['+'](1, runtime__runtime26['get'](pos69, 'line')), 'column', 0) : runtime__runtime26['obj']('line', runtime__runtime26['get'](pos69, 'line'), 'column', runtime__runtime26['+'](1, runtime__runtime26['get'](pos69, 'column'))));
                }
            }
        };
        const advance_input29 = function (input78, n_chars79) {
            if (2 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 5', 2, arguments['length']);
            {
                var input72 = input78;
                var n_chars73 = n_chars79;
                while (true) {
                    {
                        var n_chars74 = n_chars73;
                        var input75 = input72;
                        while (true) {
                            if (false !== runtime__runtime26['='](0, n_chars74))
                                return input75;
                            else {
                                const tmp76 = runtime__runtime26['-'](n_chars74, 1);
                                const tmp77 = step_input28(input75);
                                n_chars74 = tmp76;
                                input75 = tmp77;
                            }
                        }
                    }
                }
            }
        };
        const input_substring30 = function (start_input82, after_input83) {
            if (2 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 6', 2, arguments['length']);
            {
                var start_input80 = start_input82;
                var after_input81 = after_input83;
                while (true) {
                    return runtime__runtime26['substring'](runtime__runtime26['get'](start_input80, 'string'), runtime__runtime26['get'](start_input80, 'index'), runtime__runtime26['get'](after_input81, 'index'));
                }
            }
        };
        const inputs__gt_srcloc31 = function (start_input86, after_input87) {
            if (2 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 7', 2, arguments['length']);
            {
                var start_input84 = start_input86;
                var after_input85 = after_input87;
                while (true) {
                    return runtime__runtime26['obj']('source', runtime__runtime26['get'](start_input84, 'source'), 'start', runtime__runtime26['get'](start_input84, 'srcpos'), 'end', runtime__runtime26['get'](after_input85, 'srcpos'));
                }
            }
        };
        const with_srcloc32 = function (parser95) {
            if (1 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 8', 1, arguments['length']);
            {
                var parser88 = parser95;
                while (true) {
                    return function (input94) {
                        if (1 !== arguments['length'])
                            $runtime['raise-arity-error']('anonymous procedure 9', 1, arguments['length']);
                        {
                            var input89 = input94;
                            while (true) {
                                const res90 = parser88(input89);
                                if (false !== runtime__runtime26['get'](res90, 'position')) {
                                    const loc91 = inputs__gt_srcloc31(input89, runtime__runtime26['get'](res90, 'position'));
                                    const new_result92 = runtime__runtime26['assoc'](runtime__runtime26['get'](res90, 'result'), 'loc', loc91);
                                    const _93 = false !== runtime__runtime26['not'](runtime__runtime26['has'](res90, 'result')) ? runtime__runtime26['error']('with-srcloc', runtime__runtime26['string-append']('term does not have result: ', runtime__runtime26['to-string'](res90))) : runtime__runtime26['null'];
                                    return runtime__runtime26['assoc'](res90, 'result', new_result92);
                                } else
                                    return res90;
                            }
                        }
                    };
                }
            }
        };
        const test_input_rep33 = function (args101) {
            if (1 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 10', 1, arguments['length']);
            {
                var args96 = args101;
                while (true) {
                    const init97 = runtime__runtime26['obj']('string', runtime__runtime26['string-append']('foo', runtime__runtime26['newline'], 'bar'), 'index', 0, 'srcpos', runtime__runtime26['obj']('line', 1, 'column', 0));
                    const _198 = runtime__runtime26['displayln'](advance_input29(init97, 3));
                    const _299 = runtime__runtime26['displayln'](advance_input29(init97, 4));
                    const _3100 = runtime__runtime26['displayln'](input_substring30(init97, advance_input29(init97, 3)));
                    return runtime__runtime26['displayln']('not implemented');
                }
            }
        };
        const succeed34 = function (input103) {
            if (1 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 11', 1, arguments['length']);
            {
                var input102 = input103;
                while (true) {
                    return runtime__runtime26['obj']('position', input102, 'failure', runtime__runtime26['list']());
                }
            }
        };
        const fail35 = function (failures105) {
            if (1 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 12', 1, arguments['length']);
            {
                var failures104 = failures105;
                while (true) {
                    return runtime__runtime26['obj']('position', runtime__runtime26['false'], 'failure', failures104);
                }
            }
        };
        const string__p36 = function (to_match111) {
            if (1 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 13', 1, arguments['length']);
            {
                var to_match106 = to_match111;
                while (true) {
                    return function (input110) {
                        if (1 !== arguments['length'])
                            $runtime['raise-arity-error']('anonymous procedure 14', 1, arguments['length']);
                        {
                            var input107 = input110;
                            while (true) {
                                const sz108 = runtime__runtime26['size'](to_match106);
                                if (false !== input_has_chars_huh_27(input107, sz108)) {
                                    const next_input109 = advance_input29(input107, sz108);
                                    if (false !== runtime__runtime26['==='](to_match106, input_substring30(input107, next_input109)))
                                        return succeed34(next_input109);
                                    else
                                        return fail35(runtime__runtime26['list'](runtime__runtime26['obj']('expected', runtime__runtime26['string-append']('string ', to_match106), 'position', input107)));
                                } else
                                    return fail35(runtime__runtime26['list'](runtime__runtime26['obj']('expected', runtime__runtime26['string-append']('string ', to_match106), 'position', input107)));
                            }
                        }
                    };
                }
            }
        };
        const c_pred37 = function (pred116, description117) {
            if (2 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 15', 2, arguments['length']);
            {
                var pred112 = pred116;
                var description113 = description117;
                while (true) {
                    return function (input115) {
                        if (1 !== arguments['length'])
                            $runtime['raise-arity-error']('anonymous procedure 16', 1, arguments['length']);
                        {
                            var input114 = input115;
                            while (true) {
                                if (false !== input_has_chars_huh_27(input114, 1))
                                    if (false !== pred112(runtime__runtime26['get'](runtime__runtime26['get'](input114, 'string'), runtime__runtime26['get'](input114, 'index'))))
                                        return succeed34(step_input28(input114));
                                    else
                                        return fail35(runtime__runtime26['list'](runtime__runtime26['obj']('expected', description113, 'position', input114)));
                                else
                                    return fail35(runtime__runtime26['list'](runtime__runtime26['obj']('expected', description113, 'position', input114)));
                            }
                        }
                    };
                }
            }
        };
        const c38 = function (to_match121) {
            if (1 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 17', 1, arguments['length']);
            {
                var to_match118 = to_match121;
                while (true) {
                    return c_pred37(function (ch120) {
                        if (1 !== arguments['length'])
                            $runtime['raise-arity-error']('anonymous procedure 18', 1, arguments['length']);
                        {
                            var ch119 = ch120;
                            while (true) {
                                return runtime__runtime26['==='](ch119, to_match118);
                            }
                        }
                    }, runtime__runtime26['string-append']('character \'', to_match118, '\''));
                }
            }
        };
        const c_not39 = runtime__runtime26['variadic'](function (to_match125) {
            if (1 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 19', 1, arguments['length']);
            {
                var to_match122 = to_match125;
                while (true) {
                    return c_pred37(function (ch124) {
                        if (1 !== arguments['length'])
                            $runtime['raise-arity-error']('anonymous procedure 20', 1, arguments['length']);
                        {
                            var ch123 = ch124;
                            while (true) {
                                return runtime__runtime26['not'](runtime__runtime26['contains'](to_match122, ch123));
                            }
                        }
                    }, runtime__runtime26['string-append']('not ', runtime__runtime26['to-string'](to_match122)));
                }
            }
        });
        const c_range40 = function (lower130, upper131) {
            if (2 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 21', 2, arguments['length']);
            {
                var lower126 = lower130;
                var upper127 = upper131;
                while (true) {
                    return c_pred37(function (ch129) {
                        if (1 !== arguments['length'])
                            $runtime['raise-arity-error']('anonymous procedure 22', 1, arguments['length']);
                        {
                            var ch128 = ch129;
                            while (true) {
                                if (false !== runtime__runtime26['>='](runtime__runtime26['character-code'](ch128), runtime__runtime26['character-code'](lower126)))
                                    return runtime__runtime26['<='](runtime__runtime26['character-code'](ch128), runtime__runtime26['character-code'](upper127));
                                else
                                    return false;
                            }
                        }
                    }, runtime__runtime26['string-append']('range \'', lower126, '\' to \'', upper127, '\''));
                }
            }
        };
        const empty41 = function (input133) {
            if (1 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 23', 1, arguments['length']);
            {
                var input132 = input133;
                while (true) {
                    return succeed34(input132);
                }
            }
        };
        const eof42 = function (input135) {
            if (1 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 24', 1, arguments['length']);
            {
                var input134 = input135;
                while (true) {
                    if (false !== runtime__runtime26['='](runtime__runtime26['get'](input134, 'index'), runtime__runtime26['size'](runtime__runtime26['get'](input134, 'string'))))
                        return succeed34(input134);
                    else
                        return fail35(runtime__runtime26['list'](runtime__runtime26['obj']('expected', 'end of file', 'position', input134)));
                }
            }
        };
        const merge_failures43 = function (l138, r139) {
            if (2 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 25', 2, arguments['length']);
            {
                var l136 = l138;
                var r137 = r139;
                while (true) {
                    if (false !== runtime__runtime26['empty?'](l136))
                        return r137;
                    else if (false !== runtime__runtime26['empty?'](r137))
                        return l136;
                    else if (false !== runtime__runtime26['>'](runtime__runtime26['get'](runtime__runtime26['get'](runtime__runtime26['first'](r137), 'position'), 'index'), runtime__runtime26['get'](runtime__runtime26['get'](runtime__runtime26['first'](l136), 'position'), 'index')))
                        return r137;
                    else if (false !== runtime__runtime26['>'](runtime__runtime26['get'](runtime__runtime26['get'](runtime__runtime26['first'](l136), 'position'), 'index'), runtime__runtime26['get'](runtime__runtime26['get'](runtime__runtime26['first'](r137), 'position'), 'index')))
                        return l136;
                    else
                        return runtime__runtime26['append'](l136, r137);
                }
            }
        };
        const seq44 = runtime__runtime26['variadic'](function (parsers153) {
            if (1 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 26', 1, arguments['length']);
            {
                var parsers140 = parsers153;
                while (true) {
                    return function (input152) {
                        if (1 !== arguments['length'])
                            $runtime['raise-arity-error']('anonymous procedure 27', 1, arguments['length']);
                        {
                            var input141 = input152;
                            while (true) {
                                {
                                    var parsers142 = parsers140;
                                    var current_input143 = input141;
                                    var results144 = runtime__runtime26['list']();
                                    var failures145 = runtime__runtime26['list']();
                                    while (true) {
                                        if (false !== (false !== current_input143 ? runtime__runtime26['not'](runtime__runtime26['empty?'](parsers142)) : false)) {
                                            const res146 = runtime__runtime26['first'](parsers142)(current_input143);
                                            {
                                                const tmp147 = runtime__runtime26['rest'](parsers142);
                                                const tmp148 = runtime__runtime26['get'](res146, 'position');
                                                const tmp149 = false !== runtime__runtime26['has'](res146, 'result') ? runtime__runtime26['cons'](runtime__runtime26['get'](res146, 'result'), results144) : results144;
                                                const tmp150 = merge_failures43(failures145, runtime__runtime26['get'](res146, 'failure'));
                                                parsers142 = tmp147;
                                                current_input143 = tmp148;
                                                results144 = tmp149;
                                                failures145 = tmp150;
                                            }
                                        } else {
                                            const res151 = runtime__runtime26['obj']('position', current_input143, 'failure', failures145);
                                            if (false !== runtime__runtime26['empty?'](results144))
                                                return res151;
                                            else if (false !== runtime__runtime26['='](runtime__runtime26['size'](results144), 1))
                                                return runtime__runtime26['assoc'](res151, 'result', runtime__runtime26['first'](results144));
                                            else
                                                return runtime__runtime26['assoc'](res151, 'result', runtime__runtime26['reverse'](results144));
                                        }
                                    }
                                }
                            }
                        }
                    };
                }
            }
        });
        const or__p45 = runtime__runtime26['variadic'](function (parsers163) {
            if (1 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 28', 1, arguments['length']);
            {
                var parsers154 = parsers163;
                while (true) {
                    return function (input162) {
                        if (1 !== arguments['length'])
                            $runtime['raise-arity-error']('anonymous procedure 29', 1, arguments['length']);
                        {
                            var input155 = input162;
                            while (true) {
                                {
                                    var parsers156 = parsers154;
                                    var failures157 = runtime__runtime26['list']();
                                    while (true) {
                                        if (false !== runtime__runtime26['empty?'](parsers156))
                                            return fail35(failures157);
                                        else {
                                            const res158 = runtime__runtime26['first'](parsers156)(input155);
                                            const merged159 = merge_failures43(failures157, runtime__runtime26['get'](res158, 'failure'));
                                            if (false !== runtime__runtime26['get'](res158, 'position'))
                                                return runtime__runtime26['assoc'](res158, 'failure', merged159);
                                            else {
                                                const tmp160 = runtime__runtime26['rest'](parsers156);
                                                const tmp161 = merged159;
                                                parsers156 = tmp160;
                                                failures157 = tmp161;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    };
                }
            }
        });
        const one_or_more46 = function (parser169) {
            if (1 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 30', 1, arguments['length']);
            {
                var parser164 = parser169;
                while (true) {
                    const self165 = runtime__runtime26['box'](runtime__runtime26['null']);
                    const _166 = runtime__runtime26['set-box!'](self165, seq44(parser164, or__p45(function (input168) {
                        if (1 !== arguments['length'])
                            $runtime['raise-arity-error']('anonymous procedure 31', 1, arguments['length']);
                        {
                            var input167 = input168;
                            while (true) {
                                return runtime__runtime26['unbox'](self165)(input167);
                            }
                        }
                    }, empty41)));
                    return runtime__runtime26['unbox'](self165);
                }
            }
        };
        const zero_or_more47 = function (parser175) {
            if (1 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 32', 1, arguments['length']);
            {
                var parser170 = parser175;
                while (true) {
                    const self171 = runtime__runtime26['box'](runtime__runtime26['null']);
                    const _172 = runtime__runtime26['set-box!'](self171, or__p45(seq44(parser170, function (input174) {
                        if (1 !== arguments['length'])
                            $runtime['raise-arity-error']('anonymous procedure 33', 1, arguments['length']);
                        {
                            var input173 = input174;
                            while (true) {
                                return runtime__runtime26['unbox'](self171)(input173);
                            }
                        }
                    }), empty41));
                    return runtime__runtime26['unbox'](self171);
                }
            }
        };
        const describe48 = function (name182, parser183) {
            if (2 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 34', 2, arguments['length']);
            {
                var name176 = name182;
                var parser177 = parser183;
                while (true) {
                    return function (input181) {
                        if (1 !== arguments['length'])
                            $runtime['raise-arity-error']('anonymous procedure 35', 1, arguments['length']);
                        {
                            var input178 = input181;
                            while (true) {
                                const res179 = parser177(input178);
                                const failures180 = runtime__runtime26['get'](res179, 'failure');
                                if (false !== (false !== runtime__runtime26['not'](runtime__runtime26['empty?'](failures180)) ? runtime__runtime26['='](runtime__runtime26['get'](input178, 'index'), runtime__runtime26['get'](runtime__runtime26['get'](runtime__runtime26['first'](failures180), 'position'), 'index')) : false))
                                    return runtime__runtime26['assoc'](res179, 'failure', runtime__runtime26['list'](runtime__runtime26['obj']('expected', name176, 'position', input178)));
                                else
                                    return res179;
                            }
                        }
                    };
                }
            }
        };
        const nonterm49 = function (description190, f191) {
            if (2 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 36', 2, arguments['length']);
            {
                var description184 = description190;
                var f185 = f191;
                while (true) {
                    const p186 = runtime__runtime26['box'](runtime__runtime26['false']);
                    return describe48(description184, function (input189) {
                        if (1 !== arguments['length'])
                            $runtime['raise-arity-error']('anonymous procedure 37', 1, arguments['length']);
                        {
                            var input187 = input189;
                            while (true) {
                                const _188 = false !== runtime__runtime26['not'](runtime__runtime26['unbox'](p186)) ? runtime__runtime26['set-box!'](p186, f185()) : runtime__runtime26['null'];
                                return runtime__runtime26['unbox'](p186)(input187);
                            }
                        }
                    });
                }
            }
        };
        const action50 = function (parser197, f198) {
            if (2 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 38', 2, arguments['length']);
            {
                var parser192 = parser197;
                var f193 = f198;
                while (true) {
                    return function (input196) {
                        if (1 !== arguments['length'])
                            $runtime['raise-arity-error']('anonymous procedure 39', 1, arguments['length']);
                        {
                            var input194 = input196;
                            while (true) {
                                const res195 = parser192(input194);
                                if (false !== runtime__runtime26['get'](res195, 'position'))
                                    return runtime__runtime26['assoc'](res195, 'result', f193(false !== runtime__runtime26['has'](res195, 'result') ? runtime__runtime26['get'](res195, 'result') : runtime__runtime26['null']));
                                else
                                    return res195;
                            }
                        }
                    };
                }
            }
        };
        const apply_action51 = function (parser203, f204) {
            if (2 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 40', 2, arguments['length']);
            {
                var parser199 = parser203;
                var f200 = f204;
                while (true) {
                    return action50(parser199, function (l202) {
                        if (1 !== arguments['length'])
                            $runtime['raise-arity-error']('anonymous procedure 41', 1, arguments['length']);
                        {
                            var l201 = l202;
                            while (true) {
                                return runtime__runtime26['apply'](f200, l201);
                            }
                        }
                    });
                }
            }
        };
        const capture_string52 = function (parser209) {
            if (1 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 42', 1, arguments['length']);
            {
                var parser205 = parser209;
                while (true) {
                    return function (input208) {
                        if (1 !== arguments['length'])
                            $runtime['raise-arity-error']('anonymous procedure 43', 1, arguments['length']);
                        {
                            var input206 = input208;
                            while (true) {
                                const res207 = parser205(input206);
                                if (false !== runtime__runtime26['get'](res207, 'position'))
                                    return runtime__runtime26['assoc'](res207, 'result', input_substring30(input206, runtime__runtime26['get'](res207, 'position')));
                                else
                                    return res207;
                            }
                        }
                    };
                }
            }
        };
        const parse_failure53 = function (failures216) {
            if (1 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 44', 1, arguments['length']);
            {
                var failures210 = failures216;
                while (true) {
                    const pos211 = runtime__runtime26['get'](runtime__runtime26['get'](runtime__runtime26['first'](failures210), 'position'), 'srcpos');
                    const source212 = runtime__runtime26['get'](runtime__runtime26['get'](runtime__runtime26['first'](failures210), 'position'), 'source');
                    const msgs213 = runtime__runtime26['map'](function (f215) {
                        if (1 !== arguments['length'])
                            $runtime['raise-arity-error']('anonymous procedure 45', 1, arguments['length']);
                        {
                            var f214 = f215;
                            while (true) {
                                return runtime__runtime26['get'](f214, 'expected');
                            }
                        }
                    }, failures210);
                    return runtime__runtime26['error'](runtime__runtime26['string-append']('Parse error at ', source212, ':', runtime__runtime26['number->string'](runtime__runtime26['get'](pos211, 'line')), ':', runtime__runtime26['number->string'](runtime__runtime26['get'](pos211, 'column')), '. Expected one of'), runtime__runtime26['string-append'](runtime__runtime26['string-join'](msgs213, ', ')));
                }
            }
        };
        const parse54 = function (grammar220, input221) {
            if (2 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 46', 2, arguments['length']);
            {
                var grammar217 = grammar220;
                var input218 = input221;
                while (true) {
                    const res219 = grammar217(input218);
                    if (false !== runtime__runtime26['not'](runtime__runtime26['get'](res219, 'position')))
                        return parse_failure53(runtime__runtime26['get'](res219, 'failure'));
                    else
                        return res219;
                }
            }
        };
        const whitespace55 = describe48('whitespace', one_or_more46(describe48('whitespace', or__p45(c38(' '), c38(runtime__runtime26['newline'])))));
        const digit56 = describe48('digit', c_range40('0', '9'));
        const alpha57 = describe48('letter', or__p45(c_range40('a', 'z'), c_range40('A', 'Z')));
        const empty_as_list58 = action50(empty41, function (ignore223) {
            if (1 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 47', 1, arguments['length']);
            {
                var ignore222 = ignore223;
                while (true) {
                    return runtime__runtime26['list']();
                }
            }
        });
        const module_segment59 = seq44(alpha57, zero_or_more47(or__p45(alpha57, digit56)));
        const module_name60 = describe48('module name', capture_string52(seq44(module_segment59, zero_or_more47(seq44(c38('/'), module_segment59)))));
        const idchar61 = nonterm49('identifier character', function () {
            if (0 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 48', 0, arguments['length']);
            {
                while (true) {
                    return or__p45(alpha57, c38('+'), c38('-'), c38('*'), c38('%'), c38('='), c38('!'), c38('<'), c38('>'), c38('-'), c38('/'), c38('?'), c38('_'));
                }
            }
        });
        const id_string62 = capture_string52(seq44(idchar61, zero_or_more47(or__p45(digit56, idchar61))));
        const newline__p63 = c_pred37(function (ch225) {
            if (1 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 49', 1, arguments['length']);
            {
                var ch224 = ch225;
                while (true) {
                    return runtime__runtime26['==='](ch224, runtime__runtime26['newline']);
                }
            }
        }, 'newline');
        return {
            'test-input-rep': test_input_rep33,
            'with-srcloc': with_srcloc32,
            'c': c38,
            'c-not': c_not39,
            'c-range': c_range40,
            'string/p': string__p36,
            'empty': empty41,
            'seq': seq44,
            'or/p': or__p45,
            'eof': eof42,
            'one-or-more': one_or_more46,
            'zero-or-more': zero_or_more47,
            'describe': describe48,
            'nonterm': nonterm49,
            'action': action50,
            'apply-action': apply_action51,
            'capture-string': capture_string52,
            'parse': parse54,
            'whitespace': whitespace55,
            'alpha': alpha57,
            'digit': digit56,
            'empty-as-list': empty_as_list58,
            'module-name': module_name60,
            'id-string': id_string62,
            'idchar': idchar61,
            'newline/p': newline__p63
        };
    }))(runtime__minimal, runtime__runtime);
    const lang__js = ((function ($runtime, runtime__runtime6, compile__module7, compile__parser_tools8) {
        const header226 = function (name233, el234) {
            if (2 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 50', 2, arguments['length']);
            {
                var name229 = name233;
                var el230 = el234;
                while (true) {
                    const comma_list231 = compile__parser_tools8['nonterm'](runtime__runtime6['string-append'](name229, ' list'), function () {
                        if (0 !== arguments['length'])
                            $runtime['raise-arity-error']('anonymous procedure 51', 0, arguments['length']);
                        {
                            while (true) {
                                return compile__parser_tools8['apply-action'](compile__parser_tools8['seq'](el230, tail232), runtime__runtime6['cons']);
                            }
                        }
                    });
                    const tail232 = compile__parser_tools8['or/p'](compile__parser_tools8['seq'](compile__parser_tools8['string/p'](', '), comma_list231), compile__parser_tools8['empty-as-list']);
                    return compile__parser_tools8['seq'](compile__parser_tools8['string/p']('// '), compile__parser_tools8['string/p'](name229), compile__parser_tools8['c'](':'), compile__parser_tools8['or/p'](compile__parser_tools8['seq'](compile__parser_tools8['c'](' '), comma_list231), compile__parser_tools8['empty-as-list']));
                }
            }
        };
        const compile_js227 = function (input238, runner239) {
            if (2 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 52', 2, arguments['length']);
            {
                var input235 = input238;
                var runner236 = runner239;
                while (true) {
                    const res237 = compile__parser_tools8['parse'](compile__parser_tools8['seq'](header226('require', compile__parser_tools8['module-name']), compile__parser_tools8['c'](runtime__runtime6['newline']), header226('provide', compile__parser_tools8['id-string']), compile__parser_tools8['c'](runtime__runtime6['newline'])), input235);
                    if (false !== (false !== runtime__runtime6['get'](res237, 'position') ? runtime__runtime6['<='](runtime__runtime6['get'](runtime__runtime6['get'](res237, 'position'), 'index'), runtime__runtime6['size'](runtime__runtime6['get'](input235, 'string'))) : false))
                        return compile__module7['compiled-module'](runtime__runtime6['get'](runtime__runtime6['get'](res237, 'result'), 0), runtime__runtime6['get'](runtime__runtime6['get'](res237, 'result'), 1), runtime__runtime6['substring'](runtime__runtime6['get'](input235, 'string'), runtime__runtime6['get'](runtime__runtime6['get'](res237, 'position'), 'index'), runtime__runtime6['size'](runtime__runtime6['get'](input235, 'string'))));
                    else
                        return runtime__runtime6['error']('compile-language', res237);
                }
            }
        };
        const compile_language228 = compile_js227;
        return {
            'compile-js': compile_js227,
            'compile-language': compile_language228
        };
    }))(runtime__minimal, runtime__runtime, compile__module, compile__parser_tools);
    const compile__reader = ((function ($runtime, runtime__runtime243, compile__parser_tools244) {
        const sexp245 = compile__parser_tools244['nonterm']('s-expression', function () {
            if (0 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 53', 0, arguments['length']);
            {
                while (true) {
                    return compile__parser_tools244['or/p'](id248, integer250, string251, keyword249, compile__parser_tools244['seq'](compile__parser_tools244['c']('('), sexp_list246, compile__parser_tools244['c'](')')), compile__parser_tools244['seq'](compile__parser_tools244['c']('['), sexp_list246, compile__parser_tools244['c'](']')));
                }
            }
        });
        const sexp_list246 = compile__parser_tools244['nonterm']('list of s-expressions', function () {
            if (0 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 54', 0, arguments['length']);
            {
                while (true) {
                    return compile__parser_tools244['or/p'](compile__parser_tools244['seq'](compile__parser_tools244['whitespace'], sexp_list246), compile__parser_tools244['seq'](comment247, sexp_list246), compile__parser_tools244['apply-action'](compile__parser_tools244['seq'](sexp245, compile__parser_tools244['or/p'](compile__parser_tools244['seq'](compile__parser_tools244['whitespace'], sexp_list246), compile__parser_tools244['empty-as-list'])), runtime__runtime243['cons']), compile__parser_tools244['empty-as-list']);
                }
            }
        });
        const comment247 = compile__parser_tools244['nonterm']('comment', function () {
            if (0 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 55', 0, arguments['length']);
            {
                while (true) {
                    return compile__parser_tools244['seq'](compile__parser_tools244['c'](';'), compile__parser_tools244['zero-or-more'](compile__parser_tools244['describe']('comment body', compile__parser_tools244['c-not'](runtime__runtime243['newline']))), compile__parser_tools244['newline/p']);
                }
            }
        });
        const id248 = compile__parser_tools244['nonterm']('identifier', function () {
            if (0 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 56', 0, arguments['length']);
            {
                while (true) {
                    return compile__parser_tools244['action'](compile__parser_tools244['id-string'], runtime__runtime243['make-identifier']);
                }
            }
        });
        const keyword249 = compile__parser_tools244['nonterm']('keyword', function () {
            if (0 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 57', 0, arguments['length']);
            {
                while (true) {
                    return compile__parser_tools244['action'](compile__parser_tools244['seq'](compile__parser_tools244['c'](':'), compile__parser_tools244['capture-string'](compile__parser_tools244['one-or-more'](compile__parser_tools244['or/p'](compile__parser_tools244['digit'], compile__parser_tools244['idchar'])))), runtime__runtime243['make-keyword']);
                }
            }
        });
        const integer250 = compile__parser_tools244['nonterm']('integer', function () {
            if (0 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 58', 0, arguments['length']);
            {
                while (true) {
                    return compile__parser_tools244['action'](compile__parser_tools244['capture-string'](compile__parser_tools244['or/p'](compile__parser_tools244['c']('0'), compile__parser_tools244['seq'](compile__parser_tools244['c-range']('1', '9'), compile__parser_tools244['zero-or-more'](compile__parser_tools244['digit'])))), runtime__runtime243['string->integer']);
                }
            }
        });
        const string251 = compile__parser_tools244['nonterm']('string', function () {
            if (0 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 59', 0, arguments['length']);
            {
                while (true) {
                    return compile__parser_tools244['seq'](compile__parser_tools244['c'](runtime__runtime243['double-quote']), compile__parser_tools244['capture-string'](compile__parser_tools244['zero-or-more'](compile__parser_tools244['describe']('string body', compile__parser_tools244['c-not'](runtime__runtime243['double-quote'])))), compile__parser_tools244['c'](runtime__runtime243['double-quote']));
                }
            }
        });
        const top252 = compile__parser_tools244['seq'](sexp_list246, compile__parser_tools244['eof']);
        const read253 = function (input257) {
            if (1 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 60', 1, arguments['length']);
            {
                var input255 = input257;
                while (true) {
                    const res256 = compile__parser_tools244['parse'](top252, input255);
                    if (false !== runtime__runtime243['='](runtime__runtime243['size'](runtime__runtime243['get'](input255, 'string')), runtime__runtime243['get'](runtime__runtime243['get'](res256, 'position'), 'index')))
                        return runtime__runtime243['get'](res256, 'result');
                    else
                        return runtime__runtime243['error']('read', res256);
                }
            }
        };
        const main254 = function (args261) {
            if (1 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 61', 1, arguments['length']);
            {
                var args258 = args261;
                while (true) {
                    return runtime__runtime243['read-stdin'](function (s260) {
                        if (1 !== arguments['length'])
                            $runtime['raise-arity-error']('anonymous procedure 62', 1, arguments['length']);
                        {
                            var s259 = s260;
                            while (true) {
                                return runtime__runtime243['displayln'](read253(runtime__runtime243['obj']('string', s259, 'source', 'stdin', 'index', 0, 'srcpos', runtime__runtime243['obj']('line', 1, 'column', 0))));
                            }
                        }
                    });
                }
            }
        };
        return {
            'main': main254,
            'read': read253
        };
    }))(runtime__minimal, runtime__runtime, compile__parser_tools);
    const vendor__escodegen = ((function () {
      function require(file, parentModule) {
        if ({}.hasOwnProperty.call(require.cache, file))
          return require.cache[file];
        var resolved = require.resolve(file);
        if (!resolved)
          throw new Error('Failed to resolve module ' + file);
        var module$ = {
            id: file,
            require: require,
            filename: file,
            exports: {},
            loaded: false,
            parent: parentModule,
            children: []
          };
        if (parentModule)
          parentModule.children.push(module$);
        var dirname = file.slice(0, file.lastIndexOf('/') + 1);
        require.cache[file] = module$.exports;
        resolved.call(module$.exports, module$, module$.exports, dirname, file);
        module$.loaded = true;
        return require.cache[file] = module$.exports;
      }
      require.modules = {};
      require.cache = {};
      require.resolve = function (file) {
        return {}.hasOwnProperty.call(require.modules, file) ? require.modules[file] : void 0;
      };
      require.define = function (file, fn) {
        require.modules[file] = fn;
      };
      var process = function () {
          var cwd = '/';
          return {
            title: 'browser',
            version: 'v8.4.0',
            browser: true,
            env: {},
            argv: [],
            nextTick: setImmediate || function (fn) {
              setTimeout(fn, 0);
            },
            cwd: function () {
              return cwd;
            },
            chdir: function (dir) {
              cwd = dir;
            }
          };
        }();
      require.define('/tools/entry-point.js', function (module, exports, __dirname, __filename) {
        (function () {
          'use strict';
          global.escodegen = require('/escodegen.js', module);
          escodegen.browser = true;
        }());
      });
      require.define('/escodegen.js', function (module, exports, __dirname, __filename) {
        (function () {
          'use strict';
          var Syntax, Precedence, BinaryPrecedence, SourceNode, estraverse, esutils, isArray, base, indent, json, renumber, hexadecimal, quotes, escapeless, newline, space, parentheses, semicolons, safeConcatenation, directive, extra, parse, sourceMap, sourceCode, preserveBlankLines, FORMAT_MINIFY, FORMAT_DEFAULTS;
          estraverse = require('/node_modules/estraverse/estraverse.js', module);
          esutils = require('/node_modules/esutils/lib/utils.js', module);
          Syntax = estraverse.Syntax;
          function isExpression(node) {
            return CodeGenerator.Expression.hasOwnProperty(node.type);
          }
          function isStatement(node) {
            return CodeGenerator.Statement.hasOwnProperty(node.type);
          }
          Precedence = {
            Sequence: 0,
            Yield: 1,
            Await: 1,
            Assignment: 1,
            Conditional: 2,
            ArrowFunction: 2,
            LogicalOR: 3,
            LogicalAND: 4,
            BitwiseOR: 5,
            BitwiseXOR: 6,
            BitwiseAND: 7,
            Equality: 8,
            Relational: 9,
            BitwiseSHIFT: 10,
            Additive: 11,
            Multiplicative: 12,
            Unary: 13,
            Postfix: 14,
            Call: 15,
            New: 16,
            TaggedTemplate: 17,
            Member: 18,
            Primary: 19
          };
          BinaryPrecedence = {
            '||': Precedence.LogicalOR,
            '&&': Precedence.LogicalAND,
            '|': Precedence.BitwiseOR,
            '^': Precedence.BitwiseXOR,
            '&': Precedence.BitwiseAND,
            '==': Precedence.Equality,
            '!=': Precedence.Equality,
            '===': Precedence.Equality,
            '!==': Precedence.Equality,
            'is': Precedence.Equality,
            'isnt': Precedence.Equality,
            '<': Precedence.Relational,
            '>': Precedence.Relational,
            '<=': Precedence.Relational,
            '>=': Precedence.Relational,
            'in': Precedence.Relational,
            'instanceof': Precedence.Relational,
            '<<': Precedence.BitwiseSHIFT,
            '>>': Precedence.BitwiseSHIFT,
            '>>>': Precedence.BitwiseSHIFT,
            '+': Precedence.Additive,
            '-': Precedence.Additive,
            '*': Precedence.Multiplicative,
            '%': Precedence.Multiplicative,
            '/': Precedence.Multiplicative
          };
          var F_ALLOW_IN = 1, F_ALLOW_CALL = 1 << 1, F_ALLOW_UNPARATH_NEW = 1 << 2, F_FUNC_BODY = 1 << 3, F_DIRECTIVE_CTX = 1 << 4, F_SEMICOLON_OPT = 1 << 5;
          var E_FTT = F_ALLOW_CALL | F_ALLOW_UNPARATH_NEW, E_TTF = F_ALLOW_IN | F_ALLOW_CALL, E_TTT = F_ALLOW_IN | F_ALLOW_CALL | F_ALLOW_UNPARATH_NEW, E_TFF = F_ALLOW_IN, E_FFT = F_ALLOW_UNPARATH_NEW, E_TFT = F_ALLOW_IN | F_ALLOW_UNPARATH_NEW;
          var S_TFFF = F_ALLOW_IN, S_TFFT = F_ALLOW_IN | F_SEMICOLON_OPT, S_FFFF = 0, S_TFTF = F_ALLOW_IN | F_DIRECTIVE_CTX, S_TTFF = F_ALLOW_IN | F_FUNC_BODY;
          function getDefaultOptions() {
            return {
              indent: null,
              base: null,
              parse: null,
              comment: false,
              format: {
                indent: {
                  style: '    ',
                  base: 0,
                  adjustMultilineComment: false
                },
                newline: '\n',
                space: ' ',
                json: false,
                renumber: false,
                hexadecimal: false,
                quotes: 'single',
                escapeless: false,
                compact: false,
                parentheses: true,
                semicolons: true,
                safeConcatenation: false,
                preserveBlankLines: false
              },
              moz: {
                comprehensionExpressionStartsWithAssignment: false,
                starlessGenerator: false
              },
              sourceMap: null,
              sourceMapRoot: null,
              sourceMapWithCode: false,
              directive: false,
              raw: true,
              verbatim: null,
              sourceCode: null
            };
          }
          function stringRepeat(str, num) {
            var result = '';
            for (num |= 0; num > 0; num >>>= 1, str += str) {
              if (num & 1) {
                result += str;
              }
            }
            return result;
          }
          isArray = Array.isArray;
          if (!isArray) {
            isArray = function isArray(array) {
              return Object.prototype.toString.call(array) === '[object Array]';
            };
          }
          function hasLineTerminator(str) {
            return /[\r\n]/g.test(str);
          }
          function endsWithLineTerminator(str) {
            var len = str.length;
            return len && esutils.code.isLineTerminator(str.charCodeAt(len - 1));
          }
          function merge(target, override) {
            var key;
            for (key in override) {
              if (override.hasOwnProperty(key)) {
                target[key] = override[key];
              }
            }
            return target;
          }
          function updateDeeply(target, override) {
            var key, val;
            function isHashObject(target) {
              return typeof target === 'object' && target instanceof Object && !(target instanceof RegExp);
            }
            for (key in override) {
              if (override.hasOwnProperty(key)) {
                val = override[key];
                if (isHashObject(val)) {
                  if (isHashObject(target[key])) {
                    updateDeeply(target[key], val);
                  } else {
                    target[key] = updateDeeply({}, val);
                  }
                } else {
                  target[key] = val;
                }
              }
            }
            return target;
          }
          function generateNumber(value) {
            var result, point, temp, exponent, pos;
            if (value !== value) {
              throw new Error('Numeric literal whose value is NaN');
            }
            if (value < 0 || value === 0 && 1 / value < 0) {
              throw new Error('Numeric literal whose value is negative');
            }
            if (value === 1 / 0) {
              return json ? 'null' : renumber ? '1e400' : '1e+400';
            }
            result = '' + value;
            if (!renumber || result.length < 3) {
              return result;
            }
            point = result.indexOf('.');
            if (!json && result.charCodeAt(0) === 48 && point === 1) {
              point = 0;
              result = result.slice(1);
            }
            temp = result;
            result = result.replace('e+', 'e');
            exponent = 0;
            if ((pos = temp.indexOf('e')) > 0) {
              exponent = +temp.slice(pos + 1);
              temp = temp.slice(0, pos);
            }
            if (point >= 0) {
              exponent -= temp.length - point - 1;
              temp = +(temp.slice(0, point) + temp.slice(point + 1)) + '';
            }
            pos = 0;
            while (temp.charCodeAt(temp.length + pos - 1) === 48) {
              --pos;
            }
            if (pos !== 0) {
              exponent -= pos;
              temp = temp.slice(0, pos);
            }
            if (exponent !== 0) {
              temp += 'e' + exponent;
            }
            if ((temp.length < result.length || hexadecimal && value > 1e12 && Math.floor(value) === value && (temp = '0x' + value.toString(16)).length < result.length) && +temp === value) {
              result = temp;
            }
            return result;
          }
          function escapeRegExpCharacter(ch, previousIsBackslash) {
            if ((ch & ~1) === 8232) {
              return (previousIsBackslash ? 'u' : '\\u') + (ch === 8232 ? '2028' : '2029');
            } else if (ch === 10 || ch === 13) {
              return (previousIsBackslash ? '' : '\\') + (ch === 10 ? 'n' : 'r');
            }
            return String.fromCharCode(ch);
          }
          function generateRegExp(reg) {
            var match, result, flags, i, iz, ch, characterInBrack, previousIsBackslash;
            result = reg.toString();
            if (reg.source) {
              match = result.match(/\/([^\/]*)$/);
              if (!match) {
                return result;
              }
              flags = match[1];
              result = '';
              characterInBrack = false;
              previousIsBackslash = false;
              for (i = 0, iz = reg.source.length; i < iz; ++i) {
                ch = reg.source.charCodeAt(i);
                if (!previousIsBackslash) {
                  if (characterInBrack) {
                    if (ch === 93) {
                      characterInBrack = false;
                    }
                  } else {
                    if (ch === 47) {
                      result += '\\';
                    } else if (ch === 91) {
                      characterInBrack = true;
                    }
                  }
                  result += escapeRegExpCharacter(ch, previousIsBackslash);
                  previousIsBackslash = ch === 92;
                } else {
                  result += escapeRegExpCharacter(ch, previousIsBackslash);
                  previousIsBackslash = false;
                }
              }
              return '/' + result + '/' + flags;
            }
            return result;
          }
          function escapeAllowedCharacter(code, next) {
            var hex;
            if (code === 8) {
              return '\\b';
            }
            if (code === 12) {
              return '\\f';
            }
            if (code === 9) {
              return '\\t';
            }
            hex = code.toString(16).toUpperCase();
            if (json || code > 255) {
              return '\\u' + '0000'.slice(hex.length) + hex;
            } else if (code === 0 && !esutils.code.isDecimalDigit(next)) {
              return '\\0';
            } else if (code === 11) {
              return '\\x0B';
            } else {
              return '\\x' + '00'.slice(hex.length) + hex;
            }
          }
          function escapeDisallowedCharacter(code) {
            if (code === 92) {
              return '\\\\';
            }
            if (code === 10) {
              return '\\n';
            }
            if (code === 13) {
              return '\\r';
            }
            if (code === 8232) {
              return '\\u2028';
            }
            if (code === 8233) {
              return '\\u2029';
            }
            throw new Error('Incorrectly classified character');
          }
          function escapeDirective(str) {
            var i, iz, code, quote;
            quote = quotes === 'double' ? '"' : "'";
            for (i = 0, iz = str.length; i < iz; ++i) {
              code = str.charCodeAt(i);
              if (code === 39) {
                quote = '"';
                break;
              } else if (code === 34) {
                quote = "'";
                break;
              } else if (code === 92) {
                ++i;
              }
            }
            return quote + str + quote;
          }
          function escapeString(str) {
            var result = '', i, len, code, singleQuotes = 0, doubleQuotes = 0, single, quote;
            for (i = 0, len = str.length; i < len; ++i) {
              code = str.charCodeAt(i);
              if (code === 39) {
                ++singleQuotes;
              } else if (code === 34) {
                ++doubleQuotes;
              } else if (code === 47 && json) {
                result += '\\';
              } else if (esutils.code.isLineTerminator(code) || code === 92) {
                result += escapeDisallowedCharacter(code);
                continue;
              } else if (!esutils.code.isIdentifierPartES5(code) && (json && code < 32 || !json && !escapeless && (code < 32 || code > 126))) {
                result += escapeAllowedCharacter(code, str.charCodeAt(i + 1));
                continue;
              }
              result += String.fromCharCode(code);
            }
            single = !(quotes === 'double' || quotes === 'auto' && doubleQuotes < singleQuotes);
            quote = single ? "'" : '"';
            if (!(single ? singleQuotes : doubleQuotes)) {
              return quote + result + quote;
            }
            str = result;
            result = quote;
            for (i = 0, len = str.length; i < len; ++i) {
              code = str.charCodeAt(i);
              if (code === 39 && single || code === 34 && !single) {
                result += '\\';
              }
              result += String.fromCharCode(code);
            }
            return result + quote;
          }
          function flattenToString(arr) {
            var i, iz, elem, result = '';
            for (i = 0, iz = arr.length; i < iz; ++i) {
              elem = arr[i];
              result += isArray(elem) ? flattenToString(elem) : elem;
            }
            return result;
          }
          function toSourceNodeWhenNeeded(generated, node) {
            if (!sourceMap) {
              if (isArray(generated)) {
                return flattenToString(generated);
              } else {
                return generated;
              }
            }
            if (node == null) {
              if (generated instanceof SourceNode) {
                return generated;
              } else {
                node = {};
              }
            }
            if (node.loc == null) {
              return new SourceNode(null, null, sourceMap, generated, node.name || null);
            }
            return new SourceNode(node.loc.start.line, node.loc.start.column, sourceMap === true ? node.loc.source || null : sourceMap, generated, node.name || null);
          }
          function noEmptySpace() {
            return space ? space : ' ';
          }
          function join(left, right) {
            var leftSource, rightSource, leftCharCode, rightCharCode;
            leftSource = toSourceNodeWhenNeeded(left).toString();
            if (leftSource.length === 0) {
              return [right];
            }
            rightSource = toSourceNodeWhenNeeded(right).toString();
            if (rightSource.length === 0) {
              return [left];
            }
            leftCharCode = leftSource.charCodeAt(leftSource.length - 1);
            rightCharCode = rightSource.charCodeAt(0);
            if ((leftCharCode === 43 || leftCharCode === 45) && leftCharCode === rightCharCode || esutils.code.isIdentifierPartES5(leftCharCode) && esutils.code.isIdentifierPartES5(rightCharCode) || leftCharCode === 47 && rightCharCode === 105) {
              return [
                left,
                noEmptySpace(),
                right
              ];
            } else if (esutils.code.isWhiteSpace(leftCharCode) || esutils.code.isLineTerminator(leftCharCode) || esutils.code.isWhiteSpace(rightCharCode) || esutils.code.isLineTerminator(rightCharCode)) {
              return [
                left,
                right
              ];
            }
            return [
              left,
              space,
              right
            ];
          }
          function addIndent(stmt) {
            return [
              base,
              stmt
            ];
          }
          function withIndent(fn) {
            var previousBase;
            previousBase = base;
            base += indent;
            fn(base);
            base = previousBase;
          }
          function calculateSpaces(str) {
            var i;
            for (i = str.length - 1; i >= 0; --i) {
              if (esutils.code.isLineTerminator(str.charCodeAt(i))) {
                break;
              }
            }
            return str.length - 1 - i;
          }
          function adjustMultilineComment(value, specialBase) {
            var array, i, len, line, j, spaces, previousBase, sn;
            array = value.split(/\r\n|[\r\n]/);
            spaces = Number.MAX_VALUE;
            for (i = 1, len = array.length; i < len; ++i) {
              line = array[i];
              j = 0;
              while (j < line.length && esutils.code.isWhiteSpace(line.charCodeAt(j))) {
                ++j;
              }
              if (spaces > j) {
                spaces = j;
              }
            }
            if (typeof specialBase !== 'undefined') {
              previousBase = base;
              if (array[1][spaces] === '*') {
                specialBase += ' ';
              }
              base = specialBase;
            } else {
              if (spaces & 1) {
                --spaces;
              }
              previousBase = base;
            }
            for (i = 1, len = array.length; i < len; ++i) {
              sn = toSourceNodeWhenNeeded(addIndent(array[i].slice(spaces)));
              array[i] = sourceMap ? sn.join('') : sn;
            }
            base = previousBase;
            return array.join('\n');
          }
          function generateComment(comment, specialBase) {
            if (comment.type === 'Line') {
              if (endsWithLineTerminator(comment.value)) {
                return '//' + comment.value;
              } else {
                var result = '//' + comment.value;
                if (!preserveBlankLines) {
                  result += '\n';
                }
                return result;
              }
            }
            if (extra.format.indent.adjustMultilineComment && /[\n\r]/.test(comment.value)) {
              return adjustMultilineComment('/*' + comment.value + '*/', specialBase);
            }
            return '/*' + comment.value + '*/';
          }
          function addComments(stmt, result) {
            var i, len, comment, save, tailingToStatement, specialBase, fragment, extRange, range, prevRange, prefix, infix, suffix, count;
            if (stmt.leadingComments && stmt.leadingComments.length > 0) {
              save = result;
              if (preserveBlankLines) {
                comment = stmt.leadingComments[0];
                result = [];
                extRange = comment.extendedRange;
                range = comment.range;
                prefix = sourceCode.substring(extRange[0], range[0]);
                count = (prefix.match(/\n/g) || []).length;
                if (count > 0) {
                  result.push(stringRepeat('\n', count));
                  result.push(addIndent(generateComment(comment)));
                } else {
                  result.push(prefix);
                  result.push(generateComment(comment));
                }
                prevRange = range;
                for (i = 1, len = stmt.leadingComments.length; i < len; i++) {
                  comment = stmt.leadingComments[i];
                  range = comment.range;
                  infix = sourceCode.substring(prevRange[1], range[0]);
                  count = (infix.match(/\n/g) || []).length;
                  result.push(stringRepeat('\n', count));
                  result.push(addIndent(generateComment(comment)));
                  prevRange = range;
                }
                suffix = sourceCode.substring(range[1], extRange[1]);
                count = (suffix.match(/\n/g) || []).length;
                result.push(stringRepeat('\n', count));
              } else {
                comment = stmt.leadingComments[0];
                result = [];
                if (safeConcatenation && stmt.type === Syntax.Program && stmt.body.length === 0) {
                  result.push('\n');
                }
                result.push(generateComment(comment));
                if (!endsWithLineTerminator(toSourceNodeWhenNeeded(result).toString())) {
                  result.push('\n');
                }
                for (i = 1, len = stmt.leadingComments.length; i < len; ++i) {
                  comment = stmt.leadingComments[i];
                  fragment = [generateComment(comment)];
                  if (!endsWithLineTerminator(toSourceNodeWhenNeeded(fragment).toString())) {
                    fragment.push('\n');
                  }
                  result.push(addIndent(fragment));
                }
              }
              result.push(addIndent(save));
            }
            if (stmt.trailingComments) {
              if (preserveBlankLines) {
                comment = stmt.trailingComments[0];
                extRange = comment.extendedRange;
                range = comment.range;
                prefix = sourceCode.substring(extRange[0], range[0]);
                count = (prefix.match(/\n/g) || []).length;
                if (count > 0) {
                  result.push(stringRepeat('\n', count));
                  result.push(addIndent(generateComment(comment)));
                } else {
                  result.push(prefix);
                  result.push(generateComment(comment));
                }
              } else {
                tailingToStatement = !endsWithLineTerminator(toSourceNodeWhenNeeded(result).toString());
                specialBase = stringRepeat(' ', calculateSpaces(toSourceNodeWhenNeeded([
                  base,
                  result,
                  indent
                ]).toString()));
                for (i = 0, len = stmt.trailingComments.length; i < len; ++i) {
                  comment = stmt.trailingComments[i];
                  if (tailingToStatement) {
                    if (i === 0) {
                      result = [
                        result,
                        indent
                      ];
                    } else {
                      result = [
                        result,
                        specialBase
                      ];
                    }
                    result.push(generateComment(comment, specialBase));
                  } else {
                    result = [
                      result,
                      addIndent(generateComment(comment))
                    ];
                  }
                  if (i !== len - 1 && !endsWithLineTerminator(toSourceNodeWhenNeeded(result).toString())) {
                    result = [
                      result,
                      '\n'
                    ];
                  }
                }
              }
            }
            return result;
          }
          function generateBlankLines(start, end, result) {
            var j, newlineCount = 0;
            for (j = start; j < end; j++) {
              if (sourceCode[j] === '\n') {
                newlineCount++;
              }
            }
            for (j = 1; j < newlineCount; j++) {
              result.push(newline);
            }
          }
          function parenthesize(text, current, should) {
            if (current < should) {
              return [
                '(',
                text,
                ')'
              ];
            }
            return text;
          }
          function generateVerbatimString(string) {
            var i, iz, result;
            result = string.split(/\r\n|\n/);
            for (i = 1, iz = result.length; i < iz; i++) {
              result[i] = newline + base + result[i];
            }
            return result;
          }
          function generateVerbatim(expr, precedence) {
            var verbatim, result, prec;
            verbatim = expr[extra.verbatim];
            if (typeof verbatim === 'string') {
              result = parenthesize(generateVerbatimString(verbatim), Precedence.Sequence, precedence);
            } else {
              result = generateVerbatimString(verbatim.content);
              prec = verbatim.precedence != null ? verbatim.precedence : Precedence.Sequence;
              result = parenthesize(result, prec, precedence);
            }
            return toSourceNodeWhenNeeded(result, expr);
          }
          function CodeGenerator() {
          }
          CodeGenerator.prototype.maybeBlock = function (stmt, flags) {
            var result, noLeadingComment, that = this;
            noLeadingComment = !extra.comment || !stmt.leadingComments;
            if (stmt.type === Syntax.BlockStatement && noLeadingComment) {
              return [
                space,
                this.generateStatement(stmt, flags)
              ];
            }
            if (stmt.type === Syntax.EmptyStatement && noLeadingComment) {
              return ';';
            }
            withIndent(function () {
              result = [
                newline,
                addIndent(that.generateStatement(stmt, flags))
              ];
            });
            return result;
          };
          CodeGenerator.prototype.maybeBlockSuffix = function (stmt, result) {
            var ends = endsWithLineTerminator(toSourceNodeWhenNeeded(result).toString());
            if (stmt.type === Syntax.BlockStatement && (!extra.comment || !stmt.leadingComments) && !ends) {
              return [
                result,
                space
              ];
            }
            if (ends) {
              return [
                result,
                base
              ];
            }
            return [
              result,
              newline,
              base
            ];
          };
          function generateIdentifier(node) {
            return toSourceNodeWhenNeeded(node.name, node);
          }
          function generateAsyncPrefix(node, spaceRequired) {
            return node.async ? 'async' + (spaceRequired ? noEmptySpace() : space) : '';
          }
          function generateStarSuffix(node) {
            var isGenerator = node.generator && !extra.moz.starlessGenerator;
            return isGenerator ? '*' + space : '';
          }
          function generateMethodPrefix(prop) {
            var func = prop.value;
            if (func.async) {
              return generateAsyncPrefix(func, !prop.computed);
            } else {
              return generateStarSuffix(func) ? '*' : '';
            }
          }
          CodeGenerator.prototype.generatePattern = function (node, precedence, flags) {
            if (node.type === Syntax.Identifier) {
              return generateIdentifier(node);
            }
            return this.generateExpression(node, precedence, flags);
          };
          CodeGenerator.prototype.generateFunctionParams = function (node) {
            var i, iz, result, hasDefault;
            hasDefault = false;
            if (node.type === Syntax.ArrowFunctionExpression && !node.rest && (!node.defaults || node.defaults.length === 0) && node.params.length === 1 && node.params[0].type === Syntax.Identifier) {
              result = [
                generateAsyncPrefix(node, true),
                generateIdentifier(node.params[0])
              ];
            } else {
              result = node.type === Syntax.ArrowFunctionExpression ? [generateAsyncPrefix(node, false)] : [];
              result.push('(');
              if (node.defaults) {
                hasDefault = true;
              }
              for (i = 0, iz = node.params.length; i < iz; ++i) {
                if (hasDefault && node.defaults[i]) {
                  result.push(this.generateAssignment(node.params[i], node.defaults[i], '=', Precedence.Assignment, E_TTT));
                } else {
                  result.push(this.generatePattern(node.params[i], Precedence.Assignment, E_TTT));
                }
                if (i + 1 < iz) {
                  result.push(',' + space);
                }
              }
              if (node.rest) {
                if (node.params.length) {
                  result.push(',' + space);
                }
                result.push('...');
                result.push(generateIdentifier(node.rest));
              }
              result.push(')');
            }
            return result;
          };
          CodeGenerator.prototype.generateFunctionBody = function (node) {
            var result, expr;
            result = this.generateFunctionParams(node);
            if (node.type === Syntax.ArrowFunctionExpression) {
              result.push(space);
              result.push('=>');
            }
            if (node.expression) {
              result.push(space);
              expr = this.generateExpression(node.body, Precedence.Assignment, E_TTT);
              if (expr.toString().charAt(0) === '{') {
                expr = [
                  '(',
                  expr,
                  ')'
                ];
              }
              result.push(expr);
            } else {
              result.push(this.maybeBlock(node.body, S_TTFF));
            }
            return result;
          };
          CodeGenerator.prototype.generateIterationForStatement = function (operator, stmt, flags) {
            var result = ['for' + space + '('], that = this;
            withIndent(function () {
              if (stmt.left.type === Syntax.VariableDeclaration) {
                withIndent(function () {
                  result.push(stmt.left.kind + noEmptySpace());
                  result.push(that.generateStatement(stmt.left.declarations[0], S_FFFF));
                });
              } else {
                result.push(that.generateExpression(stmt.left, Precedence.Call, E_TTT));
              }
              result = join(result, operator);
              result = [
                join(result, that.generateExpression(stmt.right, Precedence.Sequence, E_TTT)),
                ')'
              ];
            });
            result.push(this.maybeBlock(stmt.body, flags));
            return result;
          };
          CodeGenerator.prototype.generatePropertyKey = function (expr, computed, value) {
            var result = [];
            if (computed) {
              result.push('[');
            }
            if (value.type === 'AssignmentPattern') {
              result.push(this.AssignmentPattern(value, Precedence.Sequence, E_TTT));
            } else {
              result.push(this.generateExpression(expr, Precedence.Sequence, E_TTT));
            }
            if (computed) {
              result.push(']');
            }
            return result;
          };
          CodeGenerator.prototype.generateAssignment = function (left, right, operator, precedence, flags) {
            if (Precedence.Assignment < precedence) {
              flags |= F_ALLOW_IN;
            }
            return parenthesize([
              this.generateExpression(left, Precedence.Call, flags),
              space + operator + space,
              this.generateExpression(right, Precedence.Assignment, flags)
            ], Precedence.Assignment, precedence);
          };
          CodeGenerator.prototype.semicolon = function (flags) {
            if (!semicolons && flags & F_SEMICOLON_OPT) {
              return '';
            }
            return ';';
          };
          CodeGenerator.Statement = {
            BlockStatement: function (stmt, flags) {
              var range, content, result = [
                  '{',
                  newline
                ], that = this;
              withIndent(function () {
                if (stmt.body.length === 0 && preserveBlankLines) {
                  range = stmt.range;
                  if (range[1] - range[0] > 2) {
                    content = sourceCode.substring(range[0] + 1, range[1] - 1);
                    if (content[0] === '\n') {
                      result = ['{'];
                    }
                    result.push(content);
                  }
                }
                var i, iz, fragment, bodyFlags;
                bodyFlags = S_TFFF;
                if (flags & F_FUNC_BODY) {
                  bodyFlags |= F_DIRECTIVE_CTX;
                }
                for (i = 0, iz = stmt.body.length; i < iz; ++i) {
                  if (preserveBlankLines) {
                    if (i === 0) {
                      if (stmt.body[0].leadingComments) {
                        range = stmt.body[0].leadingComments[0].extendedRange;
                        content = sourceCode.substring(range[0], range[1]);
                        if (content[0] === '\n') {
                          result = ['{'];
                        }
                      }
                      if (!stmt.body[0].leadingComments) {
                        generateBlankLines(stmt.range[0], stmt.body[0].range[0], result);
                      }
                    }
                    if (i > 0) {
                      if (!stmt.body[i - 1].trailingComments && !stmt.body[i].leadingComments) {
                        generateBlankLines(stmt.body[i - 1].range[1], stmt.body[i].range[0], result);
                      }
                    }
                  }
                  if (i === iz - 1) {
                    bodyFlags |= F_SEMICOLON_OPT;
                  }
                  if (stmt.body[i].leadingComments && preserveBlankLines) {
                    fragment = that.generateStatement(stmt.body[i], bodyFlags);
                  } else {
                    fragment = addIndent(that.generateStatement(stmt.body[i], bodyFlags));
                  }
                  result.push(fragment);
                  if (!endsWithLineTerminator(toSourceNodeWhenNeeded(fragment).toString())) {
                    if (preserveBlankLines && i < iz - 1) {
                      if (!stmt.body[i + 1].leadingComments) {
                        result.push(newline);
                      }
                    } else {
                      result.push(newline);
                    }
                  }
                  if (preserveBlankLines) {
                    if (i === iz - 1) {
                      if (!stmt.body[i].trailingComments) {
                        generateBlankLines(stmt.body[i].range[1], stmt.range[1], result);
                      }
                    }
                  }
                }
              });
              result.push(addIndent('}'));
              return result;
            },
            BreakStatement: function (stmt, flags) {
              if (stmt.label) {
                return 'break ' + stmt.label.name + this.semicolon(flags);
              }
              return 'break' + this.semicolon(flags);
            },
            ContinueStatement: function (stmt, flags) {
              if (stmt.label) {
                return 'continue ' + stmt.label.name + this.semicolon(flags);
              }
              return 'continue' + this.semicolon(flags);
            },
            ClassBody: function (stmt, flags) {
              var result = [
                  '{',
                  newline
                ], that = this;
              withIndent(function (indent) {
                var i, iz;
                for (i = 0, iz = stmt.body.length; i < iz; ++i) {
                  result.push(indent);
                  result.push(that.generateExpression(stmt.body[i], Precedence.Sequence, E_TTT));
                  if (i + 1 < iz) {
                    result.push(newline);
                  }
                }
              });
              if (!endsWithLineTerminator(toSourceNodeWhenNeeded(result).toString())) {
                result.push(newline);
              }
              result.push(base);
              result.push('}');
              return result;
            },
            ClassDeclaration: function (stmt, flags) {
              var result, fragment;
              result = ['class'];
              if (stmt.id) {
                result = join(result, this.generateExpression(stmt.id, Precedence.Sequence, E_TTT));
              }
              if (stmt.superClass) {
                fragment = join('extends', this.generateExpression(stmt.superClass, Precedence.Assignment, E_TTT));
                result = join(result, fragment);
              }
              result.push(space);
              result.push(this.generateStatement(stmt.body, S_TFFT));
              return result;
            },
            DirectiveStatement: function (stmt, flags) {
              if (extra.raw && stmt.raw) {
                return stmt.raw + this.semicolon(flags);
              }
              return escapeDirective(stmt.directive) + this.semicolon(flags);
            },
            DoWhileStatement: function (stmt, flags) {
              var result = join('do', this.maybeBlock(stmt.body, S_TFFF));
              result = this.maybeBlockSuffix(stmt.body, result);
              return join(result, [
                'while' + space + '(',
                this.generateExpression(stmt.test, Precedence.Sequence, E_TTT),
                ')' + this.semicolon(flags)
              ]);
            },
            CatchClause: function (stmt, flags) {
              var result, that = this;
              withIndent(function () {
                var guard;
                result = [
                  'catch' + space + '(',
                  that.generateExpression(stmt.param, Precedence.Sequence, E_TTT),
                  ')'
                ];
                if (stmt.guard) {
                  guard = that.generateExpression(stmt.guard, Precedence.Sequence, E_TTT);
                  result.splice(2, 0, ' if ', guard);
                }
              });
              result.push(this.maybeBlock(stmt.body, S_TFFF));
              return result;
            },
            DebuggerStatement: function (stmt, flags) {
              return 'debugger' + this.semicolon(flags);
            },
            EmptyStatement: function (stmt, flags) {
              return ';';
            },
            ExportDefaultDeclaration: function (stmt, flags) {
              var result = ['export'], bodyFlags;
              bodyFlags = flags & F_SEMICOLON_OPT ? S_TFFT : S_TFFF;
              result = join(result, 'default');
              if (isStatement(stmt.declaration)) {
                result = join(result, this.generateStatement(stmt.declaration, bodyFlags));
              } else {
                result = join(result, this.generateExpression(stmt.declaration, Precedence.Assignment, E_TTT) + this.semicolon(flags));
              }
              return result;
            },
            ExportNamedDeclaration: function (stmt, flags) {
              var result = ['export'], bodyFlags, that = this;
              bodyFlags = flags & F_SEMICOLON_OPT ? S_TFFT : S_TFFF;
              if (stmt.declaration) {
                return join(result, this.generateStatement(stmt.declaration, bodyFlags));
              }
              if (stmt.specifiers) {
                if (stmt.specifiers.length === 0) {
                  result = join(result, '{' + space + '}');
                } else if (stmt.specifiers[0].type === Syntax.ExportBatchSpecifier) {
                  result = join(result, this.generateExpression(stmt.specifiers[0], Precedence.Sequence, E_TTT));
                } else {
                  result = join(result, '{');
                  withIndent(function (indent) {
                    var i, iz;
                    result.push(newline);
                    for (i = 0, iz = stmt.specifiers.length; i < iz; ++i) {
                      result.push(indent);
                      result.push(that.generateExpression(stmt.specifiers[i], Precedence.Sequence, E_TTT));
                      if (i + 1 < iz) {
                        result.push(',' + newline);
                      }
                    }
                  });
                  if (!endsWithLineTerminator(toSourceNodeWhenNeeded(result).toString())) {
                    result.push(newline);
                  }
                  result.push(base + '}');
                }
                if (stmt.source) {
                  result = join(result, [
                    'from' + space,
                    this.generateExpression(stmt.source, Precedence.Sequence, E_TTT),
                    this.semicolon(flags)
                  ]);
                } else {
                  result.push(this.semicolon(flags));
                }
              }
              return result;
            },
            ExportAllDeclaration: function (stmt, flags) {
              return [
                'export' + space,
                '*' + space,
                'from' + space,
                this.generateExpression(stmt.source, Precedence.Sequence, E_TTT),
                this.semicolon(flags)
              ];
            },
            ExpressionStatement: function (stmt, flags) {
              var result, fragment;
              function isClassPrefixed(fragment) {
                var code;
                if (fragment.slice(0, 5) !== 'class') {
                  return false;
                }
                code = fragment.charCodeAt(5);
                return code === 123 || esutils.code.isWhiteSpace(code) || esutils.code.isLineTerminator(code);
              }
              function isFunctionPrefixed(fragment) {
                var code;
                if (fragment.slice(0, 8) !== 'function') {
                  return false;
                }
                code = fragment.charCodeAt(8);
                return code === 40 || esutils.code.isWhiteSpace(code) || code === 42 || esutils.code.isLineTerminator(code);
              }
              function isAsyncPrefixed(fragment) {
                var code, i, iz;
                if (fragment.slice(0, 5) !== 'async') {
                  return false;
                }
                if (!esutils.code.isWhiteSpace(fragment.charCodeAt(5))) {
                  return false;
                }
                for (i = 6, iz = fragment.length; i < iz; ++i) {
                  if (!esutils.code.isWhiteSpace(fragment.charCodeAt(i))) {
                    break;
                  }
                }
                if (i === iz) {
                  return false;
                }
                if (fragment.slice(i, i + 8) !== 'function') {
                  return false;
                }
                code = fragment.charCodeAt(i + 8);
                return code === 40 || esutils.code.isWhiteSpace(code) || code === 42 || esutils.code.isLineTerminator(code);
              }
              result = [this.generateExpression(stmt.expression, Precedence.Sequence, E_TTT)];
              fragment = toSourceNodeWhenNeeded(result).toString();
              if (fragment.charCodeAt(0) === 123 || isClassPrefixed(fragment) || isFunctionPrefixed(fragment) || isAsyncPrefixed(fragment) || directive && flags & F_DIRECTIVE_CTX && stmt.expression.type === Syntax.Literal && typeof stmt.expression.value === 'string') {
                result = [
                  '(',
                  result,
                  ')' + this.semicolon(flags)
                ];
              } else {
                result.push(this.semicolon(flags));
              }
              return result;
            },
            ImportDeclaration: function (stmt, flags) {
              var result, cursor, that = this;
              if (stmt.specifiers.length === 0) {
                return [
                  'import',
                  space,
                  this.generateExpression(stmt.source, Precedence.Sequence, E_TTT),
                  this.semicolon(flags)
                ];
              }
              result = ['import'];
              cursor = 0;
              if (stmt.specifiers[cursor].type === Syntax.ImportDefaultSpecifier) {
                result = join(result, [this.generateExpression(stmt.specifiers[cursor], Precedence.Sequence, E_TTT)]);
                ++cursor;
              }
              if (stmt.specifiers[cursor]) {
                if (cursor !== 0) {
                  result.push(',');
                }
                if (stmt.specifiers[cursor].type === Syntax.ImportNamespaceSpecifier) {
                  result = join(result, [
                    space,
                    this.generateExpression(stmt.specifiers[cursor], Precedence.Sequence, E_TTT)
                  ]);
                } else {
                  result.push(space + '{');
                  if (stmt.specifiers.length - cursor === 1) {
                    result.push(space);
                    result.push(this.generateExpression(stmt.specifiers[cursor], Precedence.Sequence, E_TTT));
                    result.push(space + '}' + space);
                  } else {
                    withIndent(function (indent) {
                      var i, iz;
                      result.push(newline);
                      for (i = cursor, iz = stmt.specifiers.length; i < iz; ++i) {
                        result.push(indent);
                        result.push(that.generateExpression(stmt.specifiers[i], Precedence.Sequence, E_TTT));
                        if (i + 1 < iz) {
                          result.push(',' + newline);
                        }
                      }
                    });
                    if (!endsWithLineTerminator(toSourceNodeWhenNeeded(result).toString())) {
                      result.push(newline);
                    }
                    result.push(base + '}' + space);
                  }
                }
              }
              result = join(result, [
                'from' + space,
                this.generateExpression(stmt.source, Precedence.Sequence, E_TTT),
                this.semicolon(flags)
              ]);
              return result;
            },
            VariableDeclarator: function (stmt, flags) {
              var itemFlags = flags & F_ALLOW_IN ? E_TTT : E_FTT;
              if (stmt.init) {
                return [
                  this.generateExpression(stmt.id, Precedence.Assignment, itemFlags),
                  space,
                  '=',
                  space,
                  this.generateExpression(stmt.init, Precedence.Assignment, itemFlags)
                ];
              }
              return this.generatePattern(stmt.id, Precedence.Assignment, itemFlags);
            },
            VariableDeclaration: function (stmt, flags) {
              var result, i, iz, node, bodyFlags, that = this;
              result = [stmt.kind];
              bodyFlags = flags & F_ALLOW_IN ? S_TFFF : S_FFFF;
              function block() {
                node = stmt.declarations[0];
                if (extra.comment && node.leadingComments) {
                  result.push('\n');
                  result.push(addIndent(that.generateStatement(node, bodyFlags)));
                } else {
                  result.push(noEmptySpace());
                  result.push(that.generateStatement(node, bodyFlags));
                }
                for (i = 1, iz = stmt.declarations.length; i < iz; ++i) {
                  node = stmt.declarations[i];
                  if (extra.comment && node.leadingComments) {
                    result.push(',' + newline);
                    result.push(addIndent(that.generateStatement(node, bodyFlags)));
                  } else {
                    result.push(',' + space);
                    result.push(that.generateStatement(node, bodyFlags));
                  }
                }
              }
              if (stmt.declarations.length > 1) {
                withIndent(block);
              } else {
                block();
              }
              result.push(this.semicolon(flags));
              return result;
            },
            ThrowStatement: function (stmt, flags) {
              return [
                join('throw', this.generateExpression(stmt.argument, Precedence.Sequence, E_TTT)),
                this.semicolon(flags)
              ];
            },
            TryStatement: function (stmt, flags) {
              var result, i, iz, guardedHandlers;
              result = [
                'try',
                this.maybeBlock(stmt.block, S_TFFF)
              ];
              result = this.maybeBlockSuffix(stmt.block, result);
              if (stmt.handlers) {
                for (i = 0, iz = stmt.handlers.length; i < iz; ++i) {
                  result = join(result, this.generateStatement(stmt.handlers[i], S_TFFF));
                  if (stmt.finalizer || i + 1 !== iz) {
                    result = this.maybeBlockSuffix(stmt.handlers[i].body, result);
                  }
                }
              } else {
                guardedHandlers = stmt.guardedHandlers || [];
                for (i = 0, iz = guardedHandlers.length; i < iz; ++i) {
                  result = join(result, this.generateStatement(guardedHandlers[i], S_TFFF));
                  if (stmt.finalizer || i + 1 !== iz) {
                    result = this.maybeBlockSuffix(guardedHandlers[i].body, result);
                  }
                }
                if (stmt.handler) {
                  if (isArray(stmt.handler)) {
                    for (i = 0, iz = stmt.handler.length; i < iz; ++i) {
                      result = join(result, this.generateStatement(stmt.handler[i], S_TFFF));
                      if (stmt.finalizer || i + 1 !== iz) {
                        result = this.maybeBlockSuffix(stmt.handler[i].body, result);
                      }
                    }
                  } else {
                    result = join(result, this.generateStatement(stmt.handler, S_TFFF));
                    if (stmt.finalizer) {
                      result = this.maybeBlockSuffix(stmt.handler.body, result);
                    }
                  }
                }
              }
              if (stmt.finalizer) {
                result = join(result, [
                  'finally',
                  this.maybeBlock(stmt.finalizer, S_TFFF)
                ]);
              }
              return result;
            },
            SwitchStatement: function (stmt, flags) {
              var result, fragment, i, iz, bodyFlags, that = this;
              withIndent(function () {
                result = [
                  'switch' + space + '(',
                  that.generateExpression(stmt.discriminant, Precedence.Sequence, E_TTT),
                  ')' + space + '{' + newline
                ];
              });
              if (stmt.cases) {
                bodyFlags = S_TFFF;
                for (i = 0, iz = stmt.cases.length; i < iz; ++i) {
                  if (i === iz - 1) {
                    bodyFlags |= F_SEMICOLON_OPT;
                  }
                  fragment = addIndent(this.generateStatement(stmt.cases[i], bodyFlags));
                  result.push(fragment);
                  if (!endsWithLineTerminator(toSourceNodeWhenNeeded(fragment).toString())) {
                    result.push(newline);
                  }
                }
              }
              result.push(addIndent('}'));
              return result;
            },
            SwitchCase: function (stmt, flags) {
              var result, fragment, i, iz, bodyFlags, that = this;
              withIndent(function () {
                if (stmt.test) {
                  result = [
                    join('case', that.generateExpression(stmt.test, Precedence.Sequence, E_TTT)),
                    ':'
                  ];
                } else {
                  result = ['default:'];
                }
                i = 0;
                iz = stmt.consequent.length;
                if (iz && stmt.consequent[0].type === Syntax.BlockStatement) {
                  fragment = that.maybeBlock(stmt.consequent[0], S_TFFF);
                  result.push(fragment);
                  i = 1;
                }
                if (i !== iz && !endsWithLineTerminator(toSourceNodeWhenNeeded(result).toString())) {
                  result.push(newline);
                }
                bodyFlags = S_TFFF;
                for (; i < iz; ++i) {
                  if (i === iz - 1 && flags & F_SEMICOLON_OPT) {
                    bodyFlags |= F_SEMICOLON_OPT;
                  }
                  fragment = addIndent(that.generateStatement(stmt.consequent[i], bodyFlags));
                  result.push(fragment);
                  if (i + 1 !== iz && !endsWithLineTerminator(toSourceNodeWhenNeeded(fragment).toString())) {
                    result.push(newline);
                  }
                }
              });
              return result;
            },
            IfStatement: function (stmt, flags) {
              var result, bodyFlags, semicolonOptional, that = this;
              withIndent(function () {
                result = [
                  'if' + space + '(',
                  that.generateExpression(stmt.test, Precedence.Sequence, E_TTT),
                  ')'
                ];
              });
              semicolonOptional = flags & F_SEMICOLON_OPT;
              bodyFlags = S_TFFF;
              if (semicolonOptional) {
                bodyFlags |= F_SEMICOLON_OPT;
              }
              if (stmt.alternate) {
                result.push(this.maybeBlock(stmt.consequent, S_TFFF));
                result = this.maybeBlockSuffix(stmt.consequent, result);
                if (stmt.alternate.type === Syntax.IfStatement) {
                  result = join(result, [
                    'else ',
                    this.generateStatement(stmt.alternate, bodyFlags)
                  ]);
                } else {
                  result = join(result, join('else', this.maybeBlock(stmt.alternate, bodyFlags)));
                }
              } else {
                result.push(this.maybeBlock(stmt.consequent, bodyFlags));
              }
              return result;
            },
            ForStatement: function (stmt, flags) {
              var result, that = this;
              withIndent(function () {
                result = ['for' + space + '('];
                if (stmt.init) {
                  if (stmt.init.type === Syntax.VariableDeclaration) {
                    result.push(that.generateStatement(stmt.init, S_FFFF));
                  } else {
                    result.push(that.generateExpression(stmt.init, Precedence.Sequence, E_FTT));
                    result.push(';');
                  }
                } else {
                  result.push(';');
                }
                if (stmt.test) {
                  result.push(space);
                  result.push(that.generateExpression(stmt.test, Precedence.Sequence, E_TTT));
                  result.push(';');
                } else {
                  result.push(';');
                }
                if (stmt.update) {
                  result.push(space);
                  result.push(that.generateExpression(stmt.update, Precedence.Sequence, E_TTT));
                  result.push(')');
                } else {
                  result.push(')');
                }
              });
              result.push(this.maybeBlock(stmt.body, flags & F_SEMICOLON_OPT ? S_TFFT : S_TFFF));
              return result;
            },
            ForInStatement: function (stmt, flags) {
              return this.generateIterationForStatement('in', stmt, flags & F_SEMICOLON_OPT ? S_TFFT : S_TFFF);
            },
            ForOfStatement: function (stmt, flags) {
              return this.generateIterationForStatement('of', stmt, flags & F_SEMICOLON_OPT ? S_TFFT : S_TFFF);
            },
            LabeledStatement: function (stmt, flags) {
              return [
                stmt.label.name + ':',
                this.maybeBlock(stmt.body, flags & F_SEMICOLON_OPT ? S_TFFT : S_TFFF)
              ];
            },
            Program: function (stmt, flags) {
              var result, fragment, i, iz, bodyFlags;
              iz = stmt.body.length;
              result = [safeConcatenation && iz > 0 ? '\n' : ''];
              bodyFlags = S_TFTF;
              for (i = 0; i < iz; ++i) {
                if (!safeConcatenation && i === iz - 1) {
                  bodyFlags |= F_SEMICOLON_OPT;
                }
                if (preserveBlankLines) {
                  if (i === 0) {
                    if (!stmt.body[0].leadingComments) {
                      generateBlankLines(stmt.range[0], stmt.body[i].range[0], result);
                    }
                  }
                  if (i > 0) {
                    if (!stmt.body[i - 1].trailingComments && !stmt.body[i].leadingComments) {
                      generateBlankLines(stmt.body[i - 1].range[1], stmt.body[i].range[0], result);
                    }
                  }
                }
                fragment = addIndent(this.generateStatement(stmt.body[i], bodyFlags));
                result.push(fragment);
                if (i + 1 < iz && !endsWithLineTerminator(toSourceNodeWhenNeeded(fragment).toString())) {
                  if (preserveBlankLines) {
                    if (!stmt.body[i + 1].leadingComments) {
                      result.push(newline);
                    }
                  } else {
                    result.push(newline);
                  }
                }
                if (preserveBlankLines) {
                  if (i === iz - 1) {
                    if (!stmt.body[i].trailingComments) {
                      generateBlankLines(stmt.body[i].range[1], stmt.range[1], result);
                    }
                  }
                }
              }
              return result;
            },
            FunctionDeclaration: function (stmt, flags) {
              return [
                generateAsyncPrefix(stmt, true),
                'function',
                generateStarSuffix(stmt) || noEmptySpace(),
                stmt.id ? generateIdentifier(stmt.id) : '',
                this.generateFunctionBody(stmt)
              ];
            },
            ReturnStatement: function (stmt, flags) {
              if (stmt.argument) {
                return [
                  join('return', this.generateExpression(stmt.argument, Precedence.Sequence, E_TTT)),
                  this.semicolon(flags)
                ];
              }
              return ['return' + this.semicolon(flags)];
            },
            WhileStatement: function (stmt, flags) {
              var result, that = this;
              withIndent(function () {
                result = [
                  'while' + space + '(',
                  that.generateExpression(stmt.test, Precedence.Sequence, E_TTT),
                  ')'
                ];
              });
              result.push(this.maybeBlock(stmt.body, flags & F_SEMICOLON_OPT ? S_TFFT : S_TFFF));
              return result;
            },
            WithStatement: function (stmt, flags) {
              var result, that = this;
              withIndent(function () {
                result = [
                  'with' + space + '(',
                  that.generateExpression(stmt.object, Precedence.Sequence, E_TTT),
                  ')'
                ];
              });
              result.push(this.maybeBlock(stmt.body, flags & F_SEMICOLON_OPT ? S_TFFT : S_TFFF));
              return result;
            }
          };
          merge(CodeGenerator.prototype, CodeGenerator.Statement);
          CodeGenerator.Expression = {
            SequenceExpression: function (expr, precedence, flags) {
              var result, i, iz;
              if (Precedence.Sequence < precedence) {
                flags |= F_ALLOW_IN;
              }
              result = [];
              for (i = 0, iz = expr.expressions.length; i < iz; ++i) {
                result.push(this.generateExpression(expr.expressions[i], Precedence.Assignment, flags));
                if (i + 1 < iz) {
                  result.push(',' + space);
                }
              }
              return parenthesize(result, Precedence.Sequence, precedence);
            },
            AssignmentExpression: function (expr, precedence, flags) {
              return this.generateAssignment(expr.left, expr.right, expr.operator, precedence, flags);
            },
            ArrowFunctionExpression: function (expr, precedence, flags) {
              return parenthesize(this.generateFunctionBody(expr), Precedence.ArrowFunction, precedence);
            },
            ConditionalExpression: function (expr, precedence, flags) {
              if (Precedence.Conditional < precedence) {
                flags |= F_ALLOW_IN;
              }
              return parenthesize([
                this.generateExpression(expr.test, Precedence.LogicalOR, flags),
                space + '?' + space,
                this.generateExpression(expr.consequent, Precedence.Assignment, flags),
                space + ':' + space,
                this.generateExpression(expr.alternate, Precedence.Assignment, flags)
              ], Precedence.Conditional, precedence);
            },
            LogicalExpression: function (expr, precedence, flags) {
              return this.BinaryExpression(expr, precedence, flags);
            },
            BinaryExpression: function (expr, precedence, flags) {
              var result, currentPrecedence, fragment, leftSource;
              currentPrecedence = BinaryPrecedence[expr.operator];
              if (currentPrecedence < precedence) {
                flags |= F_ALLOW_IN;
              }
              fragment = this.generateExpression(expr.left, currentPrecedence, flags);
              leftSource = fragment.toString();
              if (leftSource.charCodeAt(leftSource.length - 1) === 47 && esutils.code.isIdentifierPartES5(expr.operator.charCodeAt(0))) {
                result = [
                  fragment,
                  noEmptySpace(),
                  expr.operator
                ];
              } else {
                result = join(fragment, expr.operator);
              }
              fragment = this.generateExpression(expr.right, currentPrecedence + 1, flags);
              if (expr.operator === '/' && fragment.toString().charAt(0) === '/' || expr.operator.slice(-1) === '<' && fragment.toString().slice(0, 3) === '!--') {
                result.push(noEmptySpace());
                result.push(fragment);
              } else {
                result = join(result, fragment);
              }
              if (expr.operator === 'in' && !(flags & F_ALLOW_IN)) {
                return [
                  '(',
                  result,
                  ')'
                ];
              }
              return parenthesize(result, currentPrecedence, precedence);
            },
            CallExpression: function (expr, precedence, flags) {
              var result, i, iz;
              result = [this.generateExpression(expr.callee, Precedence.Call, E_TTF)];
              result.push('(');
              for (i = 0, iz = expr['arguments'].length; i < iz; ++i) {
                result.push(this.generateExpression(expr['arguments'][i], Precedence.Assignment, E_TTT));
                if (i + 1 < iz) {
                  result.push(',' + space);
                }
              }
              result.push(')');
              if (!(flags & F_ALLOW_CALL)) {
                return [
                  '(',
                  result,
                  ')'
                ];
              }
              return parenthesize(result, Precedence.Call, precedence);
            },
            NewExpression: function (expr, precedence, flags) {
              var result, length, i, iz, itemFlags;
              length = expr['arguments'].length;
              itemFlags = flags & F_ALLOW_UNPARATH_NEW && !parentheses && length === 0 ? E_TFT : E_TFF;
              result = join('new', this.generateExpression(expr.callee, Precedence.New, itemFlags));
              if (!(flags & F_ALLOW_UNPARATH_NEW) || parentheses || length > 0) {
                result.push('(');
                for (i = 0, iz = length; i < iz; ++i) {
                  result.push(this.generateExpression(expr['arguments'][i], Precedence.Assignment, E_TTT));
                  if (i + 1 < iz) {
                    result.push(',' + space);
                  }
                }
                result.push(')');
              }
              return parenthesize(result, Precedence.New, precedence);
            },
            MemberExpression: function (expr, precedence, flags) {
              var result, fragment;
              result = [this.generateExpression(expr.object, Precedence.Call, flags & F_ALLOW_CALL ? E_TTF : E_TFF)];
              if (expr.computed) {
                result.push('[');
                result.push(this.generateExpression(expr.property, Precedence.Sequence, flags & F_ALLOW_CALL ? E_TTT : E_TFT));
                result.push(']');
              } else {
                if (expr.object.type === Syntax.Literal && typeof expr.object.value === 'number') {
                  fragment = toSourceNodeWhenNeeded(result).toString();
                  if (fragment.indexOf('.') < 0 && !/[eExX]/.test(fragment) && esutils.code.isDecimalDigit(fragment.charCodeAt(fragment.length - 1)) && !(fragment.length >= 2 && fragment.charCodeAt(0) === 48)) {
                    result.push(' ');
                  }
                }
                result.push('.');
                result.push(generateIdentifier(expr.property));
              }
              return parenthesize(result, Precedence.Member, precedence);
            },
            MetaProperty: function (expr, precedence, flags) {
              var result;
              result = [];
              result.push(expr.meta);
              result.push('.');
              result.push(expr.property);
              return parenthesize(result, Precedence.Member, precedence);
            },
            UnaryExpression: function (expr, precedence, flags) {
              var result, fragment, rightCharCode, leftSource, leftCharCode;
              fragment = this.generateExpression(expr.argument, Precedence.Unary, E_TTT);
              if (space === '') {
                result = join(expr.operator, fragment);
              } else {
                result = [expr.operator];
                if (expr.operator.length > 2) {
                  result = join(result, fragment);
                } else {
                  leftSource = toSourceNodeWhenNeeded(result).toString();
                  leftCharCode = leftSource.charCodeAt(leftSource.length - 1);
                  rightCharCode = fragment.toString().charCodeAt(0);
                  if ((leftCharCode === 43 || leftCharCode === 45) && leftCharCode === rightCharCode || esutils.code.isIdentifierPartES5(leftCharCode) && esutils.code.isIdentifierPartES5(rightCharCode)) {
                    result.push(noEmptySpace());
                    result.push(fragment);
                  } else {
                    result.push(fragment);
                  }
                }
              }
              return parenthesize(result, Precedence.Unary, precedence);
            },
            YieldExpression: function (expr, precedence, flags) {
              var result;
              if (expr.delegate) {
                result = 'yield*';
              } else {
                result = 'yield';
              }
              if (expr.argument) {
                result = join(result, this.generateExpression(expr.argument, Precedence.Yield, E_TTT));
              }
              return parenthesize(result, Precedence.Yield, precedence);
            },
            AwaitExpression: function (expr, precedence, flags) {
              var result = join(expr.all ? 'await*' : 'await', this.generateExpression(expr.argument, Precedence.Await, E_TTT));
              return parenthesize(result, Precedence.Await, precedence);
            },
            UpdateExpression: function (expr, precedence, flags) {
              if (expr.prefix) {
                return parenthesize([
                  expr.operator,
                  this.generateExpression(expr.argument, Precedence.Unary, E_TTT)
                ], Precedence.Unary, precedence);
              }
              return parenthesize([
                this.generateExpression(expr.argument, Precedence.Postfix, E_TTT),
                expr.operator
              ], Precedence.Postfix, precedence);
            },
            FunctionExpression: function (expr, precedence, flags) {
              var result = [
                  generateAsyncPrefix(expr, true),
                  'function'
                ];
              if (expr.id) {
                result.push(generateStarSuffix(expr) || noEmptySpace());
                result.push(generateIdentifier(expr.id));
              } else {
                result.push(generateStarSuffix(expr) || space);
              }
              result.push(this.generateFunctionBody(expr));
              return result;
            },
            ArrayPattern: function (expr, precedence, flags) {
              return this.ArrayExpression(expr, precedence, flags, true);
            },
            ArrayExpression: function (expr, precedence, flags, isPattern) {
              var result, multiline, that = this;
              if (!expr.elements.length) {
                return '[]';
              }
              multiline = isPattern ? false : expr.elements.length > 1;
              result = [
                '[',
                multiline ? newline : ''
              ];
              withIndent(function (indent) {
                var i, iz;
                for (i = 0, iz = expr.elements.length; i < iz; ++i) {
                  if (!expr.elements[i]) {
                    if (multiline) {
                      result.push(indent);
                    }
                    if (i + 1 === iz) {
                      result.push(',');
                    }
                  } else {
                    result.push(multiline ? indent : '');
                    result.push(that.generateExpression(expr.elements[i], Precedence.Assignment, E_TTT));
                  }
                  if (i + 1 < iz) {
                    result.push(',' + (multiline ? newline : space));
                  }
                }
              });
              if (multiline && !endsWithLineTerminator(toSourceNodeWhenNeeded(result).toString())) {
                result.push(newline);
              }
              result.push(multiline ? base : '');
              result.push(']');
              return result;
            },
            RestElement: function (expr, precedence, flags) {
              return '...' + this.generatePattern(expr.argument);
            },
            ClassExpression: function (expr, precedence, flags) {
              var result, fragment;
              result = ['class'];
              if (expr.id) {
                result = join(result, this.generateExpression(expr.id, Precedence.Sequence, E_TTT));
              }
              if (expr.superClass) {
                fragment = join('extends', this.generateExpression(expr.superClass, Precedence.Assignment, E_TTT));
                result = join(result, fragment);
              }
              result.push(space);
              result.push(this.generateStatement(expr.body, S_TFFT));
              return result;
            },
            MethodDefinition: function (expr, precedence, flags) {
              var result, fragment;
              if (expr['static']) {
                result = ['static' + space];
              } else {
                result = [];
              }
              if (expr.kind === 'get' || expr.kind === 'set') {
                fragment = [
                  join(expr.kind, this.generatePropertyKey(expr.key, expr.computed, expr.value)),
                  this.generateFunctionBody(expr.value)
                ];
              } else {
                fragment = [
                  generateMethodPrefix(expr),
                  this.generatePropertyKey(expr.key, expr.computed, expr.value),
                  this.generateFunctionBody(expr.value)
                ];
              }
              return join(result, fragment);
            },
            Property: function (expr, precedence, flags) {
              if (expr.kind === 'get' || expr.kind === 'set') {
                return [
                  expr.kind,
                  noEmptySpace(),
                  this.generatePropertyKey(expr.key, expr.computed, expr.value),
                  this.generateFunctionBody(expr.value)
                ];
              }
              if (expr.shorthand) {
                return this.generatePropertyKey(expr.key, expr.computed, expr.value);
              }
              if (expr.method) {
                return [
                  generateMethodPrefix(expr),
                  this.generatePropertyKey(expr.key, expr.computed, expr.value),
                  this.generateFunctionBody(expr.value)
                ];
              }
              return [
                this.generatePropertyKey(expr.key, expr.computed, expr.value),
                ':' + space,
                this.generateExpression(expr.value, Precedence.Assignment, E_TTT)
              ];
            },
            ObjectExpression: function (expr, precedence, flags) {
              var multiline, result, fragment, that = this;
              if (!expr.properties.length) {
                return '{}';
              }
              multiline = expr.properties.length > 1;
              withIndent(function () {
                fragment = that.generateExpression(expr.properties[0], Precedence.Sequence, E_TTT);
              });
              if (!multiline) {
                if (!hasLineTerminator(toSourceNodeWhenNeeded(fragment).toString())) {
                  return [
                    '{',
                    space,
                    fragment,
                    space,
                    '}'
                  ];
                }
              }
              withIndent(function (indent) {
                var i, iz;
                result = [
                  '{',
                  newline,
                  indent,
                  fragment
                ];
                if (multiline) {
                  result.push(',' + newline);
                  for (i = 1, iz = expr.properties.length; i < iz; ++i) {
                    result.push(indent);
                    result.push(that.generateExpression(expr.properties[i], Precedence.Sequence, E_TTT));
                    if (i + 1 < iz) {
                      result.push(',' + newline);
                    }
                  }
                }
              });
              if (!endsWithLineTerminator(toSourceNodeWhenNeeded(result).toString())) {
                result.push(newline);
              }
              result.push(base);
              result.push('}');
              return result;
            },
            AssignmentPattern: function (expr, precedence, flags) {
              return this.generateAssignment(expr.left, expr.right, '=', precedence, flags);
            },
            ObjectPattern: function (expr, precedence, flags) {
              var result, i, iz, multiline, property, that = this;
              if (!expr.properties.length) {
                return '{}';
              }
              multiline = false;
              if (expr.properties.length === 1) {
                property = expr.properties[0];
                if (property.value.type !== Syntax.Identifier) {
                  multiline = true;
                }
              } else {
                for (i = 0, iz = expr.properties.length; i < iz; ++i) {
                  property = expr.properties[i];
                  if (!property.shorthand) {
                    multiline = true;
                    break;
                  }
                }
              }
              result = [
                '{',
                multiline ? newline : ''
              ];
              withIndent(function (indent) {
                var i, iz;
                for (i = 0, iz = expr.properties.length; i < iz; ++i) {
                  result.push(multiline ? indent : '');
                  result.push(that.generateExpression(expr.properties[i], Precedence.Sequence, E_TTT));
                  if (i + 1 < iz) {
                    result.push(',' + (multiline ? newline : space));
                  }
                }
              });
              if (multiline && !endsWithLineTerminator(toSourceNodeWhenNeeded(result).toString())) {
                result.push(newline);
              }
              result.push(multiline ? base : '');
              result.push('}');
              return result;
            },
            ThisExpression: function (expr, precedence, flags) {
              return 'this';
            },
            Super: function (expr, precedence, flags) {
              return 'super';
            },
            Identifier: function (expr, precedence, flags) {
              return generateIdentifier(expr);
            },
            ImportDefaultSpecifier: function (expr, precedence, flags) {
              return generateIdentifier(expr.id || expr.local);
            },
            ImportNamespaceSpecifier: function (expr, precedence, flags) {
              var result = ['*'];
              var id = expr.id || expr.local;
              if (id) {
                result.push(space + 'as' + noEmptySpace() + generateIdentifier(id));
              }
              return result;
            },
            ImportSpecifier: function (expr, precedence, flags) {
              var imported = expr.imported;
              var result = [imported.name];
              var local = expr.local;
              if (local && local.name !== imported.name) {
                result.push(noEmptySpace() + 'as' + noEmptySpace() + generateIdentifier(local));
              }
              return result;
            },
            ExportSpecifier: function (expr, precedence, flags) {
              var local = expr.local;
              var result = [local.name];
              var exported = expr.exported;
              if (exported && exported.name !== local.name) {
                result.push(noEmptySpace() + 'as' + noEmptySpace() + generateIdentifier(exported));
              }
              return result;
            },
            Literal: function (expr, precedence, flags) {
              var raw;
              if (expr.hasOwnProperty('raw') && parse && extra.raw) {
                try {
                  raw = parse(expr.raw).body[0].expression;
                  if (raw.type === Syntax.Literal) {
                    if (raw.value === expr.value) {
                      return expr.raw;
                    }
                  }
                } catch (e) {
                }
              }
              if (expr.value === null) {
                return 'null';
              }
              if (typeof expr.value === 'string') {
                return escapeString(expr.value);
              }
              if (typeof expr.value === 'number') {
                return generateNumber(expr.value);
              }
              if (typeof expr.value === 'boolean') {
                return expr.value ? 'true' : 'false';
              }
              if (expr.regex) {
                return '/' + expr.regex.pattern + '/' + expr.regex.flags;
              }
              return generateRegExp(expr.value);
            },
            GeneratorExpression: function (expr, precedence, flags) {
              return this.ComprehensionExpression(expr, precedence, flags);
            },
            ComprehensionExpression: function (expr, precedence, flags) {
              var result, i, iz, fragment, that = this;
              result = expr.type === Syntax.GeneratorExpression ? ['('] : ['['];
              if (extra.moz.comprehensionExpressionStartsWithAssignment) {
                fragment = this.generateExpression(expr.body, Precedence.Assignment, E_TTT);
                result.push(fragment);
              }
              if (expr.blocks) {
                withIndent(function () {
                  for (i = 0, iz = expr.blocks.length; i < iz; ++i) {
                    fragment = that.generateExpression(expr.blocks[i], Precedence.Sequence, E_TTT);
                    if (i > 0 || extra.moz.comprehensionExpressionStartsWithAssignment) {
                      result = join(result, fragment);
                    } else {
                      result.push(fragment);
                    }
                  }
                });
              }
              if (expr.filter) {
                result = join(result, 'if' + space);
                fragment = this.generateExpression(expr.filter, Precedence.Sequence, E_TTT);
                result = join(result, [
                  '(',
                  fragment,
                  ')'
                ]);
              }
              if (!extra.moz.comprehensionExpressionStartsWithAssignment) {
                fragment = this.generateExpression(expr.body, Precedence.Assignment, E_TTT);
                result = join(result, fragment);
              }
              result.push(expr.type === Syntax.GeneratorExpression ? ')' : ']');
              return result;
            },
            ComprehensionBlock: function (expr, precedence, flags) {
              var fragment;
              if (expr.left.type === Syntax.VariableDeclaration) {
                fragment = [
                  expr.left.kind,
                  noEmptySpace(),
                  this.generateStatement(expr.left.declarations[0], S_FFFF)
                ];
              } else {
                fragment = this.generateExpression(expr.left, Precedence.Call, E_TTT);
              }
              fragment = join(fragment, expr.of ? 'of' : 'in');
              fragment = join(fragment, this.generateExpression(expr.right, Precedence.Sequence, E_TTT));
              return [
                'for' + space + '(',
                fragment,
                ')'
              ];
            },
            SpreadElement: function (expr, precedence, flags) {
              return [
                '...',
                this.generateExpression(expr.argument, Precedence.Assignment, E_TTT)
              ];
            },
            TaggedTemplateExpression: function (expr, precedence, flags) {
              var itemFlags = E_TTF;
              if (!(flags & F_ALLOW_CALL)) {
                itemFlags = E_TFF;
              }
              var result = [
                  this.generateExpression(expr.tag, Precedence.Call, itemFlags),
                  this.generateExpression(expr.quasi, Precedence.Primary, E_FFT)
                ];
              return parenthesize(result, Precedence.TaggedTemplate, precedence);
            },
            TemplateElement: function (expr, precedence, flags) {
              return expr.value.raw;
            },
            TemplateLiteral: function (expr, precedence, flags) {
              var result, i, iz;
              result = ['`'];
              for (i = 0, iz = expr.quasis.length; i < iz; ++i) {
                result.push(this.generateExpression(expr.quasis[i], Precedence.Primary, E_TTT));
                if (i + 1 < iz) {
                  result.push('${' + space);
                  result.push(this.generateExpression(expr.expressions[i], Precedence.Sequence, E_TTT));
                  result.push(space + '}');
                }
              }
              result.push('`');
              return result;
            },
            ModuleSpecifier: function (expr, precedence, flags) {
              return this.Literal(expr, precedence, flags);
            }
          };
          merge(CodeGenerator.prototype, CodeGenerator.Expression);
          CodeGenerator.prototype.generateExpression = function (expr, precedence, flags) {
            var result, type;
            type = expr.type || Syntax.Property;
            if (extra.verbatim && expr.hasOwnProperty(extra.verbatim)) {
              return generateVerbatim(expr, precedence);
            }
            result = this[type](expr, precedence, flags);
            if (extra.comment) {
              result = addComments(expr, result);
            }
            return toSourceNodeWhenNeeded(result, expr);
          };
          CodeGenerator.prototype.generateStatement = function (stmt, flags) {
            var result, fragment;
            result = this[stmt.type](stmt, flags);
            if (extra.comment) {
              result = addComments(stmt, result);
            }
            fragment = toSourceNodeWhenNeeded(result).toString();
            if (stmt.type === Syntax.Program && !safeConcatenation && newline === '' && fragment.charAt(fragment.length - 1) === '\n') {
              result = sourceMap ? toSourceNodeWhenNeeded(result).replaceRight(/\s+$/, '') : fragment.replace(/\s+$/, '');
            }
            return toSourceNodeWhenNeeded(result, stmt);
          };
          function generateInternal(node) {
            var codegen;
            codegen = new CodeGenerator;
            if (isStatement(node)) {
              return codegen.generateStatement(node, S_TFFF);
            }
            if (isExpression(node)) {
              return codegen.generateExpression(node, Precedence.Sequence, E_TTT);
            }
            throw new Error('Unknown node type: ' + node.type);
          }
          function generate(node, options) {
            var defaultOptions = getDefaultOptions(), result, pair;
            if (options != null) {
              if (typeof options.indent === 'string') {
                defaultOptions.format.indent.style = options.indent;
              }
              if (typeof options.base === 'number') {
                defaultOptions.format.indent.base = options.base;
              }
              options = updateDeeply(defaultOptions, options);
              indent = options.format.indent.style;
              if (typeof options.base === 'string') {
                base = options.base;
              } else {
                base = stringRepeat(indent, options.format.indent.base);
              }
            } else {
              options = defaultOptions;
              indent = options.format.indent.style;
              base = stringRepeat(indent, options.format.indent.base);
            }
            json = options.format.json;
            renumber = options.format.renumber;
            hexadecimal = json ? false : options.format.hexadecimal;
            quotes = json ? 'double' : options.format.quotes;
            escapeless = options.format.escapeless;
            newline = options.format.newline;
            space = options.format.space;
            if (options.format.compact) {
              newline = space = indent = base = '';
            }
            parentheses = options.format.parentheses;
            semicolons = options.format.semicolons;
            safeConcatenation = options.format.safeConcatenation;
            directive = options.directive;
            parse = json ? null : options.parse;
            sourceMap = options.sourceMap;
            sourceCode = options.sourceCode;
            preserveBlankLines = options.format.preserveBlankLines && sourceCode !== null;
            extra = options;
            if (sourceMap) {
              if (!exports.browser) {
                SourceNode = require('/node_modules/source-map/source-map.js', module).SourceNode;
              } else {
                SourceNode = global.sourceMap.SourceNode;
              }
            }
            result = generateInternal(node);
            if (!sourceMap) {
              pair = {
                code: result.toString(),
                map: null
              };
              return options.sourceMapWithCode ? pair : pair.code;
            }
            pair = result.toStringWithSourceMap({
              file: options.file,
              sourceRoot: options.sourceMapRoot
            });
            if (options.sourceContent) {
              pair.map.setSourceContent(options.sourceMap, options.sourceContent);
            }
            if (options.sourceMapWithCode) {
              return pair;
            }
            return pair.map.toString();
          }
          FORMAT_MINIFY = {
            indent: {
              style: '',
              base: 0
            },
            renumber: true,
            hexadecimal: true,
            quotes: 'auto',
            escapeless: true,
            compact: true,
            parentheses: false,
            semicolons: false
          };
          FORMAT_DEFAULTS = getDefaultOptions().format;
          exports.version = require('/package.json', module).version;
          exports.generate = generate;
          exports.attachComments = estraverse.attachComments;
          exports.Precedence = updateDeeply({}, Precedence);
          exports.browser = false;
          exports.FORMAT_MINIFY = FORMAT_MINIFY;
          exports.FORMAT_DEFAULTS = FORMAT_DEFAULTS;
        }());
      });
      require.define('/package.json', function (module, exports, __dirname, __filename) {
        module.exports = {
          'name': 'escodegen',
          'description': 'ECMAScript code generator',
          'homepage': 'http://github.com/estools/escodegen',
          'main': 'escodegen.js',
          'bin': {
            'esgenerate': './bin/esgenerate.js',
            'escodegen': './bin/escodegen.js'
          },
          'files': [
            'LICENSE.BSD',
            'README.md',
            'bin',
            'escodegen.js',
            'package.json'
          ],
          'version': '1.9.0',
          'engines': { 'node': '>=0.12.0' },
          'maintainers': [{
              'name': 'Yusuke Suzuki',
              'email': 'utatane.tea@gmail.com',
              'web': 'http://github.com/Constellation'
            }],
          'repository': {
            'type': 'git',
            'url': 'http://github.com/estools/escodegen.git'
          },
          'dependencies': {
            'estraverse': '^4.2.0',
            'esutils': '^2.0.2',
            'esprima': '^3.1.3',
            'optionator': '^0.8.1'
          },
          'optionalDependencies': { 'source-map': '~0.5.6' },
          'devDependencies': {
            'acorn': '^4.0.4',
            'bluebird': '^3.4.7',
            'bower-registry-client': '^1.0.0',
            'chai': '^3.5.0',
            'commonjs-everywhere': '^0.9.7',
            'gulp': '^3.8.10',
            'gulp-eslint': '^3.0.1',
            'gulp-mocha': '^3.0.1',
            'semver': '^5.1.0'
          },
          'license': 'BSD-2-Clause',
          'scripts': {
            'test': 'gulp travis',
            'unit-test': 'gulp test',
            'lint': 'gulp lint',
            'release': 'node tools/release.js',
            'build-min': './node_modules/.bin/cjsify -ma path: tools/entry-point.js > escodegen.browser.min.js',
            'build': './node_modules/.bin/cjsify -a path: tools/entry-point.js > escodegen.browser.js'
          }
        };
      });
      require.define('/node_modules/source-map/source-map.js', function (module, exports, __dirname, __filename) {
        exports.SourceMapGenerator = require('/node_modules/source-map/lib/source-map-generator.js', module).SourceMapGenerator;
        exports.SourceMapConsumer = require('/node_modules/source-map/lib/source-map-consumer.js', module).SourceMapConsumer;
        exports.SourceNode = require('/node_modules/source-map/lib/source-node.js', module).SourceNode;
      });
      require.define('/node_modules/source-map/lib/source-node.js', function (module, exports, __dirname, __filename) {
        var SourceMapGenerator = require('/node_modules/source-map/lib/source-map-generator.js', module).SourceMapGenerator;
        var util = require('/node_modules/source-map/lib/util.js', module);
        var REGEX_NEWLINE = /(\r?\n)/;
        var NEWLINE_CODE = 10;
        var isSourceNode = '$$$isSourceNode$$$';
        function SourceNode(aLine, aColumn, aSource, aChunks, aName) {
          this.children = [];
          this.sourceContents = {};
          this.line = aLine == null ? null : aLine;
          this.column = aColumn == null ? null : aColumn;
          this.source = aSource == null ? null : aSource;
          this.name = aName == null ? null : aName;
          this[isSourceNode] = true;
          if (aChunks != null)
            this.add(aChunks);
        }
        SourceNode.fromStringWithSourceMap = function SourceNode_fromStringWithSourceMap(aGeneratedCode, aSourceMapConsumer, aRelativePath) {
          var node = new SourceNode;
          var remainingLines = aGeneratedCode.split(REGEX_NEWLINE);
          var remainingLinesIndex = 0;
          var shiftNextLine = function () {
            var lineContents = getNextLine();
            var newLine = getNextLine() || '';
            return lineContents + newLine;
            function getNextLine() {
              return remainingLinesIndex < remainingLines.length ? remainingLines[remainingLinesIndex++] : undefined;
            }
          };
          var lastGeneratedLine = 1, lastGeneratedColumn = 0;
          var lastMapping = null;
          aSourceMapConsumer.eachMapping(function (mapping) {
            if (lastMapping !== null) {
              if (lastGeneratedLine < mapping.generatedLine) {
                addMappingWithCode(lastMapping, shiftNextLine());
                lastGeneratedLine++;
                lastGeneratedColumn = 0;
              } else {
                var nextLine = remainingLines[remainingLinesIndex];
                var code = nextLine.substr(0, mapping.generatedColumn - lastGeneratedColumn);
                remainingLines[remainingLinesIndex] = nextLine.substr(mapping.generatedColumn - lastGeneratedColumn);
                lastGeneratedColumn = mapping.generatedColumn;
                addMappingWithCode(lastMapping, code);
                lastMapping = mapping;
                return;
              }
            }
            while (lastGeneratedLine < mapping.generatedLine) {
              node.add(shiftNextLine());
              lastGeneratedLine++;
            }
            if (lastGeneratedColumn < mapping.generatedColumn) {
              var nextLine = remainingLines[remainingLinesIndex];
              node.add(nextLine.substr(0, mapping.generatedColumn));
              remainingLines[remainingLinesIndex] = nextLine.substr(mapping.generatedColumn);
              lastGeneratedColumn = mapping.generatedColumn;
            }
            lastMapping = mapping;
          }, this);
          if (remainingLinesIndex < remainingLines.length) {
            if (lastMapping) {
              addMappingWithCode(lastMapping, shiftNextLine());
            }
            node.add(remainingLines.splice(remainingLinesIndex).join(''));
          }
          aSourceMapConsumer.sources.forEach(function (sourceFile) {
            var content = aSourceMapConsumer.sourceContentFor(sourceFile);
            if (content != null) {
              if (aRelativePath != null) {
                sourceFile = util.join(aRelativePath, sourceFile);
              }
              node.setSourceContent(sourceFile, content);
            }
          });
          return node;
          function addMappingWithCode(mapping, code) {
            if (mapping === null || mapping.source === undefined) {
              node.add(code);
            } else {
              var source = aRelativePath ? util.join(aRelativePath, mapping.source) : mapping.source;
              node.add(new SourceNode(mapping.originalLine, mapping.originalColumn, source, code, mapping.name));
            }
          }
        };
        SourceNode.prototype.add = function SourceNode_add(aChunk) {
          if (Array.isArray(aChunk)) {
            aChunk.forEach(function (chunk) {
              this.add(chunk);
            }, this);
          } else if (aChunk[isSourceNode] || typeof aChunk === 'string') {
            if (aChunk) {
              this.children.push(aChunk);
            }
          } else {
            throw new TypeError('Expected a SourceNode, string, or an array of SourceNodes and strings. Got ' + aChunk);
          }
          return this;
        };
        SourceNode.prototype.prepend = function SourceNode_prepend(aChunk) {
          if (Array.isArray(aChunk)) {
            for (var i = aChunk.length - 1; i >= 0; i--) {
              this.prepend(aChunk[i]);
            }
          } else if (aChunk[isSourceNode] || typeof aChunk === 'string') {
            this.children.unshift(aChunk);
          } else {
            throw new TypeError('Expected a SourceNode, string, or an array of SourceNodes and strings. Got ' + aChunk);
          }
          return this;
        };
        SourceNode.prototype.walk = function SourceNode_walk(aFn) {
          var chunk;
          for (var i = 0, len = this.children.length; i < len; i++) {
            chunk = this.children[i];
            if (chunk[isSourceNode]) {
              chunk.walk(aFn);
            } else {
              if (chunk !== '') {
                aFn(chunk, {
                  source: this.source,
                  line: this.line,
                  column: this.column,
                  name: this.name
                });
              }
            }
          }
        };
        SourceNode.prototype.join = function SourceNode_join(aSep) {
          var newChildren;
          var i;
          var len = this.children.length;
          if (len > 0) {
            newChildren = [];
            for (i = 0; i < len - 1; i++) {
              newChildren.push(this.children[i]);
              newChildren.push(aSep);
            }
            newChildren.push(this.children[i]);
            this.children = newChildren;
          }
          return this;
        };
        SourceNode.prototype.replaceRight = function SourceNode_replaceRight(aPattern, aReplacement) {
          var lastChild = this.children[this.children.length - 1];
          if (lastChild[isSourceNode]) {
            lastChild.replaceRight(aPattern, aReplacement);
          } else if (typeof lastChild === 'string') {
            this.children[this.children.length - 1] = lastChild.replace(aPattern, aReplacement);
          } else {
            this.children.push(''.replace(aPattern, aReplacement));
          }
          return this;
        };
        SourceNode.prototype.setSourceContent = function SourceNode_setSourceContent(aSourceFile, aSourceContent) {
          this.sourceContents[util.toSetString(aSourceFile)] = aSourceContent;
        };
        SourceNode.prototype.walkSourceContents = function SourceNode_walkSourceContents(aFn) {
          for (var i = 0, len = this.children.length; i < len; i++) {
            if (this.children[i][isSourceNode]) {
              this.children[i].walkSourceContents(aFn);
            }
          }
          var sources = Object.keys(this.sourceContents);
          for (var i = 0, len = sources.length; i < len; i++) {
            aFn(util.fromSetString(sources[i]), this.sourceContents[sources[i]]);
          }
        };
        SourceNode.prototype.toString = function SourceNode_toString() {
          var str = '';
          this.walk(function (chunk) {
            str += chunk;
          });
          return str;
        };
        SourceNode.prototype.toStringWithSourceMap = function SourceNode_toStringWithSourceMap(aArgs) {
          var generated = {
              code: '',
              line: 1,
              column: 0
            };
          var map = new SourceMapGenerator(aArgs);
          var sourceMappingActive = false;
          var lastOriginalSource = null;
          var lastOriginalLine = null;
          var lastOriginalColumn = null;
          var lastOriginalName = null;
          this.walk(function (chunk, original) {
            generated.code += chunk;
            if (original.source !== null && original.line !== null && original.column !== null) {
              if (lastOriginalSource !== original.source || lastOriginalLine !== original.line || lastOriginalColumn !== original.column || lastOriginalName !== original.name) {
                map.addMapping({
                  source: original.source,
                  original: {
                    line: original.line,
                    column: original.column
                  },
                  generated: {
                    line: generated.line,
                    column: generated.column
                  },
                  name: original.name
                });
              }
              lastOriginalSource = original.source;
              lastOriginalLine = original.line;
              lastOriginalColumn = original.column;
              lastOriginalName = original.name;
              sourceMappingActive = true;
            } else if (sourceMappingActive) {
              map.addMapping({
                generated: {
                  line: generated.line,
                  column: generated.column
                }
              });
              lastOriginalSource = null;
              sourceMappingActive = false;
            }
            for (var idx = 0, length = chunk.length; idx < length; idx++) {
              if (chunk.charCodeAt(idx) === NEWLINE_CODE) {
                generated.line++;
                generated.column = 0;
                if (idx + 1 === length) {
                  lastOriginalSource = null;
                  sourceMappingActive = false;
                } else if (sourceMappingActive) {
                  map.addMapping({
                    source: original.source,
                    original: {
                      line: original.line,
                      column: original.column
                    },
                    generated: {
                      line: generated.line,
                      column: generated.column
                    },
                    name: original.name
                  });
                }
              } else {
                generated.column++;
              }
            }
          });
          this.walkSourceContents(function (sourceFile, sourceContent) {
            map.setSourceContent(sourceFile, sourceContent);
          });
          return {
            code: generated.code,
            map: map
          };
        };
        exports.SourceNode = SourceNode;
      });
      require.define('/node_modules/source-map/lib/util.js', function (module, exports, __dirname, __filename) {
        function getArg(aArgs, aName, aDefaultValue) {
          if (aName in aArgs) {
            return aArgs[aName];
          } else if (arguments.length === 3) {
            return aDefaultValue;
          } else {
            throw new Error('"' + aName + '" is a required argument.');
          }
        }
        exports.getArg = getArg;
        var urlRegexp = /^(?:([\w+\-.]+):)?\/\/(?:(\w+:\w+)@)?([\w.]*)(?::(\d+))?(\S*)$/;
        var dataUrlRegexp = /^data:.+\,.+$/;
        function urlParse(aUrl) {
          var match = aUrl.match(urlRegexp);
          if (!match) {
            return null;
          }
          return {
            scheme: match[1],
            auth: match[2],
            host: match[3],
            port: match[4],
            path: match[5]
          };
        }
        exports.urlParse = urlParse;
        function urlGenerate(aParsedUrl) {
          var url = '';
          if (aParsedUrl.scheme) {
            url += aParsedUrl.scheme + ':';
          }
          url += '//';
          if (aParsedUrl.auth) {
            url += aParsedUrl.auth + '@';
          }
          if (aParsedUrl.host) {
            url += aParsedUrl.host;
          }
          if (aParsedUrl.port) {
            url += ':' + aParsedUrl.port;
          }
          if (aParsedUrl.path) {
            url += aParsedUrl.path;
          }
          return url;
        }
        exports.urlGenerate = urlGenerate;
        function normalize(aPath) {
          var path = aPath;
          var url = urlParse(aPath);
          if (url) {
            if (!url.path) {
              return aPath;
            }
            path = url.path;
          }
          var isAbsolute = exports.isAbsolute(path);
          var parts = path.split(/\/+/);
          for (var part, up = 0, i = parts.length - 1; i >= 0; i--) {
            part = parts[i];
            if (part === '.') {
              parts.splice(i, 1);
            } else if (part === '..') {
              up++;
            } else if (up > 0) {
              if (part === '') {
                parts.splice(i + 1, up);
                up = 0;
              } else {
                parts.splice(i, 2);
                up--;
              }
            }
          }
          path = parts.join('/');
          if (path === '') {
            path = isAbsolute ? '/' : '.';
          }
          if (url) {
            url.path = path;
            return urlGenerate(url);
          }
          return path;
        }
        exports.normalize = normalize;
        function join(aRoot, aPath) {
          if (aRoot === '') {
            aRoot = '.';
          }
          if (aPath === '') {
            aPath = '.';
          }
          var aPathUrl = urlParse(aPath);
          var aRootUrl = urlParse(aRoot);
          if (aRootUrl) {
            aRoot = aRootUrl.path || '/';
          }
          if (aPathUrl && !aPathUrl.scheme) {
            if (aRootUrl) {
              aPathUrl.scheme = aRootUrl.scheme;
            }
            return urlGenerate(aPathUrl);
          }
          if (aPathUrl || aPath.match(dataUrlRegexp)) {
            return aPath;
          }
          if (aRootUrl && !aRootUrl.host && !aRootUrl.path) {
            aRootUrl.host = aPath;
            return urlGenerate(aRootUrl);
          }
          var joined = aPath.charAt(0) === '/' ? aPath : normalize(aRoot.replace(/\/+$/, '') + '/' + aPath);
          if (aRootUrl) {
            aRootUrl.path = joined;
            return urlGenerate(aRootUrl);
          }
          return joined;
        }
        exports.join = join;
        exports.isAbsolute = function (aPath) {
          return aPath.charAt(0) === '/' || !!aPath.match(urlRegexp);
        };
        function relative(aRoot, aPath) {
          if (aRoot === '') {
            aRoot = '.';
          }
          aRoot = aRoot.replace(/\/$/, '');
          var level = 0;
          while (aPath.indexOf(aRoot + '/') !== 0) {
            var index = aRoot.lastIndexOf('/');
            if (index < 0) {
              return aPath;
            }
            aRoot = aRoot.slice(0, index);
            if (aRoot.match(/^([^\/]+:\/)?\/*$/)) {
              return aPath;
            }
            ++level;
          }
          return Array(level + 1).join('../') + aPath.substr(aRoot.length + 1);
        }
        exports.relative = relative;
        var supportsNullProto = function () {
            var obj = Object.create(null);
            return !('__proto__' in obj);
          }();
        function identity(s) {
          return s;
        }
        function toSetString(aStr) {
          if (isProtoString(aStr)) {
            return '$' + aStr;
          }
          return aStr;
        }
        exports.toSetString = supportsNullProto ? identity : toSetString;
        function fromSetString(aStr) {
          if (isProtoString(aStr)) {
            return aStr.slice(1);
          }
          return aStr;
        }
        exports.fromSetString = supportsNullProto ? identity : fromSetString;
        function isProtoString(s) {
          if (!s) {
            return false;
          }
          var length = s.length;
          if (length < 9) {
            return false;
          }
          if (s.charCodeAt(length - 1) !== 95 || s.charCodeAt(length - 2) !== 95 || s.charCodeAt(length - 3) !== 111 || s.charCodeAt(length - 4) !== 116 || s.charCodeAt(length - 5) !== 111 || s.charCodeAt(length - 6) !== 114 || s.charCodeAt(length - 7) !== 112 || s.charCodeAt(length - 8) !== 95 || s.charCodeAt(length - 9) !== 95) {
            return false;
          }
          for (var i = length - 10; i >= 0; i--) {
            if (s.charCodeAt(i) !== 36) {
              return false;
            }
          }
          return true;
        }
        function compareByOriginalPositions(mappingA, mappingB, onlyCompareOriginal) {
          var cmp = mappingA.source - mappingB.source;
          if (cmp !== 0) {
            return cmp;
          }
          cmp = mappingA.originalLine - mappingB.originalLine;
          if (cmp !== 0) {
            return cmp;
          }
          cmp = mappingA.originalColumn - mappingB.originalColumn;
          if (cmp !== 0 || onlyCompareOriginal) {
            return cmp;
          }
          cmp = mappingA.generatedColumn - mappingB.generatedColumn;
          if (cmp !== 0) {
            return cmp;
          }
          cmp = mappingA.generatedLine - mappingB.generatedLine;
          if (cmp !== 0) {
            return cmp;
          }
          return mappingA.name - mappingB.name;
        }
        exports.compareByOriginalPositions = compareByOriginalPositions;
        function compareByGeneratedPositionsDeflated(mappingA, mappingB, onlyCompareGenerated) {
          var cmp = mappingA.generatedLine - mappingB.generatedLine;
          if (cmp !== 0) {
            return cmp;
          }
          cmp = mappingA.generatedColumn - mappingB.generatedColumn;
          if (cmp !== 0 || onlyCompareGenerated) {
            return cmp;
          }
          cmp = mappingA.source - mappingB.source;
          if (cmp !== 0) {
            return cmp;
          }
          cmp = mappingA.originalLine - mappingB.originalLine;
          if (cmp !== 0) {
            return cmp;
          }
          cmp = mappingA.originalColumn - mappingB.originalColumn;
          if (cmp !== 0) {
            return cmp;
          }
          return mappingA.name - mappingB.name;
        }
        exports.compareByGeneratedPositionsDeflated = compareByGeneratedPositionsDeflated;
        function strcmp(aStr1, aStr2) {
          if (aStr1 === aStr2) {
            return 0;
          }
          if (aStr1 > aStr2) {
            return 1;
          }
          return -1;
        }
        function compareByGeneratedPositionsInflated(mappingA, mappingB) {
          var cmp = mappingA.generatedLine - mappingB.generatedLine;
          if (cmp !== 0) {
            return cmp;
          }
          cmp = mappingA.generatedColumn - mappingB.generatedColumn;
          if (cmp !== 0) {
            return cmp;
          }
          cmp = strcmp(mappingA.source, mappingB.source);
          if (cmp !== 0) {
            return cmp;
          }
          cmp = mappingA.originalLine - mappingB.originalLine;
          if (cmp !== 0) {
            return cmp;
          }
          cmp = mappingA.originalColumn - mappingB.originalColumn;
          if (cmp !== 0) {
            return cmp;
          }
          return strcmp(mappingA.name, mappingB.name);
        }
        exports.compareByGeneratedPositionsInflated = compareByGeneratedPositionsInflated;
      });
      require.define('/node_modules/source-map/lib/source-map-generator.js', function (module, exports, __dirname, __filename) {
        var base64VLQ = require('/node_modules/source-map/lib/base64-vlq.js', module);
        var util = require('/node_modules/source-map/lib/util.js', module);
        var ArraySet = require('/node_modules/source-map/lib/array-set.js', module).ArraySet;
        var MappingList = require('/node_modules/source-map/lib/mapping-list.js', module).MappingList;
        function SourceMapGenerator(aArgs) {
          if (!aArgs) {
            aArgs = {};
          }
          this._file = util.getArg(aArgs, 'file', null);
          this._sourceRoot = util.getArg(aArgs, 'sourceRoot', null);
          this._skipValidation = util.getArg(aArgs, 'skipValidation', false);
          this._sources = new ArraySet;
          this._names = new ArraySet;
          this._mappings = new MappingList;
          this._sourcesContents = null;
        }
        SourceMapGenerator.prototype._version = 3;
        SourceMapGenerator.fromSourceMap = function SourceMapGenerator_fromSourceMap(aSourceMapConsumer) {
          var sourceRoot = aSourceMapConsumer.sourceRoot;
          var generator = new SourceMapGenerator({
              file: aSourceMapConsumer.file,
              sourceRoot: sourceRoot
            });
          aSourceMapConsumer.eachMapping(function (mapping) {
            var newMapping = {
                generated: {
                  line: mapping.generatedLine,
                  column: mapping.generatedColumn
                }
              };
            if (mapping.source != null) {
              newMapping.source = mapping.source;
              if (sourceRoot != null) {
                newMapping.source = util.relative(sourceRoot, newMapping.source);
              }
              newMapping.original = {
                line: mapping.originalLine,
                column: mapping.originalColumn
              };
              if (mapping.name != null) {
                newMapping.name = mapping.name;
              }
            }
            generator.addMapping(newMapping);
          });
          aSourceMapConsumer.sources.forEach(function (sourceFile) {
            var content = aSourceMapConsumer.sourceContentFor(sourceFile);
            if (content != null) {
              generator.setSourceContent(sourceFile, content);
            }
          });
          return generator;
        };
        SourceMapGenerator.prototype.addMapping = function SourceMapGenerator_addMapping(aArgs) {
          var generated = util.getArg(aArgs, 'generated');
          var original = util.getArg(aArgs, 'original', null);
          var source = util.getArg(aArgs, 'source', null);
          var name = util.getArg(aArgs, 'name', null);
          if (!this._skipValidation) {
            this._validateMapping(generated, original, source, name);
          }
          if (source != null) {
            source = String(source);
            if (!this._sources.has(source)) {
              this._sources.add(source);
            }
          }
          if (name != null) {
            name = String(name);
            if (!this._names.has(name)) {
              this._names.add(name);
            }
          }
          this._mappings.add({
            generatedLine: generated.line,
            generatedColumn: generated.column,
            originalLine: original != null && original.line,
            originalColumn: original != null && original.column,
            source: source,
            name: name
          });
        };
        SourceMapGenerator.prototype.setSourceContent = function SourceMapGenerator_setSourceContent(aSourceFile, aSourceContent) {
          var source = aSourceFile;
          if (this._sourceRoot != null) {
            source = util.relative(this._sourceRoot, source);
          }
          if (aSourceContent != null) {
            if (!this._sourcesContents) {
              this._sourcesContents = Object.create(null);
            }
            this._sourcesContents[util.toSetString(source)] = aSourceContent;
          } else if (this._sourcesContents) {
            delete this._sourcesContents[util.toSetString(source)];
            if (Object.keys(this._sourcesContents).length === 0) {
              this._sourcesContents = null;
            }
          }
        };
        SourceMapGenerator.prototype.applySourceMap = function SourceMapGenerator_applySourceMap(aSourceMapConsumer, aSourceFile, aSourceMapPath) {
          var sourceFile = aSourceFile;
          if (aSourceFile == null) {
            if (aSourceMapConsumer.file == null) {
              throw new Error('SourceMapGenerator.prototype.applySourceMap requires either an explicit source file, ' + 'or the source map\'s "file" property. Both were omitted.');
            }
            sourceFile = aSourceMapConsumer.file;
          }
          var sourceRoot = this._sourceRoot;
          if (sourceRoot != null) {
            sourceFile = util.relative(sourceRoot, sourceFile);
          }
          var newSources = new ArraySet;
          var newNames = new ArraySet;
          this._mappings.unsortedForEach(function (mapping) {
            if (mapping.source === sourceFile && mapping.originalLine != null) {
              var original = aSourceMapConsumer.originalPositionFor({
                  line: mapping.originalLine,
                  column: mapping.originalColumn
                });
              if (original.source != null) {
                mapping.source = original.source;
                if (aSourceMapPath != null) {
                  mapping.source = util.join(aSourceMapPath, mapping.source);
                }
                if (sourceRoot != null) {
                  mapping.source = util.relative(sourceRoot, mapping.source);
                }
                mapping.originalLine = original.line;
                mapping.originalColumn = original.column;
                if (original.name != null) {
                  mapping.name = original.name;
                }
              }
            }
            var source = mapping.source;
            if (source != null && !newSources.has(source)) {
              newSources.add(source);
            }
            var name = mapping.name;
            if (name != null && !newNames.has(name)) {
              newNames.add(name);
            }
          }, this);
          this._sources = newSources;
          this._names = newNames;
          aSourceMapConsumer.sources.forEach(function (sourceFile) {
            var content = aSourceMapConsumer.sourceContentFor(sourceFile);
            if (content != null) {
              if (aSourceMapPath != null) {
                sourceFile = util.join(aSourceMapPath, sourceFile);
              }
              if (sourceRoot != null) {
                sourceFile = util.relative(sourceRoot, sourceFile);
              }
              this.setSourceContent(sourceFile, content);
            }
          }, this);
        };
        SourceMapGenerator.prototype._validateMapping = function SourceMapGenerator_validateMapping(aGenerated, aOriginal, aSource, aName) {
          if (aOriginal && typeof aOriginal.line !== 'number' && typeof aOriginal.column !== 'number') {
            throw new Error('original.line and original.column are not numbers -- you probably meant to omit ' + 'the original mapping entirely and only map the generated position. If so, pass ' + 'null for the original mapping instead of an object with empty or null values.');
          }
          if (aGenerated && 'line' in aGenerated && 'column' in aGenerated && aGenerated.line > 0 && aGenerated.column >= 0 && !aOriginal && !aSource && !aName) {
            return;
          } else if (aGenerated && 'line' in aGenerated && 'column' in aGenerated && aOriginal && 'line' in aOriginal && 'column' in aOriginal && aGenerated.line > 0 && aGenerated.column >= 0 && aOriginal.line > 0 && aOriginal.column >= 0 && aSource) {
            return;
          } else {
            throw new Error('Invalid mapping: ' + JSON.stringify({
              generated: aGenerated,
              source: aSource,
              original: aOriginal,
              name: aName
            }));
          }
        };
        SourceMapGenerator.prototype._serializeMappings = function SourceMapGenerator_serializeMappings() {
          var previousGeneratedColumn = 0;
          var previousGeneratedLine = 1;
          var previousOriginalColumn = 0;
          var previousOriginalLine = 0;
          var previousName = 0;
          var previousSource = 0;
          var result = '';
          var next;
          var mapping;
          var nameIdx;
          var sourceIdx;
          var mappings = this._mappings.toArray();
          for (var i = 0, len = mappings.length; i < len; i++) {
            mapping = mappings[i];
            next = '';
            if (mapping.generatedLine !== previousGeneratedLine) {
              previousGeneratedColumn = 0;
              while (mapping.generatedLine !== previousGeneratedLine) {
                next += ';';
                previousGeneratedLine++;
              }
            } else {
              if (i > 0) {
                if (!util.compareByGeneratedPositionsInflated(mapping, mappings[i - 1])) {
                  continue;
                }
                next += ',';
              }
            }
            next += base64VLQ.encode(mapping.generatedColumn - previousGeneratedColumn);
            previousGeneratedColumn = mapping.generatedColumn;
            if (mapping.source != null) {
              sourceIdx = this._sources.indexOf(mapping.source);
              next += base64VLQ.encode(sourceIdx - previousSource);
              previousSource = sourceIdx;
              next += base64VLQ.encode(mapping.originalLine - 1 - previousOriginalLine);
              previousOriginalLine = mapping.originalLine - 1;
              next += base64VLQ.encode(mapping.originalColumn - previousOriginalColumn);
              previousOriginalColumn = mapping.originalColumn;
              if (mapping.name != null) {
                nameIdx = this._names.indexOf(mapping.name);
                next += base64VLQ.encode(nameIdx - previousName);
                previousName = nameIdx;
              }
            }
            result += next;
          }
          return result;
        };
        SourceMapGenerator.prototype._generateSourcesContent = function SourceMapGenerator_generateSourcesContent(aSources, aSourceRoot) {
          return aSources.map(function (source) {
            if (!this._sourcesContents) {
              return null;
            }
            if (aSourceRoot != null) {
              source = util.relative(aSourceRoot, source);
            }
            var key = util.toSetString(source);
            return Object.prototype.hasOwnProperty.call(this._sourcesContents, key) ? this._sourcesContents[key] : null;
          }, this);
        };
        SourceMapGenerator.prototype.toJSON = function SourceMapGenerator_toJSON() {
          var map = {
              version: this._version,
              sources: this._sources.toArray(),
              names: this._names.toArray(),
              mappings: this._serializeMappings()
            };
          if (this._file != null) {
            map.file = this._file;
          }
          if (this._sourceRoot != null) {
            map.sourceRoot = this._sourceRoot;
          }
          if (this._sourcesContents) {
            map.sourcesContent = this._generateSourcesContent(map.sources, map.sourceRoot);
          }
          return map;
        };
        SourceMapGenerator.prototype.toString = function SourceMapGenerator_toString() {
          return JSON.stringify(this.toJSON());
        };
        exports.SourceMapGenerator = SourceMapGenerator;
      });
      require.define('/node_modules/source-map/lib/mapping-list.js', function (module, exports, __dirname, __filename) {
        var util = require('/node_modules/source-map/lib/util.js', module);
        function generatedPositionAfter(mappingA, mappingB) {
          var lineA = mappingA.generatedLine;
          var lineB = mappingB.generatedLine;
          var columnA = mappingA.generatedColumn;
          var columnB = mappingB.generatedColumn;
          return lineB > lineA || lineB == lineA && columnB >= columnA || util.compareByGeneratedPositionsInflated(mappingA, mappingB) <= 0;
        }
        function MappingList() {
          this._array = [];
          this._sorted = true;
          this._last = {
            generatedLine: -1,
            generatedColumn: 0
          };
        }
        MappingList.prototype.unsortedForEach = function MappingList_forEach(aCallback, aThisArg) {
          this._array.forEach(aCallback, aThisArg);
        };
        MappingList.prototype.add = function MappingList_add(aMapping) {
          if (generatedPositionAfter(this._last, aMapping)) {
            this._last = aMapping;
            this._array.push(aMapping);
          } else {
            this._sorted = false;
            this._array.push(aMapping);
          }
        };
        MappingList.prototype.toArray = function MappingList_toArray() {
          if (!this._sorted) {
            this._array.sort(util.compareByGeneratedPositionsInflated);
            this._sorted = true;
          }
          return this._array;
        };
        exports.MappingList = MappingList;
      });
      require.define('/node_modules/source-map/lib/array-set.js', function (module, exports, __dirname, __filename) {
        var util = require('/node_modules/source-map/lib/util.js', module);
        var has = Object.prototype.hasOwnProperty;
        var hasNativeMap = typeof Map !== 'undefined';
        function ArraySet() {
          this._array = [];
          this._set = hasNativeMap ? new Map : Object.create(null);
        }
        ArraySet.fromArray = function ArraySet_fromArray(aArray, aAllowDuplicates) {
          var set = new ArraySet;
          for (var i = 0, len = aArray.length; i < len; i++) {
            set.add(aArray[i], aAllowDuplicates);
          }
          return set;
        };
        ArraySet.prototype.size = function ArraySet_size() {
          return hasNativeMap ? this._set.size : Object.getOwnPropertyNames(this._set).length;
        };
        ArraySet.prototype.add = function ArraySet_add(aStr, aAllowDuplicates) {
          var sStr = hasNativeMap ? aStr : util.toSetString(aStr);
          var isDuplicate = hasNativeMap ? this.has(aStr) : has.call(this._set, sStr);
          var idx = this._array.length;
          if (!isDuplicate || aAllowDuplicates) {
            this._array.push(aStr);
          }
          if (!isDuplicate) {
            if (hasNativeMap) {
              this._set.set(aStr, idx);
            } else {
              this._set[sStr] = idx;
            }
          }
        };
        ArraySet.prototype.has = function ArraySet_has(aStr) {
          if (hasNativeMap) {
            return this._set.has(aStr);
          } else {
            var sStr = util.toSetString(aStr);
            return has.call(this._set, sStr);
          }
        };
        ArraySet.prototype.indexOf = function ArraySet_indexOf(aStr) {
          if (hasNativeMap) {
            var idx = this._set.get(aStr);
            if (idx >= 0) {
              return idx;
            }
          } else {
            var sStr = util.toSetString(aStr);
            if (has.call(this._set, sStr)) {
              return this._set[sStr];
            }
          }
          throw new Error('"' + aStr + '" is not in the set.');
        };
        ArraySet.prototype.at = function ArraySet_at(aIdx) {
          if (aIdx >= 0 && aIdx < this._array.length) {
            return this._array[aIdx];
          }
          throw new Error('No element indexed by ' + aIdx);
        };
        ArraySet.prototype.toArray = function ArraySet_toArray() {
          return this._array.slice();
        };
        exports.ArraySet = ArraySet;
      });
      require.define('/node_modules/source-map/lib/base64-vlq.js', function (module, exports, __dirname, __filename) {
        var base64 = require('/node_modules/source-map/lib/base64.js', module);
        var VLQ_BASE_SHIFT = 5;
        var VLQ_BASE = 1 << VLQ_BASE_SHIFT;
        var VLQ_BASE_MASK = VLQ_BASE - 1;
        var VLQ_CONTINUATION_BIT = VLQ_BASE;
        function toVLQSigned(aValue) {
          return aValue < 0 ? (-aValue << 1) + 1 : (aValue << 1) + 0;
        }
        function fromVLQSigned(aValue) {
          var isNegative = (aValue & 1) === 1;
          var shifted = aValue >> 1;
          return isNegative ? -shifted : shifted;
        }
        exports.encode = function base64VLQ_encode(aValue) {
          var encoded = '';
          var digit;
          var vlq = toVLQSigned(aValue);
          do {
            digit = vlq & VLQ_BASE_MASK;
            vlq >>>= VLQ_BASE_SHIFT;
            if (vlq > 0) {
              digit |= VLQ_CONTINUATION_BIT;
            }
            encoded += base64.encode(digit);
          } while (vlq > 0);
          return encoded;
        };
        exports.decode = function base64VLQ_decode(aStr, aIndex, aOutParam) {
          var strLen = aStr.length;
          var result = 0;
          var shift = 0;
          var continuation, digit;
          do {
            if (aIndex >= strLen) {
              throw new Error('Expected more digits in base 64 VLQ value.');
            }
            digit = base64.decode(aStr.charCodeAt(aIndex++));
            if (digit === -1) {
              throw new Error('Invalid base64 digit: ' + aStr.charAt(aIndex - 1));
            }
            continuation = !!(digit & VLQ_CONTINUATION_BIT);
            digit &= VLQ_BASE_MASK;
            result = result + (digit << shift);
            shift += VLQ_BASE_SHIFT;
          } while (continuation);
          aOutParam.value = fromVLQSigned(result);
          aOutParam.rest = aIndex;
        };
      });
      require.define('/node_modules/source-map/lib/base64.js', function (module, exports, __dirname, __filename) {
        var intToCharMap = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.split('');
        exports.encode = function (number) {
          if (0 <= number && number < intToCharMap.length) {
            return intToCharMap[number];
          }
          throw new TypeError('Must be between 0 and 63: ' + number);
        };
        exports.decode = function (charCode) {
          var bigA = 65;
          var bigZ = 90;
          var littleA = 97;
          var littleZ = 122;
          var zero = 48;
          var nine = 57;
          var plus = 43;
          var slash = 47;
          var littleOffset = 26;
          var numberOffset = 52;
          if (bigA <= charCode && charCode <= bigZ) {
            return charCode - bigA;
          }
          if (littleA <= charCode && charCode <= littleZ) {
            return charCode - littleA + littleOffset;
          }
          if (zero <= charCode && charCode <= nine) {
            return charCode - zero + numberOffset;
          }
          if (charCode == plus) {
            return 62;
          }
          if (charCode == slash) {
            return 63;
          }
          return -1;
        };
      });
      require.define('/node_modules/source-map/lib/source-map-consumer.js', function (module, exports, __dirname, __filename) {
        var util = require('/node_modules/source-map/lib/util.js', module);
        var binarySearch = require('/node_modules/source-map/lib/binary-search.js', module);
        var ArraySet = require('/node_modules/source-map/lib/array-set.js', module).ArraySet;
        var base64VLQ = require('/node_modules/source-map/lib/base64-vlq.js', module);
        var quickSort = require('/node_modules/source-map/lib/quick-sort.js', module).quickSort;
        function SourceMapConsumer(aSourceMap) {
          var sourceMap = aSourceMap;
          if (typeof aSourceMap === 'string') {
            sourceMap = JSON.parse(aSourceMap.replace(/^\)\]\}'/, ''));
          }
          return sourceMap.sections != null ? new IndexedSourceMapConsumer(sourceMap) : new BasicSourceMapConsumer(sourceMap);
        }
        SourceMapConsumer.fromSourceMap = function (aSourceMap) {
          return BasicSourceMapConsumer.fromSourceMap(aSourceMap);
        };
        SourceMapConsumer.prototype._version = 3;
        SourceMapConsumer.prototype.__generatedMappings = null;
        Object.defineProperty(SourceMapConsumer.prototype, '_generatedMappings', {
          get: function () {
            if (!this.__generatedMappings) {
              this._parseMappings(this._mappings, this.sourceRoot);
            }
            return this.__generatedMappings;
          }
        });
        SourceMapConsumer.prototype.__originalMappings = null;
        Object.defineProperty(SourceMapConsumer.prototype, '_originalMappings', {
          get: function () {
            if (!this.__originalMappings) {
              this._parseMappings(this._mappings, this.sourceRoot);
            }
            return this.__originalMappings;
          }
        });
        SourceMapConsumer.prototype._charIsMappingSeparator = function SourceMapConsumer_charIsMappingSeparator(aStr, index) {
          var c = aStr.charAt(index);
          return c === ';' || c === ',';
        };
        SourceMapConsumer.prototype._parseMappings = function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
          throw new Error('Subclasses must implement _parseMappings');
        };
        SourceMapConsumer.GENERATED_ORDER = 1;
        SourceMapConsumer.ORIGINAL_ORDER = 2;
        SourceMapConsumer.GREATEST_LOWER_BOUND = 1;
        SourceMapConsumer.LEAST_UPPER_BOUND = 2;
        SourceMapConsumer.prototype.eachMapping = function SourceMapConsumer_eachMapping(aCallback, aContext, aOrder) {
          var context = aContext || null;
          var order = aOrder || SourceMapConsumer.GENERATED_ORDER;
          var mappings;
          switch (order) {
          case SourceMapConsumer.GENERATED_ORDER:
            mappings = this._generatedMappings;
            break;
          case SourceMapConsumer.ORIGINAL_ORDER:
            mappings = this._originalMappings;
            break;
          default:
            throw new Error('Unknown order of iteration.');
          }
          var sourceRoot = this.sourceRoot;
          mappings.map(function (mapping) {
            var source = mapping.source === null ? null : this._sources.at(mapping.source);
            if (source != null && sourceRoot != null) {
              source = util.join(sourceRoot, source);
            }
            return {
              source: source,
              generatedLine: mapping.generatedLine,
              generatedColumn: mapping.generatedColumn,
              originalLine: mapping.originalLine,
              originalColumn: mapping.originalColumn,
              name: mapping.name === null ? null : this._names.at(mapping.name)
            };
          }, this).forEach(aCallback, context);
        };
        SourceMapConsumer.prototype.allGeneratedPositionsFor = function SourceMapConsumer_allGeneratedPositionsFor(aArgs) {
          var line = util.getArg(aArgs, 'line');
          var needle = {
              source: util.getArg(aArgs, 'source'),
              originalLine: line,
              originalColumn: util.getArg(aArgs, 'column', 0)
            };
          if (this.sourceRoot != null) {
            needle.source = util.relative(this.sourceRoot, needle.source);
          }
          if (!this._sources.has(needle.source)) {
            return [];
          }
          needle.source = this._sources.indexOf(needle.source);
          var mappings = [];
          var index = this._findMapping(needle, this._originalMappings, 'originalLine', 'originalColumn', util.compareByOriginalPositions, binarySearch.LEAST_UPPER_BOUND);
          if (index >= 0) {
            var mapping = this._originalMappings[index];
            if (aArgs.column === undefined) {
              var originalLine = mapping.originalLine;
              while (mapping && mapping.originalLine === originalLine) {
                mappings.push({
                  line: util.getArg(mapping, 'generatedLine', null),
                  column: util.getArg(mapping, 'generatedColumn', null),
                  lastColumn: util.getArg(mapping, 'lastGeneratedColumn', null)
                });
                mapping = this._originalMappings[++index];
              }
            } else {
              var originalColumn = mapping.originalColumn;
              while (mapping && mapping.originalLine === line && mapping.originalColumn == originalColumn) {
                mappings.push({
                  line: util.getArg(mapping, 'generatedLine', null),
                  column: util.getArg(mapping, 'generatedColumn', null),
                  lastColumn: util.getArg(mapping, 'lastGeneratedColumn', null)
                });
                mapping = this._originalMappings[++index];
              }
            }
          }
          return mappings;
        };
        exports.SourceMapConsumer = SourceMapConsumer;
        function BasicSourceMapConsumer(aSourceMap) {
          var sourceMap = aSourceMap;
          if (typeof aSourceMap === 'string') {
            sourceMap = JSON.parse(aSourceMap.replace(/^\)\]\}'/, ''));
          }
          var version = util.getArg(sourceMap, 'version');
          var sources = util.getArg(sourceMap, 'sources');
          var names = util.getArg(sourceMap, 'names', []);
          var sourceRoot = util.getArg(sourceMap, 'sourceRoot', null);
          var sourcesContent = util.getArg(sourceMap, 'sourcesContent', null);
          var mappings = util.getArg(sourceMap, 'mappings');
          var file = util.getArg(sourceMap, 'file', null);
          if (version != this._version) {
            throw new Error('Unsupported version: ' + version);
          }
          sources = sources.map(String).map(util.normalize).map(function (source) {
            return sourceRoot && util.isAbsolute(sourceRoot) && util.isAbsolute(source) ? util.relative(sourceRoot, source) : source;
          });
          this._names = ArraySet.fromArray(names.map(String), true);
          this._sources = ArraySet.fromArray(sources, true);
          this.sourceRoot = sourceRoot;
          this.sourcesContent = sourcesContent;
          this._mappings = mappings;
          this.file = file;
        }
        BasicSourceMapConsumer.prototype = Object.create(SourceMapConsumer.prototype);
        BasicSourceMapConsumer.prototype.consumer = SourceMapConsumer;
        BasicSourceMapConsumer.fromSourceMap = function SourceMapConsumer_fromSourceMap(aSourceMap) {
          var smc = Object.create(BasicSourceMapConsumer.prototype);
          var names = smc._names = ArraySet.fromArray(aSourceMap._names.toArray(), true);
          var sources = smc._sources = ArraySet.fromArray(aSourceMap._sources.toArray(), true);
          smc.sourceRoot = aSourceMap._sourceRoot;
          smc.sourcesContent = aSourceMap._generateSourcesContent(smc._sources.toArray(), smc.sourceRoot);
          smc.file = aSourceMap._file;
          var generatedMappings = aSourceMap._mappings.toArray().slice();
          var destGeneratedMappings = smc.__generatedMappings = [];
          var destOriginalMappings = smc.__originalMappings = [];
          for (var i = 0, length = generatedMappings.length; i < length; i++) {
            var srcMapping = generatedMappings[i];
            var destMapping = new Mapping;
            destMapping.generatedLine = srcMapping.generatedLine;
            destMapping.generatedColumn = srcMapping.generatedColumn;
            if (srcMapping.source) {
              destMapping.source = sources.indexOf(srcMapping.source);
              destMapping.originalLine = srcMapping.originalLine;
              destMapping.originalColumn = srcMapping.originalColumn;
              if (srcMapping.name) {
                destMapping.name = names.indexOf(srcMapping.name);
              }
              destOriginalMappings.push(destMapping);
            }
            destGeneratedMappings.push(destMapping);
          }
          quickSort(smc.__originalMappings, util.compareByOriginalPositions);
          return smc;
        };
        BasicSourceMapConsumer.prototype._version = 3;
        Object.defineProperty(BasicSourceMapConsumer.prototype, 'sources', {
          get: function () {
            return this._sources.toArray().map(function (s) {
              return this.sourceRoot != null ? util.join(this.sourceRoot, s) : s;
            }, this);
          }
        });
        function Mapping() {
          this.generatedLine = 0;
          this.generatedColumn = 0;
          this.source = null;
          this.originalLine = null;
          this.originalColumn = null;
          this.name = null;
        }
        BasicSourceMapConsumer.prototype._parseMappings = function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
          var generatedLine = 1;
          var previousGeneratedColumn = 0;
          var previousOriginalLine = 0;
          var previousOriginalColumn = 0;
          var previousSource = 0;
          var previousName = 0;
          var length = aStr.length;
          var index = 0;
          var cachedSegments = {};
          var temp = {};
          var originalMappings = [];
          var generatedMappings = [];
          var mapping, str, segment, end, value;
          while (index < length) {
            if (aStr.charAt(index) === ';') {
              generatedLine++;
              index++;
              previousGeneratedColumn = 0;
            } else if (aStr.charAt(index) === ',') {
              index++;
            } else {
              mapping = new Mapping;
              mapping.generatedLine = generatedLine;
              for (end = index; end < length; end++) {
                if (this._charIsMappingSeparator(aStr, end)) {
                  break;
                }
              }
              str = aStr.slice(index, end);
              segment = cachedSegments[str];
              if (segment) {
                index += str.length;
              } else {
                segment = [];
                while (index < end) {
                  base64VLQ.decode(aStr, index, temp);
                  value = temp.value;
                  index = temp.rest;
                  segment.push(value);
                }
                if (segment.length === 2) {
                  throw new Error('Found a source, but no line and column');
                }
                if (segment.length === 3) {
                  throw new Error('Found a source and line, but no column');
                }
                cachedSegments[str] = segment;
              }
              mapping.generatedColumn = previousGeneratedColumn + segment[0];
              previousGeneratedColumn = mapping.generatedColumn;
              if (segment.length > 1) {
                mapping.source = previousSource + segment[1];
                previousSource += segment[1];
                mapping.originalLine = previousOriginalLine + segment[2];
                previousOriginalLine = mapping.originalLine;
                mapping.originalLine += 1;
                mapping.originalColumn = previousOriginalColumn + segment[3];
                previousOriginalColumn = mapping.originalColumn;
                if (segment.length > 4) {
                  mapping.name = previousName + segment[4];
                  previousName += segment[4];
                }
              }
              generatedMappings.push(mapping);
              if (typeof mapping.originalLine === 'number') {
                originalMappings.push(mapping);
              }
            }
          }
          quickSort(generatedMappings, util.compareByGeneratedPositionsDeflated);
          this.__generatedMappings = generatedMappings;
          quickSort(originalMappings, util.compareByOriginalPositions);
          this.__originalMappings = originalMappings;
        };
        BasicSourceMapConsumer.prototype._findMapping = function SourceMapConsumer_findMapping(aNeedle, aMappings, aLineName, aColumnName, aComparator, aBias) {
          if (aNeedle[aLineName] <= 0) {
            throw new TypeError('Line must be greater than or equal to 1, got ' + aNeedle[aLineName]);
          }
          if (aNeedle[aColumnName] < 0) {
            throw new TypeError('Column must be greater than or equal to 0, got ' + aNeedle[aColumnName]);
          }
          return binarySearch.search(aNeedle, aMappings, aComparator, aBias);
        };
        BasicSourceMapConsumer.prototype.computeColumnSpans = function SourceMapConsumer_computeColumnSpans() {
          for (var index = 0; index < this._generatedMappings.length; ++index) {
            var mapping = this._generatedMappings[index];
            if (index + 1 < this._generatedMappings.length) {
              var nextMapping = this._generatedMappings[index + 1];
              if (mapping.generatedLine === nextMapping.generatedLine) {
                mapping.lastGeneratedColumn = nextMapping.generatedColumn - 1;
                continue;
              }
            }
            mapping.lastGeneratedColumn = Infinity;
          }
        };
        BasicSourceMapConsumer.prototype.originalPositionFor = function SourceMapConsumer_originalPositionFor(aArgs) {
          var needle = {
              generatedLine: util.getArg(aArgs, 'line'),
              generatedColumn: util.getArg(aArgs, 'column')
            };
          var index = this._findMapping(needle, this._generatedMappings, 'generatedLine', 'generatedColumn', util.compareByGeneratedPositionsDeflated, util.getArg(aArgs, 'bias', SourceMapConsumer.GREATEST_LOWER_BOUND));
          if (index >= 0) {
            var mapping = this._generatedMappings[index];
            if (mapping.generatedLine === needle.generatedLine) {
              var source = util.getArg(mapping, 'source', null);
              if (source !== null) {
                source = this._sources.at(source);
                if (this.sourceRoot != null) {
                  source = util.join(this.sourceRoot, source);
                }
              }
              var name = util.getArg(mapping, 'name', null);
              if (name !== null) {
                name = this._names.at(name);
              }
              return {
                source: source,
                line: util.getArg(mapping, 'originalLine', null),
                column: util.getArg(mapping, 'originalColumn', null),
                name: name
              };
            }
          }
          return {
            source: null,
            line: null,
            column: null,
            name: null
          };
        };
        BasicSourceMapConsumer.prototype.hasContentsOfAllSources = function BasicSourceMapConsumer_hasContentsOfAllSources() {
          if (!this.sourcesContent) {
            return false;
          }
          return this.sourcesContent.length >= this._sources.size() && !this.sourcesContent.some(function (sc) {
            return sc == null;
          });
        };
        BasicSourceMapConsumer.prototype.sourceContentFor = function SourceMapConsumer_sourceContentFor(aSource, nullOnMissing) {
          if (!this.sourcesContent) {
            return null;
          }
          if (this.sourceRoot != null) {
            aSource = util.relative(this.sourceRoot, aSource);
          }
          if (this._sources.has(aSource)) {
            return this.sourcesContent[this._sources.indexOf(aSource)];
          }
          var url;
          if (this.sourceRoot != null && (url = util.urlParse(this.sourceRoot))) {
            var fileUriAbsPath = aSource.replace(/^file:\/\//, '');
            if (url.scheme == 'file' && this._sources.has(fileUriAbsPath)) {
              return this.sourcesContent[this._sources.indexOf(fileUriAbsPath)];
            }
            if ((!url.path || url.path == '/') && this._sources.has('/' + aSource)) {
              return this.sourcesContent[this._sources.indexOf('/' + aSource)];
            }
          }
          if (nullOnMissing) {
            return null;
          } else {
            throw new Error('"' + aSource + '" is not in the SourceMap.');
          }
        };
        BasicSourceMapConsumer.prototype.generatedPositionFor = function SourceMapConsumer_generatedPositionFor(aArgs) {
          var source = util.getArg(aArgs, 'source');
          if (this.sourceRoot != null) {
            source = util.relative(this.sourceRoot, source);
          }
          if (!this._sources.has(source)) {
            return {
              line: null,
              column: null,
              lastColumn: null
            };
          }
          source = this._sources.indexOf(source);
          var needle = {
              source: source,
              originalLine: util.getArg(aArgs, 'line'),
              originalColumn: util.getArg(aArgs, 'column')
            };
          var index = this._findMapping(needle, this._originalMappings, 'originalLine', 'originalColumn', util.compareByOriginalPositions, util.getArg(aArgs, 'bias', SourceMapConsumer.GREATEST_LOWER_BOUND));
          if (index >= 0) {
            var mapping = this._originalMappings[index];
            if (mapping.source === needle.source) {
              return {
                line: util.getArg(mapping, 'generatedLine', null),
                column: util.getArg(mapping, 'generatedColumn', null),
                lastColumn: util.getArg(mapping, 'lastGeneratedColumn', null)
              };
            }
          }
          return {
            line: null,
            column: null,
            lastColumn: null
          };
        };
        exports.BasicSourceMapConsumer = BasicSourceMapConsumer;
        function IndexedSourceMapConsumer(aSourceMap) {
          var sourceMap = aSourceMap;
          if (typeof aSourceMap === 'string') {
            sourceMap = JSON.parse(aSourceMap.replace(/^\)\]\}'/, ''));
          }
          var version = util.getArg(sourceMap, 'version');
          var sections = util.getArg(sourceMap, 'sections');
          if (version != this._version) {
            throw new Error('Unsupported version: ' + version);
          }
          this._sources = new ArraySet;
          this._names = new ArraySet;
          var lastOffset = {
              line: -1,
              column: 0
            };
          this._sections = sections.map(function (s) {
            if (s.url) {
              throw new Error('Support for url field in sections not implemented.');
            }
            var offset = util.getArg(s, 'offset');
            var offsetLine = util.getArg(offset, 'line');
            var offsetColumn = util.getArg(offset, 'column');
            if (offsetLine < lastOffset.line || offsetLine === lastOffset.line && offsetColumn < lastOffset.column) {
              throw new Error('Section offsets must be ordered and non-overlapping.');
            }
            lastOffset = offset;
            return {
              generatedOffset: {
                generatedLine: offsetLine + 1,
                generatedColumn: offsetColumn + 1
              },
              consumer: new SourceMapConsumer(util.getArg(s, 'map'))
            };
          });
        }
        IndexedSourceMapConsumer.prototype = Object.create(SourceMapConsumer.prototype);
        IndexedSourceMapConsumer.prototype.constructor = SourceMapConsumer;
        IndexedSourceMapConsumer.prototype._version = 3;
        Object.defineProperty(IndexedSourceMapConsumer.prototype, 'sources', {
          get: function () {
            var sources = [];
            for (var i = 0; i < this._sections.length; i++) {
              for (var j = 0; j < this._sections[i].consumer.sources.length; j++) {
                sources.push(this._sections[i].consumer.sources[j]);
              }
            }
            return sources;
          }
        });
        IndexedSourceMapConsumer.prototype.originalPositionFor = function IndexedSourceMapConsumer_originalPositionFor(aArgs) {
          var needle = {
              generatedLine: util.getArg(aArgs, 'line'),
              generatedColumn: util.getArg(aArgs, 'column')
            };
          var sectionIndex = binarySearch.search(needle, this._sections, function (needle, section) {
              var cmp = needle.generatedLine - section.generatedOffset.generatedLine;
              if (cmp) {
                return cmp;
              }
              return needle.generatedColumn - section.generatedOffset.generatedColumn;
            });
          var section = this._sections[sectionIndex];
          if (!section) {
            return {
              source: null,
              line: null,
              column: null,
              name: null
            };
          }
          return section.consumer.originalPositionFor({
            line: needle.generatedLine - (section.generatedOffset.generatedLine - 1),
            column: needle.generatedColumn - (section.generatedOffset.generatedLine === needle.generatedLine ? section.generatedOffset.generatedColumn - 1 : 0),
            bias: aArgs.bias
          });
        };
        IndexedSourceMapConsumer.prototype.hasContentsOfAllSources = function IndexedSourceMapConsumer_hasContentsOfAllSources() {
          return this._sections.every(function (s) {
            return s.consumer.hasContentsOfAllSources();
          });
        };
        IndexedSourceMapConsumer.prototype.sourceContentFor = function IndexedSourceMapConsumer_sourceContentFor(aSource, nullOnMissing) {
          for (var i = 0; i < this._sections.length; i++) {
            var section = this._sections[i];
            var content = section.consumer.sourceContentFor(aSource, true);
            if (content) {
              return content;
            }
          }
          if (nullOnMissing) {
            return null;
          } else {
            throw new Error('"' + aSource + '" is not in the SourceMap.');
          }
        };
        IndexedSourceMapConsumer.prototype.generatedPositionFor = function IndexedSourceMapConsumer_generatedPositionFor(aArgs) {
          for (var i = 0; i < this._sections.length; i++) {
            var section = this._sections[i];
            if (section.consumer.sources.indexOf(util.getArg(aArgs, 'source')) === -1) {
              continue;
            }
            var generatedPosition = section.consumer.generatedPositionFor(aArgs);
            if (generatedPosition) {
              var ret = {
                  line: generatedPosition.line + (section.generatedOffset.generatedLine - 1),
                  column: generatedPosition.column + (section.generatedOffset.generatedLine === generatedPosition.line ? section.generatedOffset.generatedColumn - 1 : 0)
                };
              return ret;
            }
          }
          return {
            line: null,
            column: null
          };
        };
        IndexedSourceMapConsumer.prototype._parseMappings = function IndexedSourceMapConsumer_parseMappings(aStr, aSourceRoot) {
          this.__generatedMappings = [];
          this.__originalMappings = [];
          for (var i = 0; i < this._sections.length; i++) {
            var section = this._sections[i];
            var sectionMappings = section.consumer._generatedMappings;
            for (var j = 0; j < sectionMappings.length; j++) {
              var mapping = sectionMappings[j];
              var source = section.consumer._sources.at(mapping.source);
              if (section.consumer.sourceRoot !== null) {
                source = util.join(section.consumer.sourceRoot, source);
              }
              this._sources.add(source);
              source = this._sources.indexOf(source);
              var name = section.consumer._names.at(mapping.name);
              this._names.add(name);
              name = this._names.indexOf(name);
              var adjustedMapping = {
                  source: source,
                  generatedLine: mapping.generatedLine + (section.generatedOffset.generatedLine - 1),
                  generatedColumn: mapping.generatedColumn + (section.generatedOffset.generatedLine === mapping.generatedLine ? section.generatedOffset.generatedColumn - 1 : 0),
                  originalLine: mapping.originalLine,
                  originalColumn: mapping.originalColumn,
                  name: name
                };
              this.__generatedMappings.push(adjustedMapping);
              if (typeof adjustedMapping.originalLine === 'number') {
                this.__originalMappings.push(adjustedMapping);
              }
            }
          }
          quickSort(this.__generatedMappings, util.compareByGeneratedPositionsDeflated);
          quickSort(this.__originalMappings, util.compareByOriginalPositions);
        };
        exports.IndexedSourceMapConsumer = IndexedSourceMapConsumer;
      });
      require.define('/node_modules/source-map/lib/quick-sort.js', function (module, exports, __dirname, __filename) {
        function swap(ary, x, y) {
          var temp = ary[x];
          ary[x] = ary[y];
          ary[y] = temp;
        }
        function randomIntInRange(low, high) {
          return Math.round(low + Math.random() * (high - low));
        }
        function doQuickSort(ary, comparator, p, r) {
          if (p < r) {
            var pivotIndex = randomIntInRange(p, r);
            var i = p - 1;
            swap(ary, pivotIndex, r);
            var pivot = ary[r];
            for (var j = p; j < r; j++) {
              if (comparator(ary[j], pivot) <= 0) {
                i += 1;
                swap(ary, i, j);
              }
            }
            swap(ary, i + 1, j);
            var q = i + 1;
            doQuickSort(ary, comparator, p, q - 1);
            doQuickSort(ary, comparator, q + 1, r);
          }
        }
        exports.quickSort = function (ary, comparator) {
          doQuickSort(ary, comparator, 0, ary.length - 1);
        };
      });
      require.define('/node_modules/source-map/lib/binary-search.js', function (module, exports, __dirname, __filename) {
        exports.GREATEST_LOWER_BOUND = 1;
        exports.LEAST_UPPER_BOUND = 2;
        function recursiveSearch(aLow, aHigh, aNeedle, aHaystack, aCompare, aBias) {
          var mid = Math.floor((aHigh - aLow) / 2) + aLow;
          var cmp = aCompare(aNeedle, aHaystack[mid], true);
          if (cmp === 0) {
            return mid;
          } else if (cmp > 0) {
            if (aHigh - mid > 1) {
              return recursiveSearch(mid, aHigh, aNeedle, aHaystack, aCompare, aBias);
            }
            if (aBias == exports.LEAST_UPPER_BOUND) {
              return aHigh < aHaystack.length ? aHigh : -1;
            } else {
              return mid;
            }
          } else {
            if (mid - aLow > 1) {
              return recursiveSearch(aLow, mid, aNeedle, aHaystack, aCompare, aBias);
            }
            if (aBias == exports.LEAST_UPPER_BOUND) {
              return mid;
            } else {
              return aLow < 0 ? -1 : aLow;
            }
          }
        }
        exports.search = function search(aNeedle, aHaystack, aCompare, aBias) {
          if (aHaystack.length === 0) {
            return -1;
          }
          var index = recursiveSearch(-1, aHaystack.length, aNeedle, aHaystack, aCompare, aBias || exports.GREATEST_LOWER_BOUND);
          if (index < 0) {
            return -1;
          }
          while (index - 1 >= 0) {
            if (aCompare(aHaystack[index], aHaystack[index - 1], true) !== 0) {
              break;
            }
            --index;
          }
          return index;
        };
      });
      require.define('/node_modules/esutils/lib/utils.js', function (module, exports, __dirname, __filename) {
        (function () {
          'use strict';
          exports.ast = require('/node_modules/esutils/lib/ast.js', module);
          exports.code = require('/node_modules/esutils/lib/code.js', module);
          exports.keyword = require('/node_modules/esutils/lib/keyword.js', module);
        }());
      });
      require.define('/node_modules/esutils/lib/keyword.js', function (module, exports, __dirname, __filename) {
        (function () {
          'use strict';
          var code = require('/node_modules/esutils/lib/code.js', module);
          function isStrictModeReservedWordES6(id) {
            switch (id) {
            case 'implements':
            case 'interface':
            case 'package':
            case 'private':
            case 'protected':
            case 'public':
            case 'static':
            case 'let':
              return true;
            default:
              return false;
            }
          }
          function isKeywordES5(id, strict) {
            if (!strict && id === 'yield') {
              return false;
            }
            return isKeywordES6(id, strict);
          }
          function isKeywordES6(id, strict) {
            if (strict && isStrictModeReservedWordES6(id)) {
              return true;
            }
            switch (id.length) {
            case 2:
              return id === 'if' || id === 'in' || id === 'do';
            case 3:
              return id === 'var' || id === 'for' || id === 'new' || id === 'try';
            case 4:
              return id === 'this' || id === 'else' || id === 'case' || id === 'void' || id === 'with' || id === 'enum';
            case 5:
              return id === 'while' || id === 'break' || id === 'catch' || id === 'throw' || id === 'const' || id === 'yield' || id === 'class' || id === 'super';
            case 6:
              return id === 'return' || id === 'typeof' || id === 'delete' || id === 'switch' || id === 'export' || id === 'import';
            case 7:
              return id === 'default' || id === 'finally' || id === 'extends';
            case 8:
              return id === 'function' || id === 'continue' || id === 'debugger';
            case 10:
              return id === 'instanceof';
            default:
              return false;
            }
          }
          function isReservedWordES5(id, strict) {
            return id === 'null' || id === 'true' || id === 'false' || isKeywordES5(id, strict);
          }
          function isReservedWordES6(id, strict) {
            return id === 'null' || id === 'true' || id === 'false' || isKeywordES6(id, strict);
          }
          function isRestrictedWord(id) {
            return id === 'eval' || id === 'arguments';
          }
          function isIdentifierNameES5(id) {
            var i, iz, ch;
            if (id.length === 0) {
              return false;
            }
            ch = id.charCodeAt(0);
            if (!code.isIdentifierStartES5(ch)) {
              return false;
            }
            for (i = 1, iz = id.length; i < iz; ++i) {
              ch = id.charCodeAt(i);
              if (!code.isIdentifierPartES5(ch)) {
                return false;
              }
            }
            return true;
          }
          function decodeUtf16(lead, trail) {
            return (lead - 55296) * 1024 + (trail - 56320) + 65536;
          }
          function isIdentifierNameES6(id) {
            var i, iz, ch, lowCh, check;
            if (id.length === 0) {
              return false;
            }
            check = code.isIdentifierStartES6;
            for (i = 0, iz = id.length; i < iz; ++i) {
              ch = id.charCodeAt(i);
              if (55296 <= ch && ch <= 56319) {
                ++i;
                if (i >= iz) {
                  return false;
                }
                lowCh = id.charCodeAt(i);
                if (!(56320 <= lowCh && lowCh <= 57343)) {
                  return false;
                }
                ch = decodeUtf16(ch, lowCh);
              }
              if (!check(ch)) {
                return false;
              }
              check = code.isIdentifierPartES6;
            }
            return true;
          }
          function isIdentifierES5(id, strict) {
            return isIdentifierNameES5(id) && !isReservedWordES5(id, strict);
          }
          function isIdentifierES6(id, strict) {
            return isIdentifierNameES6(id) && !isReservedWordES6(id, strict);
          }
          module.exports = {
            isKeywordES5: isKeywordES5,
            isKeywordES6: isKeywordES6,
            isReservedWordES5: isReservedWordES5,
            isReservedWordES6: isReservedWordES6,
            isRestrictedWord: isRestrictedWord,
            isIdentifierNameES5: isIdentifierNameES5,
            isIdentifierNameES6: isIdentifierNameES6,
            isIdentifierES5: isIdentifierES5,
            isIdentifierES6: isIdentifierES6
          };
        }());
      });
      require.define('/node_modules/esutils/lib/code.js', function (module, exports, __dirname, __filename) {
        (function () {
          'use strict';
          var ES6Regex, ES5Regex, NON_ASCII_WHITESPACES, IDENTIFIER_START, IDENTIFIER_PART, ch;
          ES5Regex = {
            NonAsciiIdentifierStart: /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B2\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]/,
            NonAsciiIdentifierPart: /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u08A0-\u08B2\u08E4-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58\u0C59\u0C60-\u0C63\u0C66-\u0C6F\u0C81-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D01-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D57\u0D60-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19D9\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1CD0-\u1CD2\u1CD4-\u1CF6\u1CF8\u1CF9\u1D00-\u1DF5\u1DFC-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u200C\u200D\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u2E2F\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099\u309A\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA69D\uA69F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C4\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2D\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]/
          };
          ES6Regex = {
            NonAsciiIdentifierStart: /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B2\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309B-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF30-\uDF4A\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48]|\uD804[\uDC03-\uDC37\uDC83-\uDCAF\uDCD0-\uDCE8\uDD03-\uDD26\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDDA\uDE00-\uDE11\uDE13-\uDE2B\uDEB0-\uDEDE\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF5D-\uDF61]|\uD805[\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDD80-\uDDAE\uDE00-\uDE2F\uDE44\uDE80-\uDEAA]|\uD806[\uDCA0-\uDCDF\uDCFF\uDEC0-\uDEF8]|\uD808[\uDC00-\uDF98]|\uD809[\uDC00-\uDC6E]|[\uD80C\uD840-\uD868\uD86A-\uD86C][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDED0-\uDEED\uDF00-\uDF2F\uDF40-\uDF43\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50\uDF93-\uDF9F]|\uD82C[\uDC00\uDC01]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD83A[\uDC00-\uDCC4]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D]|\uD87E[\uDC00-\uDE1D]/,
            NonAsciiIdentifierPart: /[\xAA\xB5\xB7\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u08A0-\u08B2\u08E4-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58\u0C59\u0C60-\u0C63\u0C66-\u0C6F\u0C81-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D01-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D57\u0D60-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1369-\u1371\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19DA\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1CD0-\u1CD2\u1CD4-\u1CF6\u1CF8\u1CF9\u1D00-\u1DF5\u1DFC-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u200C\u200D\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA69D\uA69F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C4\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2D\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDDFD\uDE80-\uDE9C\uDEA0-\uDED0\uDEE0\uDF00-\uDF1F\uDF30-\uDF4A\uDF50-\uDF7A\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCA0-\uDCA9\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00-\uDE03\uDE05\uDE06\uDE0C-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE38-\uDE3A\uDE3F\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE6\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48]|\uD804[\uDC00-\uDC46\uDC66-\uDC6F\uDC7F-\uDCBA\uDCD0-\uDCE8\uDCF0-\uDCF9\uDD00-\uDD34\uDD36-\uDD3F\uDD50-\uDD73\uDD76\uDD80-\uDDC4\uDDD0-\uDDDA\uDE00-\uDE11\uDE13-\uDE37\uDEB0-\uDEEA\uDEF0-\uDEF9\uDF01-\uDF03\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3C-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF57\uDF5D-\uDF63\uDF66-\uDF6C\uDF70-\uDF74]|\uD805[\uDC80-\uDCC5\uDCC7\uDCD0-\uDCD9\uDD80-\uDDB5\uDDB8-\uDDC0\uDE00-\uDE40\uDE44\uDE50-\uDE59\uDE80-\uDEB7\uDEC0-\uDEC9]|\uD806[\uDCA0-\uDCE9\uDCFF\uDEC0-\uDEF8]|\uD808[\uDC00-\uDF98]|\uD809[\uDC00-\uDC6E]|[\uD80C\uD840-\uD868\uD86A-\uD86C][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDE60-\uDE69\uDED0-\uDEED\uDEF0-\uDEF4\uDF00-\uDF36\uDF40-\uDF43\uDF50-\uDF59\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50-\uDF7E\uDF8F-\uDF9F]|\uD82C[\uDC00\uDC01]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99\uDC9D\uDC9E]|\uD834[\uDD65-\uDD69\uDD6D-\uDD72\uDD7B-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD\uDE42-\uDE44]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB\uDFCE-\uDFFF]|\uD83A[\uDC00-\uDCC4\uDCD0-\uDCD6]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D]|\uD87E[\uDC00-\uDE1D]|\uDB40[\uDD00-\uDDEF]/
          };
          function isDecimalDigit(ch) {
            return 48 <= ch && ch <= 57;
          }
          function isHexDigit(ch) {
            return 48 <= ch && ch <= 57 || 97 <= ch && ch <= 102 || 65 <= ch && ch <= 70;
          }
          function isOctalDigit(ch) {
            return ch >= 48 && ch <= 55;
          }
          NON_ASCII_WHITESPACES = [
            5760,
            6158,
            8192,
            8193,
            8194,
            8195,
            8196,
            8197,
            8198,
            8199,
            8200,
            8201,
            8202,
            8239,
            8287,
            12288,
            65279
          ];
          function isWhiteSpace(ch) {
            return ch === 32 || ch === 9 || ch === 11 || ch === 12 || ch === 160 || ch >= 5760 && NON_ASCII_WHITESPACES.indexOf(ch) >= 0;
          }
          function isLineTerminator(ch) {
            return ch === 10 || ch === 13 || ch === 8232 || ch === 8233;
          }
          function fromCodePoint(cp) {
            if (cp <= 65535) {
              return String.fromCharCode(cp);
            }
            var cu1 = String.fromCharCode(Math.floor((cp - 65536) / 1024) + 55296);
            var cu2 = String.fromCharCode((cp - 65536) % 1024 + 56320);
            return cu1 + cu2;
          }
          IDENTIFIER_START = new Array(128);
          for (ch = 0; ch < 128; ++ch) {
            IDENTIFIER_START[ch] = ch >= 97 && ch <= 122 || ch >= 65 && ch <= 90 || ch === 36 || ch === 95;
          }
          IDENTIFIER_PART = new Array(128);
          for (ch = 0; ch < 128; ++ch) {
            IDENTIFIER_PART[ch] = ch >= 97 && ch <= 122 || ch >= 65 && ch <= 90 || ch >= 48 && ch <= 57 || ch === 36 || ch === 95;
          }
          function isIdentifierStartES5(ch) {
            return ch < 128 ? IDENTIFIER_START[ch] : ES5Regex.NonAsciiIdentifierStart.test(fromCodePoint(ch));
          }
          function isIdentifierPartES5(ch) {
            return ch < 128 ? IDENTIFIER_PART[ch] : ES5Regex.NonAsciiIdentifierPart.test(fromCodePoint(ch));
          }
          function isIdentifierStartES6(ch) {
            return ch < 128 ? IDENTIFIER_START[ch] : ES6Regex.NonAsciiIdentifierStart.test(fromCodePoint(ch));
          }
          function isIdentifierPartES6(ch) {
            return ch < 128 ? IDENTIFIER_PART[ch] : ES6Regex.NonAsciiIdentifierPart.test(fromCodePoint(ch));
          }
          module.exports = {
            isDecimalDigit: isDecimalDigit,
            isHexDigit: isHexDigit,
            isOctalDigit: isOctalDigit,
            isWhiteSpace: isWhiteSpace,
            isLineTerminator: isLineTerminator,
            isIdentifierStartES5: isIdentifierStartES5,
            isIdentifierPartES5: isIdentifierPartES5,
            isIdentifierStartES6: isIdentifierStartES6,
            isIdentifierPartES6: isIdentifierPartES6
          };
        }());
      });
      require.define('/node_modules/esutils/lib/ast.js', function (module, exports, __dirname, __filename) {
        (function () {
          'use strict';
          function isExpression(node) {
            if (node == null) {
              return false;
            }
            switch (node.type) {
            case 'ArrayExpression':
            case 'AssignmentExpression':
            case 'BinaryExpression':
            case 'CallExpression':
            case 'ConditionalExpression':
            case 'FunctionExpression':
            case 'Identifier':
            case 'Literal':
            case 'LogicalExpression':
            case 'MemberExpression':
            case 'NewExpression':
            case 'ObjectExpression':
            case 'SequenceExpression':
            case 'ThisExpression':
            case 'UnaryExpression':
            case 'UpdateExpression':
              return true;
            }
            return false;
          }
          function isIterationStatement(node) {
            if (node == null) {
              return false;
            }
            switch (node.type) {
            case 'DoWhileStatement':
            case 'ForInStatement':
            case 'ForStatement':
            case 'WhileStatement':
              return true;
            }
            return false;
          }
          function isStatement(node) {
            if (node == null) {
              return false;
            }
            switch (node.type) {
            case 'BlockStatement':
            case 'BreakStatement':
            case 'ContinueStatement':
            case 'DebuggerStatement':
            case 'DoWhileStatement':
            case 'EmptyStatement':
            case 'ExpressionStatement':
            case 'ForInStatement':
            case 'ForStatement':
            case 'IfStatement':
            case 'LabeledStatement':
            case 'ReturnStatement':
            case 'SwitchStatement':
            case 'ThrowStatement':
            case 'TryStatement':
            case 'VariableDeclaration':
            case 'WhileStatement':
            case 'WithStatement':
              return true;
            }
            return false;
          }
          function isSourceElement(node) {
            return isStatement(node) || node != null && node.type === 'FunctionDeclaration';
          }
          function trailingStatement(node) {
            switch (node.type) {
            case 'IfStatement':
              if (node.alternate != null) {
                return node.alternate;
              }
              return node.consequent;
            case 'LabeledStatement':
            case 'ForStatement':
            case 'ForInStatement':
            case 'WhileStatement':
            case 'WithStatement':
              return node.body;
            }
            return null;
          }
          function isProblematicIfStatement(node) {
            var current;
            if (node.type !== 'IfStatement') {
              return false;
            }
            if (node.alternate == null) {
              return false;
            }
            current = node.consequent;
            do {
              if (current.type === 'IfStatement') {
                if (current.alternate == null) {
                  return true;
                }
              }
              current = trailingStatement(current);
            } while (current);
            return false;
          }
          module.exports = {
            isExpression: isExpression,
            isStatement: isStatement,
            isIterationStatement: isIterationStatement,
            isSourceElement: isSourceElement,
            isProblematicIfStatement: isProblematicIfStatement,
            trailingStatement: trailingStatement
          };
        }());
      });
      require.define('/node_modules/estraverse/estraverse.js', function (module, exports, __dirname, __filename) {
        (function clone(exports) {
          'use strict';
          var Syntax, isArray, VisitorOption, VisitorKeys, objectCreate, objectKeys, BREAK, SKIP, REMOVE;
          function ignoreJSHintError() {
          }
          isArray = Array.isArray;
          if (!isArray) {
            isArray = function isArray(array) {
              return Object.prototype.toString.call(array) === '[object Array]';
            };
          }
          function deepCopy(obj) {
            var ret = {}, key, val;
            for (key in obj) {
              if (obj.hasOwnProperty(key)) {
                val = obj[key];
                if (typeof val === 'object' && val !== null) {
                  ret[key] = deepCopy(val);
                } else {
                  ret[key] = val;
                }
              }
            }
            return ret;
          }
          function shallowCopy(obj) {
            var ret = {}, key;
            for (key in obj) {
              if (obj.hasOwnProperty(key)) {
                ret[key] = obj[key];
              }
            }
            return ret;
          }
          ignoreJSHintError(shallowCopy);
          function upperBound(array, func) {
            var diff, len, i, current;
            len = array.length;
            i = 0;
            while (len) {
              diff = len >>> 1;
              current = i + diff;
              if (func(array[current])) {
                len = diff;
              } else {
                i = current + 1;
                len -= diff + 1;
              }
            }
            return i;
          }
          function lowerBound(array, func) {
            var diff, len, i, current;
            len = array.length;
            i = 0;
            while (len) {
              diff = len >>> 1;
              current = i + diff;
              if (func(array[current])) {
                i = current + 1;
                len -= diff + 1;
              } else {
                len = diff;
              }
            }
            return i;
          }
          ignoreJSHintError(lowerBound);
          objectCreate = Object.create || function () {
            function F() {
            }
            return function (o) {
              F.prototype = o;
              return new F;
            };
          }();
          objectKeys = Object.keys || function (o) {
            var keys = [], key;
            for (key in o) {
              keys.push(key);
            }
            return keys;
          };
          function extend(to, from) {
            var keys = objectKeys(from), key, i, len;
            for (i = 0, len = keys.length; i < len; i += 1) {
              key = keys[i];
              to[key] = from[key];
            }
            return to;
          }
          Syntax = {
            AssignmentExpression: 'AssignmentExpression',
            AssignmentPattern: 'AssignmentPattern',
            ArrayExpression: 'ArrayExpression',
            ArrayPattern: 'ArrayPattern',
            ArrowFunctionExpression: 'ArrowFunctionExpression',
            AwaitExpression: 'AwaitExpression',
            BlockStatement: 'BlockStatement',
            BinaryExpression: 'BinaryExpression',
            BreakStatement: 'BreakStatement',
            CallExpression: 'CallExpression',
            CatchClause: 'CatchClause',
            ClassBody: 'ClassBody',
            ClassDeclaration: 'ClassDeclaration',
            ClassExpression: 'ClassExpression',
            ComprehensionBlock: 'ComprehensionBlock',
            ComprehensionExpression: 'ComprehensionExpression',
            ConditionalExpression: 'ConditionalExpression',
            ContinueStatement: 'ContinueStatement',
            DebuggerStatement: 'DebuggerStatement',
            DirectiveStatement: 'DirectiveStatement',
            DoWhileStatement: 'DoWhileStatement',
            EmptyStatement: 'EmptyStatement',
            ExportAllDeclaration: 'ExportAllDeclaration',
            ExportDefaultDeclaration: 'ExportDefaultDeclaration',
            ExportNamedDeclaration: 'ExportNamedDeclaration',
            ExportSpecifier: 'ExportSpecifier',
            ExpressionStatement: 'ExpressionStatement',
            ForStatement: 'ForStatement',
            ForInStatement: 'ForInStatement',
            ForOfStatement: 'ForOfStatement',
            FunctionDeclaration: 'FunctionDeclaration',
            FunctionExpression: 'FunctionExpression',
            GeneratorExpression: 'GeneratorExpression',
            Identifier: 'Identifier',
            IfStatement: 'IfStatement',
            ImportDeclaration: 'ImportDeclaration',
            ImportDefaultSpecifier: 'ImportDefaultSpecifier',
            ImportNamespaceSpecifier: 'ImportNamespaceSpecifier',
            ImportSpecifier: 'ImportSpecifier',
            Literal: 'Literal',
            LabeledStatement: 'LabeledStatement',
            LogicalExpression: 'LogicalExpression',
            MemberExpression: 'MemberExpression',
            MetaProperty: 'MetaProperty',
            MethodDefinition: 'MethodDefinition',
            ModuleSpecifier: 'ModuleSpecifier',
            NewExpression: 'NewExpression',
            ObjectExpression: 'ObjectExpression',
            ObjectPattern: 'ObjectPattern',
            Program: 'Program',
            Property: 'Property',
            RestElement: 'RestElement',
            ReturnStatement: 'ReturnStatement',
            SequenceExpression: 'SequenceExpression',
            SpreadElement: 'SpreadElement',
            Super: 'Super',
            SwitchStatement: 'SwitchStatement',
            SwitchCase: 'SwitchCase',
            TaggedTemplateExpression: 'TaggedTemplateExpression',
            TemplateElement: 'TemplateElement',
            TemplateLiteral: 'TemplateLiteral',
            ThisExpression: 'ThisExpression',
            ThrowStatement: 'ThrowStatement',
            TryStatement: 'TryStatement',
            UnaryExpression: 'UnaryExpression',
            UpdateExpression: 'UpdateExpression',
            VariableDeclaration: 'VariableDeclaration',
            VariableDeclarator: 'VariableDeclarator',
            WhileStatement: 'WhileStatement',
            WithStatement: 'WithStatement',
            YieldExpression: 'YieldExpression'
          };
          VisitorKeys = {
            AssignmentExpression: [
              'left',
              'right'
            ],
            AssignmentPattern: [
              'left',
              'right'
            ],
            ArrayExpression: ['elements'],
            ArrayPattern: ['elements'],
            ArrowFunctionExpression: [
              'params',
              'body'
            ],
            AwaitExpression: ['argument'],
            BlockStatement: ['body'],
            BinaryExpression: [
              'left',
              'right'
            ],
            BreakStatement: ['label'],
            CallExpression: [
              'callee',
              'arguments'
            ],
            CatchClause: [
              'param',
              'body'
            ],
            ClassBody: ['body'],
            ClassDeclaration: [
              'id',
              'superClass',
              'body'
            ],
            ClassExpression: [
              'id',
              'superClass',
              'body'
            ],
            ComprehensionBlock: [
              'left',
              'right'
            ],
            ComprehensionExpression: [
              'blocks',
              'filter',
              'body'
            ],
            ConditionalExpression: [
              'test',
              'consequent',
              'alternate'
            ],
            ContinueStatement: ['label'],
            DebuggerStatement: [],
            DirectiveStatement: [],
            DoWhileStatement: [
              'body',
              'test'
            ],
            EmptyStatement: [],
            ExportAllDeclaration: ['source'],
            ExportDefaultDeclaration: ['declaration'],
            ExportNamedDeclaration: [
              'declaration',
              'specifiers',
              'source'
            ],
            ExportSpecifier: [
              'exported',
              'local'
            ],
            ExpressionStatement: ['expression'],
            ForStatement: [
              'init',
              'test',
              'update',
              'body'
            ],
            ForInStatement: [
              'left',
              'right',
              'body'
            ],
            ForOfStatement: [
              'left',
              'right',
              'body'
            ],
            FunctionDeclaration: [
              'id',
              'params',
              'body'
            ],
            FunctionExpression: [
              'id',
              'params',
              'body'
            ],
            GeneratorExpression: [
              'blocks',
              'filter',
              'body'
            ],
            Identifier: [],
            IfStatement: [
              'test',
              'consequent',
              'alternate'
            ],
            ImportDeclaration: [
              'specifiers',
              'source'
            ],
            ImportDefaultSpecifier: ['local'],
            ImportNamespaceSpecifier: ['local'],
            ImportSpecifier: [
              'imported',
              'local'
            ],
            Literal: [],
            LabeledStatement: [
              'label',
              'body'
            ],
            LogicalExpression: [
              'left',
              'right'
            ],
            MemberExpression: [
              'object',
              'property'
            ],
            MetaProperty: [
              'meta',
              'property'
            ],
            MethodDefinition: [
              'key',
              'value'
            ],
            ModuleSpecifier: [],
            NewExpression: [
              'callee',
              'arguments'
            ],
            ObjectExpression: ['properties'],
            ObjectPattern: ['properties'],
            Program: ['body'],
            Property: [
              'key',
              'value'
            ],
            RestElement: ['argument'],
            ReturnStatement: ['argument'],
            SequenceExpression: ['expressions'],
            SpreadElement: ['argument'],
            Super: [],
            SwitchStatement: [
              'discriminant',
              'cases'
            ],
            SwitchCase: [
              'test',
              'consequent'
            ],
            TaggedTemplateExpression: [
              'tag',
              'quasi'
            ],
            TemplateElement: [],
            TemplateLiteral: [
              'quasis',
              'expressions'
            ],
            ThisExpression: [],
            ThrowStatement: ['argument'],
            TryStatement: [
              'block',
              'handler',
              'finalizer'
            ],
            UnaryExpression: ['argument'],
            UpdateExpression: ['argument'],
            VariableDeclaration: ['declarations'],
            VariableDeclarator: [
              'id',
              'init'
            ],
            WhileStatement: [
              'test',
              'body'
            ],
            WithStatement: [
              'object',
              'body'
            ],
            YieldExpression: ['argument']
          };
          BREAK = {};
          SKIP = {};
          REMOVE = {};
          VisitorOption = {
            Break: BREAK,
            Skip: SKIP,
            Remove: REMOVE
          };
          function Reference(parent, key) {
            this.parent = parent;
            this.key = key;
          }
          Reference.prototype.replace = function replace(node) {
            this.parent[this.key] = node;
          };
          Reference.prototype.remove = function remove() {
            if (isArray(this.parent)) {
              this.parent.splice(this.key, 1);
              return true;
            } else {
              this.replace(null);
              return false;
            }
          };
          function Element(node, path, wrap, ref) {
            this.node = node;
            this.path = path;
            this.wrap = wrap;
            this.ref = ref;
          }
          function Controller() {
          }
          Controller.prototype.path = function path() {
            var i, iz, j, jz, result, element;
            function addToPath(result, path) {
              if (isArray(path)) {
                for (j = 0, jz = path.length; j < jz; ++j) {
                  result.push(path[j]);
                }
              } else {
                result.push(path);
              }
            }
            if (!this.__current.path) {
              return null;
            }
            result = [];
            for (i = 2, iz = this.__leavelist.length; i < iz; ++i) {
              element = this.__leavelist[i];
              addToPath(result, element.path);
            }
            addToPath(result, this.__current.path);
            return result;
          };
          Controller.prototype.type = function () {
            var node = this.current();
            return node.type || this.__current.wrap;
          };
          Controller.prototype.parents = function parents() {
            var i, iz, result;
            result = [];
            for (i = 1, iz = this.__leavelist.length; i < iz; ++i) {
              result.push(this.__leavelist[i].node);
            }
            return result;
          };
          Controller.prototype.current = function current() {
            return this.__current.node;
          };
          Controller.prototype.__execute = function __execute(callback, element) {
            var previous, result;
            result = undefined;
            previous = this.__current;
            this.__current = element;
            this.__state = null;
            if (callback) {
              result = callback.call(this, element.node, this.__leavelist[this.__leavelist.length - 1].node);
            }
            this.__current = previous;
            return result;
          };
          Controller.prototype.notify = function notify(flag) {
            this.__state = flag;
          };
          Controller.prototype.skip = function () {
            this.notify(SKIP);
          };
          Controller.prototype['break'] = function () {
            this.notify(BREAK);
          };
          Controller.prototype.remove = function () {
            this.notify(REMOVE);
          };
          Controller.prototype.__initialize = function (root, visitor) {
            this.visitor = visitor;
            this.root = root;
            this.__worklist = [];
            this.__leavelist = [];
            this.__current = null;
            this.__state = null;
            this.__fallback = null;
            if (visitor.fallback === 'iteration') {
              this.__fallback = objectKeys;
            } else if (typeof visitor.fallback === 'function') {
              this.__fallback = visitor.fallback;
            }
            this.__keys = VisitorKeys;
            if (visitor.keys) {
              this.__keys = extend(objectCreate(this.__keys), visitor.keys);
            }
          };
          function isNode(node) {
            if (node == null) {
              return false;
            }
            return typeof node === 'object' && typeof node.type === 'string';
          }
          function isProperty(nodeType, key) {
            return (nodeType === Syntax.ObjectExpression || nodeType === Syntax.ObjectPattern) && 'properties' === key;
          }
          Controller.prototype.traverse = function traverse(root, visitor) {
            var worklist, leavelist, element, node, nodeType, ret, key, current, current2, candidates, candidate, sentinel;
            this.__initialize(root, visitor);
            sentinel = {};
            worklist = this.__worklist;
            leavelist = this.__leavelist;
            worklist.push(new Element(root, null, null, null));
            leavelist.push(new Element(null, null, null, null));
            while (worklist.length) {
              element = worklist.pop();
              if (element === sentinel) {
                element = leavelist.pop();
                ret = this.__execute(visitor.leave, element);
                if (this.__state === BREAK || ret === BREAK) {
                  return;
                }
                continue;
              }
              if (element.node) {
                ret = this.__execute(visitor.enter, element);
                if (this.__state === BREAK || ret === BREAK) {
                  return;
                }
                worklist.push(sentinel);
                leavelist.push(element);
                if (this.__state === SKIP || ret === SKIP) {
                  continue;
                }
                node = element.node;
                nodeType = node.type || element.wrap;
                candidates = this.__keys[nodeType];
                if (!candidates) {
                  if (this.__fallback) {
                    candidates = this.__fallback(node);
                  } else {
                    throw new Error('Unknown node type ' + nodeType + '.');
                  }
                }
                current = candidates.length;
                while ((current -= 1) >= 0) {
                  key = candidates[current];
                  candidate = node[key];
                  if (!candidate) {
                    continue;
                  }
                  if (isArray(candidate)) {
                    current2 = candidate.length;
                    while ((current2 -= 1) >= 0) {
                      if (!candidate[current2]) {
                        continue;
                      }
                      if (isProperty(nodeType, candidates[current])) {
                        element = new Element(candidate[current2], [
                          key,
                          current2
                        ], 'Property', null);
                      } else if (isNode(candidate[current2])) {
                        element = new Element(candidate[current2], [
                          key,
                          current2
                        ], null, null);
                      } else {
                        continue;
                      }
                      worklist.push(element);
                    }
                  } else if (isNode(candidate)) {
                    worklist.push(new Element(candidate, key, null, null));
                  }
                }
              }
            }
          };
          Controller.prototype.replace = function replace(root, visitor) {
            var worklist, leavelist, node, nodeType, target, element, current, current2, candidates, candidate, sentinel, outer, key;
            function removeElem(element) {
              var i, key, nextElem, parent;
              if (element.ref.remove()) {
                key = element.ref.key;
                parent = element.ref.parent;
                i = worklist.length;
                while (i--) {
                  nextElem = worklist[i];
                  if (nextElem.ref && nextElem.ref.parent === parent) {
                    if (nextElem.ref.key < key) {
                      break;
                    }
                    --nextElem.ref.key;
                  }
                }
              }
            }
            this.__initialize(root, visitor);
            sentinel = {};
            worklist = this.__worklist;
            leavelist = this.__leavelist;
            outer = { root: root };
            element = new Element(root, null, null, new Reference(outer, 'root'));
            worklist.push(element);
            leavelist.push(element);
            while (worklist.length) {
              element = worklist.pop();
              if (element === sentinel) {
                element = leavelist.pop();
                target = this.__execute(visitor.leave, element);
                if (target !== undefined && target !== BREAK && target !== SKIP && target !== REMOVE) {
                  element.ref.replace(target);
                }
                if (this.__state === REMOVE || target === REMOVE) {
                  removeElem(element);
                }
                if (this.__state === BREAK || target === BREAK) {
                  return outer.root;
                }
                continue;
              }
              target = this.__execute(visitor.enter, element);
              if (target !== undefined && target !== BREAK && target !== SKIP && target !== REMOVE) {
                element.ref.replace(target);
                element.node = target;
              }
              if (this.__state === REMOVE || target === REMOVE) {
                removeElem(element);
                element.node = null;
              }
              if (this.__state === BREAK || target === BREAK) {
                return outer.root;
              }
              node = element.node;
              if (!node) {
                continue;
              }
              worklist.push(sentinel);
              leavelist.push(element);
              if (this.__state === SKIP || target === SKIP) {
                continue;
              }
              nodeType = node.type || element.wrap;
              candidates = this.__keys[nodeType];
              if (!candidates) {
                if (this.__fallback) {
                  candidates = this.__fallback(node);
                } else {
                  throw new Error('Unknown node type ' + nodeType + '.');
                }
              }
              current = candidates.length;
              while ((current -= 1) >= 0) {
                key = candidates[current];
                candidate = node[key];
                if (!candidate) {
                  continue;
                }
                if (isArray(candidate)) {
                  current2 = candidate.length;
                  while ((current2 -= 1) >= 0) {
                    if (!candidate[current2]) {
                      continue;
                    }
                    if (isProperty(nodeType, candidates[current])) {
                      element = new Element(candidate[current2], [
                        key,
                        current2
                      ], 'Property', new Reference(candidate, current2));
                    } else if (isNode(candidate[current2])) {
                      element = new Element(candidate[current2], [
                        key,
                        current2
                      ], null, new Reference(candidate, current2));
                    } else {
                      continue;
                    }
                    worklist.push(element);
                  }
                } else if (isNode(candidate)) {
                  worklist.push(new Element(candidate, key, null, new Reference(node, key)));
                }
              }
            }
            return outer.root;
          };
          function traverse(root, visitor) {
            var controller = new Controller;
            return controller.traverse(root, visitor);
          }
          function replace(root, visitor) {
            var controller = new Controller;
            return controller.replace(root, visitor);
          }
          function extendCommentRange(comment, tokens) {
            var target;
            target = upperBound(tokens, function search(token) {
              return token.range[0] > comment.range[0];
            });
            comment.extendedRange = [
              comment.range[0],
              comment.range[1]
            ];
            if (target !== tokens.length) {
              comment.extendedRange[1] = tokens[target].range[0];
            }
            target -= 1;
            if (target >= 0) {
              comment.extendedRange[0] = tokens[target].range[1];
            }
            return comment;
          }
          function attachComments(tree, providedComments, tokens) {
            var comments = [], comment, len, i, cursor;
            if (!tree.range) {
              throw new Error('attachComments needs range information');
            }
            if (!tokens.length) {
              if (providedComments.length) {
                for (i = 0, len = providedComments.length; i < len; i += 1) {
                  comment = deepCopy(providedComments[i]);
                  comment.extendedRange = [
                    0,
                    tree.range[0]
                  ];
                  comments.push(comment);
                }
                tree.leadingComments = comments;
              }
              return tree;
            }
            for (i = 0, len = providedComments.length; i < len; i += 1) {
              comments.push(extendCommentRange(deepCopy(providedComments[i]), tokens));
            }
            cursor = 0;
            traverse(tree, {
              enter: function (node) {
                var comment;
                while (cursor < comments.length) {
                  comment = comments[cursor];
                  if (comment.extendedRange[1] > node.range[0]) {
                    break;
                  }
                  if (comment.extendedRange[1] === node.range[0]) {
                    if (!node.leadingComments) {
                      node.leadingComments = [];
                    }
                    node.leadingComments.push(comment);
                    comments.splice(cursor, 1);
                  } else {
                    cursor += 1;
                  }
                }
                if (cursor === comments.length) {
                  return VisitorOption.Break;
                }
                if (comments[cursor].extendedRange[0] > node.range[1]) {
                  return VisitorOption.Skip;
                }
              }
            });
            cursor = 0;
            traverse(tree, {
              leave: function (node) {
                var comment;
                while (cursor < comments.length) {
                  comment = comments[cursor];
                  if (node.range[1] < comment.extendedRange[0]) {
                    break;
                  }
                  if (node.range[1] === comment.extendedRange[0]) {
                    if (!node.trailingComments) {
                      node.trailingComments = [];
                    }
                    node.trailingComments.push(comment);
                    comments.splice(cursor, 1);
                  } else {
                    cursor += 1;
                  }
                }
                if (cursor === comments.length) {
                  return VisitorOption.Break;
                }
                if (comments[cursor].extendedRange[0] > node.range[1]) {
                  return VisitorOption.Skip;
                }
              }
            });
            return tree;
          }
          exports.version = require('/node_modules/estraverse/package.json', module).version;
          exports.Syntax = Syntax;
          exports.traverse = traverse;
          exports.replace = replace;
          exports.attachComments = attachComments;
          exports.VisitorKeys = VisitorKeys;
          exports.VisitorOption = VisitorOption;
          exports.Controller = Controller;
          exports.cloneEnvironment = function () {
            return clone({});
          };
          return exports;
        }(exports));
      });
      require.define('/node_modules/estraverse/package.json', function (module, exports, __dirname, __filename) {
        module.exports = {
          '_from': 'estraverse@^4.2.0',
          '_id': 'estraverse@4.2.0',
          '_inBundle': false,
          '_integrity': 'sha1-De4/7TH81GlhjOc0IJn8GvoL2xM=',
          '_location': '/estraverse',
          '_phantomChildren': {},
          '_requested': {
            'type': 'range',
            'registry': true,
            'raw': 'estraverse@^4.2.0',
            'name': 'estraverse',
            'escapedName': 'estraverse',
            'rawSpec': '^4.2.0',
            'saveSpec': null,
            'fetchSpec': '^4.2.0'
          },
          '_requiredBy': [
            '/',
            '/eslint',
            '/eslint/escope',
            '/esquery',
            '/esrecurse'
          ],
          '_resolved': 'https://registry.npmjs.org/estraverse/-/estraverse-4.2.0.tgz',
          '_shasum': '0dee3fed31fcd469618ce7342099fc1afa0bdb13',
          '_spec': 'estraverse@^4.2.0',
          '_where': '/Users/michaelb/escodegen',
          'bugs': { 'url': 'https://github.com/estools/estraverse/issues' },
          'bundleDependencies': false,
          'deprecated': false,
          'description': 'ECMAScript JS AST traversal functions',
          'devDependencies': {
            'babel-preset-es2015': '^6.3.13',
            'babel-register': '^6.3.13',
            'chai': '^2.1.1',
            'espree': '^1.11.0',
            'gulp': '^3.8.10',
            'gulp-bump': '^0.2.2',
            'gulp-filter': '^2.0.0',
            'gulp-git': '^1.0.1',
            'gulp-tag-version': '^1.2.1',
            'jshint': '^2.5.6',
            'mocha': '^2.1.0'
          },
          'engines': { 'node': '>=0.10.0' },
          'homepage': 'https://github.com/estools/estraverse',
          'license': 'BSD-2-Clause',
          'main': 'estraverse.js',
          'maintainers': [{
              'name': 'Yusuke Suzuki',
              'email': 'utatane.tea@gmail.com',
              'url': 'http://github.com/Constellation'
            }],
          'name': 'estraverse',
          'repository': {
            'type': 'git',
            'url': 'git+ssh://git@github.com/estools/estraverse.git'
          },
          'scripts': {
            'lint': 'jshint estraverse.js',
            'test': 'npm run-script lint && npm run-script unit-test',
            'unit-test': 'mocha --compilers js:babel-register'
          },
          'version': '4.2.0'
        };
      });
      return require('/escodegen.js');
    })
    )();
    const compile__compile = ((function ($runtime, runtime__runtime262, vendor__escodegen263, compile__module264) {
        const exp_ctx265 = runtime__runtime262['obj']('ctx-type', 'exp');
        const stmt_ctx266 = function (recur_vars284) {
            if (1 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 63', 1, arguments['length']);
            {
                var recur_vars283 = recur_vars284;
                while (true) {
                    return runtime__runtime262['obj']('ctx-type', 'stmt', 'recur-vars', recur_vars283);
                }
            }
        };
        const non_recur_stmt_ctx267 = runtime__runtime262['obj']('ctx-type', 'stmt');
        const exp_ctx_huh_268 = function (ctx286) {
            if (1 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 64', 1, arguments['length']);
            {
                var ctx285 = ctx286;
                while (true) {
                    return runtime__runtime262['equal?']('exp', runtime__runtime262['get'](ctx285, 'ctx-type'));
                }
            }
        };
        const stmt_ctx_huh_269 = function (ctx288) {
            if (1 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 65', 1, arguments['length']);
            {
                var ctx287 = ctx288;
                while (true) {
                    return runtime__runtime262['equal?']('stmt', runtime__runtime262['get'](ctx287, 'ctx-type'));
                }
            }
        };
        const recur_ctx_huh_270 = function (ctx290) {
            if (1 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 66', 1, arguments['length']);
            {
                var ctx289 = ctx290;
                while (true) {
                    return runtime__runtime262['has'](ctx289, 'recur-vars');
                }
            }
        };
        const recur_ctx_vars271 = function (ctx292) {
            if (1 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 67', 1, arguments['length']);
            {
                var ctx291 = ctx292;
                while (true) {
                    return runtime__runtime262['get'](ctx291, 'recur-vars');
                }
            }
        };
        const ctr272 = runtime__runtime262['box'](0);
        const gen_fn_id273 = function () {
            if (0 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 68', 0, arguments['length']);
            {
                while (true) {
                    const v293 = runtime__runtime262['unbox'](ctr272);
                    const _294 = runtime__runtime262['set-box!'](ctr272, runtime__runtime262['+'](v293, 1));
                    return v293;
                }
            }
        };
        const gen_literal274 = function (value296) {
            if (1 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 69', 1, arguments['length']);
            {
                var value295 = value296;
                while (true) {
                    return runtime__runtime262['obj']('type', 'Literal', 'value', value295);
                }
            }
        };
        const gen_identifier275 = function (str299) {
            if (1 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 70', 1, arguments['length']);
            {
                var str297 = str299;
                while (true) {
                    const _298 = runtime__runtime262['string/c']('gen-identifier', str297);
                    return runtime__runtime262['obj']('type', 'Identifier', 'name', str297);
                }
            }
        };
        const gen_binding276 = function (lhs303, rhs304, kind305) {
            if (3 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 71', 3, arguments['length']);
            {
                var lhs300 = lhs303;
                var rhs301 = rhs304;
                var kind302 = kind305;
                while (true) {
                    return runtime__runtime262['obj']('type', 'VariableDeclaration', 'kind', kind302, 'declarations', runtime__runtime262['array'](runtime__runtime262['obj']('type', 'VariableDeclarator', 'id', gen_identifier275(lhs300), 'init', rhs301)));
                }
            }
        };
        const gen_const_field_access277 = function (o308, name309) {
            if (2 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 72', 2, arguments['length']);
            {
                var o306 = o308;
                var name307 = name309;
                while (true) {
                    return runtime__runtime262['obj']('type', 'MemberExpression', 'object', o306, 'property', gen_literal274(name307), 'computed', runtime__runtime262['true']);
                }
            }
        };
        const gen_iife278 = function (body311) {
            if (1 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 73', 1, arguments['length']);
            {
                var body310 = body311;
                while (true) {
                    return runtime__runtime262['obj']('type', 'CallExpression', 'arguments', runtime__runtime262['array'](), 'callee', runtime__runtime262['obj']('type', 'FunctionExpression', 'params', runtime__runtime262['array'](), 'body', body310));
                }
            }
        };
        const gen_assignment_stmt279 = function (lhs314, rhs315) {
            if (2 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 74', 2, arguments['length']);
            {
                var lhs312 = lhs314;
                var rhs313 = rhs315;
                while (true) {
                    return runtime__runtime262['obj']('type', 'ExpressionStatement', 'expression', runtime__runtime262['obj']('type', 'AssignmentExpression', 'operator', '=', 'left', gen_identifier275(lhs312), 'right', rhs313));
                }
            }
        };
        const compile_def280 = function (d317) {
            if (1 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 75', 1, arguments['length']);
            {
                var d316 = d317;
                while (true) {
                    return gen_binding276(runtime__runtime262['get'](d316, 'id'), compile_expression281(runtime__runtime262['get'](d316, 'rhs'), exp_ctx265), 'const');
                }
            }
        };
        const compile_expression281 = function (e386, ctx387) {
            if (2 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 76', 2, arguments['length']);
            {
                var e318 = e386;
                var ctx319 = ctx387;
                while (true) {
                    const maybe_return320 = function (e338) {
                        if (1 !== arguments['length'])
                            $runtime['raise-arity-error']('anonymous procedure 77', 1, arguments['length']);
                        {
                            var e337 = e338;
                            while (true) {
                                if (false !== stmt_ctx_huh_269(ctx319))
                                    return runtime__runtime262['obj']('type', 'ReturnStatement', 'argument', e337);
                                else
                                    return e337;
                            }
                        }
                    };
                    const compile_literal321 = function () {
                        if (0 !== arguments['length'])
                            $runtime['raise-arity-error']('anonymous procedure 78', 0, arguments['length']);
                        {
                            while (true) {
                                return maybe_return320(gen_literal274(runtime__runtime262['get'](e318, 'literal')));
                            }
                        }
                    };
                    const compile_local_ref322 = function () {
                        if (0 !== arguments['length'])
                            $runtime['raise-arity-error']('anonymous procedure 79', 0, arguments['length']);
                        {
                            while (true) {
                                return maybe_return320(gen_identifier275(runtime__runtime262['get'](e318, 'local-ref')));
                            }
                        }
                    };
                    const compile_module_ref323 = function () {
                        if (0 !== arguments['length'])
                            $runtime['raise-arity-error']('anonymous procedure 80', 0, arguments['length']);
                        {
                            while (true) {
                                return maybe_return320(gen_const_field_access277(gen_identifier275(runtime__runtime262['get'](e318, 'module-ref-sym')), runtime__runtime262['get'](e318, 'module-ref-field')));
                            }
                        }
                    };
                    const compile_app324 = function () {
                        if (0 !== arguments['length'])
                            $runtime['raise-arity-error']('anonymous procedure 81', 0, arguments['length']);
                        {
                            while (true) {
                                const compiled_exps339 = runtime__runtime262['map'](function (e341) {
                                    if (1 !== arguments['length'])
                                        $runtime['raise-arity-error']('anonymous procedure 82', 1, arguments['length']);
                                    {
                                        var e340 = e341;
                                        while (true) {
                                            return compile_expression281(e340, exp_ctx265);
                                        }
                                    }
                                }, runtime__runtime262['get'](e318, 'app-exps'));
                                return maybe_return320(runtime__runtime262['obj']('type', 'CallExpression', 'callee', runtime__runtime262['first'](compiled_exps339), 'arguments', runtime__runtime262['list->array'](runtime__runtime262['rest'](compiled_exps339))));
                            }
                        }
                    };
                    const build_condition325 = function (if_c343) {
                        if (1 !== arguments['length'])
                            $runtime['raise-arity-error']('anonymous procedure 83', 1, arguments['length']);
                        {
                            var if_c342 = if_c343;
                            while (true) {
                                return runtime__runtime262['obj']('type', 'BinaryExpression', 'operator', '!==', 'left', gen_literal274(runtime__runtime262['false']), 'right', if_c342);
                            }
                        }
                    };
                    const compile_if_exp326 = function () {
                        if (0 !== arguments['length'])
                            $runtime['raise-arity-error']('anonymous procedure 84', 0, arguments['length']);
                        {
                            while (true) {
                                return maybe_return320(runtime__runtime262['obj']('type', 'ConditionalExpression', 'test', build_condition325(compile_expression281(runtime__runtime262['get'](e318, 'if-c'), ctx319)), 'consequent', compile_expression281(runtime__runtime262['get'](e318, 'if-t'), ctx319), 'alternate', compile_expression281(runtime__runtime262['get'](e318, 'if-e'), ctx319)));
                            }
                        }
                    };
                    const compile_if_stmt327 = function () {
                        if (0 !== arguments['length'])
                            $runtime['raise-arity-error']('anonymous procedure 85', 0, arguments['length']);
                        {
                            while (true) {
                                return runtime__runtime262['obj']('type', 'IfStatement', 'test', build_condition325(compile_expression281(runtime__runtime262['get'](e318, 'if-c'), exp_ctx265)), 'consequent', compile_expression281(runtime__runtime262['get'](e318, 'if-t'), ctx319), 'alternate', compile_expression281(runtime__runtime262['get'](e318, 'if-e'), ctx319));
                            }
                        }
                    };
                    const compile_block328 = function (block348, ctx349) {
                        if (2 !== arguments['length'])
                            $runtime['raise-arity-error']('anonymous procedure 86', 2, arguments['length']);
                        {
                            var block344 = block348;
                            var ctx345 = ctx349;
                            while (true) {
                                const decls346 = runtime__runtime262['map'](compile_def280, runtime__runtime262['get'](block344, 'block-defs'));
                                const ret347 = compile_expression281(runtime__runtime262['get'](block344, 'block-ret'), ctx345);
                                return runtime__runtime262['obj']('type', 'BlockStatement', 'body', runtime__runtime262['list->array'](runtime__runtime262['append'](decls346, runtime__runtime262['list'](ret347))));
                            }
                        }
                    };
                    const build_loop_body329 = function (vars360, inits361, body362, ctx363) {
                        if (4 !== arguments['length'])
                            $runtime['raise-arity-error']('anonymous procedure 87', 4, arguments['length']);
                        {
                            var vars350 = vars360;
                            var inits351 = inits361;
                            var body352 = body362;
                            var ctx353 = ctx363;
                            while (true) {
                                const decls354 = runtime__runtime262['zip'](function (var358, init359) {
                                    if (2 !== arguments['length'])
                                        $runtime['raise-arity-error']('anonymous procedure 88', 2, arguments['length']);
                                    {
                                        var var356 = var358;
                                        var init357 = init359;
                                        while (true) {
                                            return gen_binding276(var356, compile_expression281(init357, exp_ctx265), 'var');
                                        }
                                    }
                                }, vars350, inits351);
                                const body_loop355 = runtime__runtime262['obj']('type', 'WhileStatement', 'test', gen_literal274(runtime__runtime262['true']), 'body', compile_block328(body352, stmt_ctx266(vars350)));
                                return runtime__runtime262['obj']('type', 'BlockStatement', 'body', runtime__runtime262['list->array'](runtime__runtime262['append'](decls354, runtime__runtime262['list'](body_loop355))));
                            }
                        }
                    };
                    const build_arity_check330 = function (name366, count367) {
                        if (2 !== arguments['length'])
                            $runtime['raise-arity-error']('anonymous procedure 89', 2, arguments['length']);
                        {
                            var name364 = name366;
                            var count365 = count367;
                            while (true) {
                                return runtime__runtime262['obj']('type', 'IfStatement', 'test', runtime__runtime262['obj']('type', 'BinaryExpression', 'operator', '!==', 'left', gen_literal274(count365), 'right', gen_const_field_access277(gen_identifier275('arguments'), 'length')), 'consequent', runtime__runtime262['obj']('type', 'ExpressionStatement', 'expression', runtime__runtime262['obj']('type', 'CallExpression', 'callee', gen_const_field_access277(gen_identifier275('$runtime'), 'raise-arity-error'), 'arguments', runtime__runtime262['array'](gen_literal274(name364), gen_literal274(count365), gen_const_field_access277(gen_identifier275('arguments'), 'length')))), 'alternate', runtime__runtime262['null']);
                            }
                        }
                    };
                    const compile_fn331 = function () {
                        if (0 !== arguments['length'])
                            $runtime['raise-arity-error']('anonymous procedure 90', 0, arguments['length']);
                        {
                            while (true) {
                                const temps_as_refs368 = runtime__runtime262['map'](function (t370) {
                                    if (1 !== arguments['length'])
                                        $runtime['raise-arity-error']('anonymous procedure 91', 1, arguments['length']);
                                    {
                                        var t369 = t370;
                                        while (true) {
                                            return runtime__runtime262['obj']('local-ref', t369);
                                        }
                                    }
                                }, runtime__runtime262['get'](e318, 'fn-temps'));
                                return maybe_return320(runtime__runtime262['obj']('type', 'FunctionExpression', 'params', runtime__runtime262['list->array'](runtime__runtime262['map'](gen_identifier275, runtime__runtime262['get'](e318, 'fn-temps'))), 'body', runtime__runtime262['obj']('type', 'BlockStatement', 'body', runtime__runtime262['array'](build_arity_check330(runtime__runtime262['string-append']('anonymous procedure ', runtime__runtime262['number->string'](gen_fn_id273())), runtime__runtime262['size'](runtime__runtime262['get'](e318, 'fn-args'))), build_loop_body329(runtime__runtime262['get'](e318, 'fn-args'), temps_as_refs368, e318, ctx319)))));
                            }
                        }
                    };
                    const compile_loop_exp332 = function () {
                        if (0 !== arguments['length'])
                            $runtime['raise-arity-error']('anonymous procedure 92', 0, arguments['length']);
                        {
                            while (true) {
                                return maybe_return320(gen_iife278(build_loop_body329(runtime__runtime262['get'](e318, 'loop-vars'), runtime__runtime262['get'](e318, 'loop-inits'), e318, ctx319)));
                            }
                        }
                    };
                    const compile_loop_stmt333 = function () {
                        if (0 !== arguments['length'])
                            $runtime['raise-arity-error']('anonymous procedure 93', 0, arguments['length']);
                        {
                            while (true) {
                                return build_loop_body329(runtime__runtime262['get'](e318, 'loop-vars'), runtime__runtime262['get'](e318, 'loop-inits'), e318, ctx319);
                            }
                        }
                    };
                    const compile_block_exp334 = function () {
                        if (0 !== arguments['length'])
                            $runtime['raise-arity-error']('anonymous procedure 94', 0, arguments['length']);
                        {
                            while (true) {
                                return maybe_return320(gen_iife278(compile_block328(e318, non_recur_stmt_ctx267)));
                            }
                        }
                    };
                    const compile_block_stmt335 = function () {
                        if (0 !== arguments['length'])
                            $runtime['raise-arity-error']('anonymous procedure 95', 0, arguments['length']);
                        {
                            while (true) {
                                return compile_block328(e318, ctx319);
                            }
                        }
                    };
                    const compile_recur336 = function () {
                        if (0 !== arguments['length'])
                            $runtime['raise-arity-error']('anonymous procedure 96', 0, arguments['length']);
                        {
                            while (true) {
                                const _1371 = false !== runtime__runtime262['not'](recur_ctx_huh_270(ctx319)) ? runtime__runtime262['error']('compile', 'recur not in tail position') : runtime__runtime262['null'];
                                const _2372 = false !== runtime__runtime262['not'](runtime__runtime262['='](runtime__runtime262['size'](recur_ctx_vars271(ctx319)), runtime__runtime262['size'](runtime__runtime262['get'](e318, 'recur-exps')))) ? runtime__runtime262['error']('wrong number of arguments to recur') : runtime__runtime262['null'];
                                const compiled_expressions373 = runtime__runtime262['map'](function (e377) {
                                    if (1 !== arguments['length'])
                                        $runtime['raise-arity-error']('anonymous procedure 97', 1, arguments['length']);
                                    {
                                        var e376 = e377;
                                        while (true) {
                                            return compile_expression281(e376, exp_ctx265);
                                        }
                                    }
                                }, runtime__runtime262['get'](e318, 'recur-exps'));
                                const tmp_decls374 = runtime__runtime262['zip'](function (lhs380, rhs381) {
                                    if (2 !== arguments['length'])
                                        $runtime['raise-arity-error']('anonymous procedure 98', 2, arguments['length']);
                                    {
                                        var lhs378 = lhs380;
                                        var rhs379 = rhs381;
                                        while (true) {
                                            return gen_binding276(lhs378, rhs379, 'const');
                                        }
                                    }
                                }, runtime__runtime262['get'](e318, 'recur-temps'), compiled_expressions373);
                                const loop_var_assigns375 = runtime__runtime262['zip'](function (loop_var384, tmp_var385) {
                                    if (2 !== arguments['length'])
                                        $runtime['raise-arity-error']('anonymous procedure 99', 2, arguments['length']);
                                    {
                                        var loop_var382 = loop_var384;
                                        var tmp_var383 = tmp_var385;
                                        while (true) {
                                            return gen_assignment_stmt279(loop_var382, compile_expression281(runtime__runtime262['obj']('local-ref', tmp_var383), exp_ctx265));
                                        }
                                    }
                                }, recur_ctx_vars271(ctx319), runtime__runtime262['get'](e318, 'recur-temps'));
                                return runtime__runtime262['obj']('type', 'BlockStatement', 'body', runtime__runtime262['list->array'](runtime__runtime262['append'](tmp_decls374, loop_var_assigns375)));
                            }
                        }
                    };
                    if (false !== runtime__runtime262['has'](e318, 'literal'))
                        return compile_literal321();
                    else if (false !== runtime__runtime262['has'](e318, 'local-ref'))
                        return compile_local_ref322();
                    else if (false !== runtime__runtime262['has'](e318, 'module-ref-sym'))
                        return compile_module_ref323();
                    else if (false !== runtime__runtime262['has'](e318, 'app-exps'))
                        return compile_app324();
                    else if (false !== (false !== runtime__runtime262['has'](e318, 'if-c') ? exp_ctx_huh_268(ctx319) : false))
                        return compile_if_exp326();
                    else if (false !== (false !== runtime__runtime262['has'](e318, 'if-c') ? stmt_ctx_huh_269(ctx319) : false))
                        return compile_if_stmt327();
                    else if (false !== runtime__runtime262['has'](e318, 'fn-args'))
                        return compile_fn331();
                    else if (false !== (false !== runtime__runtime262['has'](e318, 'loop-vars') ? exp_ctx_huh_268(ctx319) : false))
                        return compile_loop_exp332();
                    else if (false !== (false !== runtime__runtime262['has'](e318, 'loop-vars') ? stmt_ctx_huh_269(ctx319) : false))
                        return compile_loop_stmt333();
                    else if (false !== (false !== runtime__runtime262['has'](e318, 'block-exp') ? exp_ctx_huh_268(ctx319) : false))
                        return compile_block_exp334();
                    else if (false !== (false !== runtime__runtime262['has'](e318, 'block-exp') ? stmt_ctx_huh_269(ctx319) : false))
                        return compile_block_stmt335();
                    else if (false !== runtime__runtime262['has'](e318, 'recur-exps'))
                        return compile_recur336();
                    else
                        return runtime__runtime262['error']('compile', runtime__runtime262['string-append']('unhandled expression ', runtime__runtime262['to-string'](e318)));
                }
            }
        };
        const compile_module282 = function (stree400) {
            if (1 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 100', 1, arguments['length']);
            {
                var stree388 = stree400;
                while (true) {
                    const compiled_defs389 = runtime__runtime262['map'](compile_def280, runtime__runtime262['get'](stree388, 'block-defs'));
                    const compiled_return390 = runtime__runtime262['obj']('type', 'ReturnStatement', 'argument', runtime__runtime262['obj']('type', 'ObjectExpression', 'properties', runtime__runtime262['list->array'](runtime__runtime262['zip'](function (internal398, external399) {
                        if (2 !== arguments['length'])
                            $runtime['raise-arity-error']('anonymous procedure 101', 2, arguments['length']);
                        {
                            var internal396 = internal398;
                            var external397 = external399;
                            while (true) {
                                return runtime__runtime262['obj']('type', 'Property', 'key', gen_literal274(external397), 'value', gen_identifier275(internal396));
                            }
                        }
                    }, runtime__runtime262['get'](stree388, 'module-provide-internal-ids'), runtime__runtime262['get'](stree388, 'module-provides')))));
                    const require_internal_ids391 = runtime__runtime262['cons']('$runtime', runtime__runtime262['get'](stree388, 'module-require-internal-ids'));
                    const estree392 = runtime__runtime262['obj']('type', 'FunctionExpression', 'params', runtime__runtime262['list->array'](runtime__runtime262['map'](gen_identifier275, require_internal_ids391)), 'body', runtime__runtime262['obj']('type', 'BlockStatement', 'body', runtime__runtime262['list->array'](runtime__runtime262['append'](compiled_defs389, runtime__runtime262['list'](compiled_return390)))));
                    const compiled_body393 = vendor__escodegen263['generate'](estree392);
                    const paren_wrapped394 = runtime__runtime262['string-append']('(', compiled_body393, ')');
                    const module_requires395 = runtime__runtime262['cons']('runtime/minimal', runtime__runtime262['get'](stree388, 'module-requires'));
                    return compile__module264['compiled-module'](module_requires395, runtime__runtime262['get'](stree388, 'module-provides'), paren_wrapped394);
                }
            }
        };
        return { 'compile-module': compile_module282 };
    }))(runtime__minimal, runtime__runtime, vendor__escodegen, compile__module);
    const compile__parse = ((function ($runtime, runtime__runtime401, compile__reader402) {
        const syntax_error403 = function (stx426) {
            if (1 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 102', 1, arguments['length']);
            {
                var stx425 = stx426;
                while (true) {
                    return runtime__runtime401['error']('bad syntax', runtime__runtime401['to-string'](stx425));
                }
            }
        };
        const unbound_reference_error404 = function (id428) {
            if (1 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 103', 1, arguments['length']);
            {
                var id427 = id428;
                while (true) {
                    return runtime__runtime401['error']('unbound reference', runtime__runtime401['identifier-string'](id427));
                }
            }
        };
        const operators405 = runtime__runtime401['hash']('-', '_', '/', '__', '+', '_plus_', '*', '_mul_', '%', '_mod_', '>', '_gt_', '<', '_lt_', '=', '_eq_', '!', '_bang_', '?', '_huh_');
        const transform_reserved406 = function (s432) {
            if (1 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 104', 1, arguments['length']);
            {
                var s429 = s432;
                while (true) {
                    return runtime__runtime401['string-join'](runtime__runtime401['map'](function (c431) {
                        if (1 !== arguments['length'])
                            $runtime['raise-arity-error']('anonymous procedure 105', 1, arguments['length']);
                        {
                            var c430 = c431;
                            while (true) {
                                if (false !== runtime__runtime401['has'](operators405, c430))
                                    return runtime__runtime401['get'](operators405, c430);
                                else
                                    return c430;
                            }
                        }
                    }, runtime__runtime401['string-split'](s429, '')), '');
                }
            }
        };
        const gensym_counter407 = runtime__runtime401['box'](0);
        const gensym408 = function (id436) {
            if (1 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 106', 1, arguments['length']);
            {
                var id433 = id436;
                while (true) {
                    const n434 = runtime__runtime401['unbox'](gensym_counter407);
                    const _435 = runtime__runtime401['set-box!'](gensym_counter407, runtime__runtime401['+'](1, n434));
                    return runtime__runtime401['string-append'](transform_reserved406(runtime__runtime401['identifier-string'](id433)), runtime__runtime401['to-string'](n434));
                }
            }
        };
        const app_parser409 = function (exp441, env442) {
            if (2 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 107', 2, arguments['length']);
            {
                var exp437 = exp441;
                var env438 = env442;
                while (true) {
                    if (false !== runtime__runtime401['<'](runtime__runtime401['size'](exp437), 1))
                        return syntax_error403(exp437);
                    else
                        return runtime__runtime401['obj']('app-exps', runtime__runtime401['map'](function (e440) {
                            if (1 !== arguments['length'])
                                $runtime['raise-arity-error']('anonymous procedure 108', 1, arguments['length']);
                            {
                                var e439 = e440;
                                while (true) {
                                    return parse_exp422(e439, env438);
                                }
                            }
                        }, exp437));
                }
            }
        };
        const if_parser410 = function (exp445, env446) {
            if (2 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 109', 2, arguments['length']);
            {
                var exp443 = exp445;
                var env444 = env446;
                while (true) {
                    if (false !== runtime__runtime401['not'](runtime__runtime401['='](runtime__runtime401['size'](exp443), 4)))
                        return syntax_error403(exp443);
                    else
                        return runtime__runtime401['obj']('if-c', parse_exp422(runtime__runtime401['get'](exp443, 1), env444), 'if-t', parse_exp422(runtime__runtime401['get'](exp443, 2), env444), 'if-e', parse_exp422(runtime__runtime401['get'](exp443, 3), env444));
                }
            }
        };
        const and_parser411 = function (exp449, env450) {
            if (2 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 110', 2, arguments['length']);
            {
                var exp447 = exp449;
                var env448 = env450;
                while (true) {
                    if (false !== runtime__runtime401['not'](runtime__runtime401['='](runtime__runtime401['size'](exp447), 3)))
                        return syntax_error403(exp447);
                    else
                        return runtime__runtime401['obj']('if-c', parse_exp422(runtime__runtime401['get'](exp447, 1), env448), 'if-t', parse_exp422(runtime__runtime401['get'](exp447, 2), env448), 'if-e', runtime__runtime401['obj']('literal', runtime__runtime401['false']));
                }
            }
        };
        const or_parser412 = function (exp454, env455) {
            if (2 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 111', 2, arguments['length']);
            {
                var exp451 = exp454;
                var env452 = env455;
                while (true) {
                    if (false !== runtime__runtime401['not'](runtime__runtime401['='](runtime__runtime401['size'](exp451), 3)))
                        return syntax_error403(exp451);
                    else {
                        const tmpid453 = gensym408(runtime__runtime401['make-identifier']('tmp'));
                        return runtime__runtime401['obj']('block-exp', runtime__runtime401['true'], 'block-defs', runtime__runtime401['list'](runtime__runtime401['obj']('id', tmpid453, 'rhs', parse_exp422(runtime__runtime401['get'](exp451, 1), env452))), 'block-ret', runtime__runtime401['obj']('if-c', runtime__runtime401['obj']('local-ref', tmpid453), 'if-t', runtime__runtime401['obj']('local-ref', tmpid453), 'if-e', parse_exp422(runtime__runtime401['get'](exp451, 2), env452)));
                    }
                }
            }
        };
        const block_parser413 = function (exp459, env460) {
            if (2 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 112', 2, arguments['length']);
            {
                var exp456 = exp459;
                var env457 = env460;
                while (true) {
                    const parsed_block458 = parse_block421(runtime__runtime401['rest'](exp456), env457);
                    if (false !== runtime__runtime401['empty?'](runtime__runtime401['get'](parsed_block458, 'block-defs')))
                        return runtime__runtime401['get'](parsed_block458, 'block-ret');
                    else
                        return runtime__runtime401['assoc'](parsed_block458, 'block-exp', runtime__runtime401['true']);
                }
            }
        };
        const fn_parser414 = function (exp472, env473) {
            if (2 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 113', 2, arguments['length']);
            {
                var exp461 = exp472;
                var env462 = env473;
                while (true) {
                    if (false !== runtime__runtime401['<'](runtime__runtime401['size'](exp461), 3))
                        return syntax_error403(exp461);
                    else {
                        const args463 = runtime__runtime401['get'](exp461, 1);
                        const _464 = false !== runtime__runtime401['not'](false !== runtime__runtime401['list?'](args463) ? runtime__runtime401['map'](runtime__runtime401['identifier?'], args463) : false) ? syntax_error403(exp461) : runtime__runtime401['null'];
                        const new_env465 = runtime__runtime401['foldl'](function (env468, arg469) {
                            if (2 !== arguments['length'])
                                $runtime['raise-arity-error']('anonymous procedure 114', 2, arguments['length']);
                            {
                                var env466 = env468;
                                var arg467 = arg469;
                                while (true) {
                                    return runtime__runtime401['assoc'](env466, arg467, runtime__runtime401['obj']('local-ref', gensym408(arg467)));
                                }
                            }
                        }, env462, args463);
                        return runtime__runtime401['assoc'](runtime__runtime401['assoc'](parse_block421(runtime__runtime401['rest'](runtime__runtime401['rest'](exp461)), new_env465), 'fn-args', runtime__runtime401['map'](function (arg471) {
                            if (1 !== arguments['length'])
                                $runtime['raise-arity-error']('anonymous procedure 115', 1, arguments['length']);
                            {
                                var arg470 = arg471;
                                while (true) {
                                    return runtime__runtime401['get'](runtime__runtime401['get'](new_env465, arg470), 'local-ref');
                                }
                            }
                        }, args463)), 'fn-temps', runtime__runtime401['map'](gensym408, args463));
                    }
                }
            }
        };
        const loop_parser415 = function (exp490, env491) {
            if (2 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 116', 2, arguments['length']);
            {
                var exp474 = exp490;
                var env475 = env491;
                while (true) {
                    if (false !== runtime__runtime401['<'](runtime__runtime401['size'](exp474), 3))
                        return syntax_error403(exp474);
                    else {
                        const binding_list476 = runtime__runtime401['get'](exp474, 1);
                        const _477 = false !== runtime__runtime401['not'](runtime__runtime401['list?'](binding_list476)) ? syntax_error403(exp474) : runtime__runtime401['null'];
                        const surface_vars478 = runtime__runtime401['map'](function (pr481) {
                            if (1 !== arguments['length'])
                                $runtime['raise-arity-error']('anonymous procedure 117', 1, arguments['length']);
                            {
                                var pr480 = pr481;
                                while (true) {
                                    return runtime__runtime401['get'](pr480, 0);
                                }
                            }
                        }, binding_list476);
                        const new_env479 = runtime__runtime401['foldl'](function (env484, var485) {
                            if (2 !== arguments['length'])
                                $runtime['raise-arity-error']('anonymous procedure 118', 2, arguments['length']);
                            {
                                var env482 = env484;
                                var var483 = var485;
                                while (true) {
                                    return runtime__runtime401['assoc'](env482, var483, runtime__runtime401['obj']('local-ref', gensym408(var483)));
                                }
                            }
                        }, env475, surface_vars478);
                        return runtime__runtime401['assoc'](runtime__runtime401['assoc'](parse_block421(runtime__runtime401['rest'](runtime__runtime401['rest'](exp474)), new_env479), 'loop-vars', runtime__runtime401['map'](function (var487) {
                            if (1 !== arguments['length'])
                                $runtime['raise-arity-error']('anonymous procedure 119', 1, arguments['length']);
                            {
                                var var486 = var487;
                                while (true) {
                                    return runtime__runtime401['get'](runtime__runtime401['get'](new_env479, var486), 'local-ref');
                                }
                            }
                        }, surface_vars478)), 'loop-inits', runtime__runtime401['map'](function (pr489) {
                            if (1 !== arguments['length'])
                                $runtime['raise-arity-error']('anonymous procedure 120', 1, arguments['length']);
                            {
                                var pr488 = pr489;
                                while (true) {
                                    return parse_exp422(runtime__runtime401['get'](pr488, 1), env475);
                                }
                            }
                        }, binding_list476));
                    }
                }
            }
        };
        const recur_parser416 = function (exp498, env499) {
            if (2 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 121', 2, arguments['length']);
            {
                var exp492 = exp498;
                var env493 = env499;
                while (true) {
                    return runtime__runtime401['obj']('recur-exps', runtime__runtime401['map'](function (e495) {
                        if (1 !== arguments['length'])
                            $runtime['raise-arity-error']('anonymous procedure 122', 1, arguments['length']);
                        {
                            var e494 = e495;
                            while (true) {
                                return parse_exp422(e494, env493);
                            }
                        }
                    }, runtime__runtime401['rest'](exp492)), 'recur-temps', runtime__runtime401['map'](function (_497) {
                        if (1 !== arguments['length'])
                            $runtime['raise-arity-error']('anonymous procedure 123', 1, arguments['length']);
                        {
                            var _496 = _497;
                            while (true) {
                                return gensym408(runtime__runtime401['make-identifier']('tmp'));
                            }
                        }
                    }, runtime__runtime401['rest'](exp492)));
                }
            }
        };
        const def_env_rhs417 = runtime__runtime401['obj']('def', runtime__runtime401['true']);
        const initial_env418 = runtime__runtime401['hash'](runtime__runtime401['make-identifier']('def'), def_env_rhs417, runtime__runtime401['make-identifier']('fn'), runtime__runtime401['obj']('core-form', fn_parser414), runtime__runtime401['make-identifier']('if'), runtime__runtime401['obj']('core-form', if_parser410), runtime__runtime401['make-identifier']('or'), runtime__runtime401['obj']('core-form', or_parser412), runtime__runtime401['make-identifier']('and'), runtime__runtime401['obj']('core-form', and_parser411), runtime__runtime401['make-identifier']('loop'), runtime__runtime401['obj']('core-form', loop_parser415), runtime__runtime401['make-identifier']('block'), runtime__runtime401['obj']('core-form', block_parser413), runtime__runtime401['make-identifier']('recur'), runtime__runtime401['obj']('core-form', recur_parser416));
        const match_def419 = function (form502, env503) {
            if (2 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 124', 2, arguments['length']);
            {
                var form500 = form502;
                var env501 = env503;
                while (true) {
                    if (false !== (false !== runtime__runtime401['list?'](form500) ? runtime__runtime401['equal?'](def_env_rhs417, runtime__runtime401['get'](env501, runtime__runtime401['get'](form500, 0))) : false))
                        if (false !== (false !== runtime__runtime401['='](3, runtime__runtime401['size'](form500)) ? runtime__runtime401['identifier?'](runtime__runtime401['get'](form500, 1)) : false))
                            return runtime__runtime401['obj']('id', runtime__runtime401['get'](form500, 1), 'exp', runtime__runtime401['get'](form500, 2));
                        else
                            return syntax_error403(form500);
                    else
                        return syntax_error403(form500);
                }
            }
        };
        const parse_defs420 = function (forms526, env527) {
            if (2 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 125', 2, arguments['length']);
            {
                var forms504 = forms526;
                var env505 = env527;
                while (true) {
                    const defs506 = runtime__runtime401['map'](function (f511) {
                        if (1 !== arguments['length'])
                            $runtime['raise-arity-error']('anonymous procedure 126', 1, arguments['length']);
                        {
                            var f510 = f511;
                            while (true) {
                                return match_def419(f510, env505);
                            }
                        }
                    }, forms504);
                    const surface_ids507 = runtime__runtime401['map'](function (d513) {
                        if (1 !== arguments['length'])
                            $runtime['raise-arity-error']('anonymous procedure 127', 1, arguments['length']);
                        {
                            var d512 = d513;
                            while (true) {
                                return runtime__runtime401['get'](d512, 'id');
                            }
                        }
                    }, defs506);
                    const new_env508 = runtime__runtime401['foldl'](function (env516, id517) {
                        if (2 !== arguments['length'])
                            $runtime['raise-arity-error']('anonymous procedure 128', 2, arguments['length']);
                        {
                            var env514 = env516;
                            var id515 = id517;
                            while (true) {
                                return runtime__runtime401['assoc'](env514, id515, runtime__runtime401['obj']('local-ref', gensym408(id515)));
                            }
                        }
                    }, env505, surface_ids507);
                    const rhss509 = runtime__runtime401['map'](function (d519) {
                        if (1 !== arguments['length'])
                            $runtime['raise-arity-error']('anonymous procedure 129', 1, arguments['length']);
                        {
                            var d518 = d519;
                            while (true) {
                                return parse_exp422(runtime__runtime401['get'](d518, 'exp'), new_env508);
                            }
                        }
                    }, defs506);
                    return runtime__runtime401['obj']('block-defs', runtime__runtime401['zip'](function (id522, rhs523) {
                        if (2 !== arguments['length'])
                            $runtime['raise-arity-error']('anonymous procedure 130', 2, arguments['length']);
                        {
                            var id520 = id522;
                            var rhs521 = rhs523;
                            while (true) {
                                return runtime__runtime401['obj']('id', id520, 'rhs', rhs521);
                            }
                        }
                    }, runtime__runtime401['map'](function (id525) {
                        if (1 !== arguments['length'])
                            $runtime['raise-arity-error']('anonymous procedure 131', 1, arguments['length']);
                        {
                            var id524 = id525;
                            while (true) {
                                return runtime__runtime401['get'](runtime__runtime401['get'](new_env508, id524), 'local-ref');
                            }
                        }
                    }, surface_ids507), rhss509), 'surface-def-ids', surface_ids507, 'new-env', new_env508);
                }
            }
        };
        const parse_block421 = function (forms534, env535) {
            if (2 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 132', 2, arguments['length']);
            {
                var forms528 = forms534;
                var env529 = env535;
                while (true) {
                    if (false !== runtime__runtime401['='](0, runtime__runtime401['size'](forms528)))
                        return runtime__runtime401['error']('parse', 'block must have at least one form');
                    else {
                        const reversed530 = runtime__runtime401['reverse'](forms528);
                        const parsed_defs531 = parse_defs420(runtime__runtime401['reverse'](runtime__runtime401['rest'](reversed530)), env529);
                        const new_env532 = runtime__runtime401['get'](parsed_defs531, 'new-env');
                        const parsed_ret533 = parse_exp422(runtime__runtime401['first'](reversed530), new_env532);
                        return runtime__runtime401['obj']('block-defs', runtime__runtime401['get'](parsed_defs531, 'block-defs'), 'block-ret', parsed_ret533);
                    }
                }
            }
        };
        const parse_exp422 = function (exp542, env543) {
            if (2 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 133', 2, arguments['length']);
            {
                var exp536 = exp542;
                var env537 = env543;
                while (true) {
                    if (false !== function () {
                            const tmp538 = runtime__runtime401['number?'](exp536);
                            if (false !== tmp538)
                                return tmp538;
                            else
                                return runtime__runtime401['string?'](exp536);
                        }())
                        return runtime__runtime401['obj']('literal', exp536);
                    else if (false !== runtime__runtime401['identifier?'](exp536))
                        if (false !== runtime__runtime401['not'](runtime__runtime401['has'](env537, exp536)))
                            return unbound_reference_error404(exp536);
                        else {
                            const env_entry539 = runtime__runtime401['get'](env537, exp536);
                            if (false !== function () {
                                    const tmp540 = runtime__runtime401['has'](env_entry539, 'local-ref');
                                    if (false !== tmp540)
                                        return tmp540;
                                    else
                                        return runtime__runtime401['has'](env_entry539, 'module-ref-sym');
                                }())
                                return env_entry539;
                            else if (false !== runtime__runtime401['has'](env_entry539, 'core-form'))
                                return syntax_error403(exp536);
                            else
                                return runtime__runtime401['error']('parse-exp internal error', 'malformed environment');
                        }
                    else {
                        const rator541 = runtime__runtime401['get'](exp536, 0);
                        if (false !== (false !== (false !== runtime__runtime401['identifier?'](rator541) ? runtime__runtime401['has'](env537, rator541) : false) ? runtime__runtime401['has'](runtime__runtime401['get'](env537, rator541), 'core-form') : false))
                            return runtime__runtime401['get'](runtime__runtime401['get'](env537, rator541), 'core-form')(exp536, env537);
                        else
                            return app_parser409(exp536, env537);
                    }
                }
            }
        };
        const andmap423 = function (f550, l551) {
            if (2 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 134', 2, arguments['length']);
            {
                var f544 = f550;
                var l545 = l551;
                while (true) {
                    return runtime__runtime401['foldl'](function (a548, b549) {
                        if (2 !== arguments['length'])
                            $runtime['raise-arity-error']('anonymous procedure 135', 2, arguments['length']);
                        {
                            var a546 = a548;
                            var b547 = b549;
                            while (true) {
                                if (false !== a546)
                                    return b547;
                                else
                                    return false;
                            }
                        }
                    }, runtime__runtime401['true'], runtime__runtime401['map'](f544, l545));
                }
            }
        };
        const parse_module424 = function (sexp590, runner591) {
            if (2 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 136', 2, arguments['length']);
            {
                var sexp552 = sexp590;
                var runner553 = runner591;
                while (true) {
                    const module_syntax_error554 = function () {
                        if (0 !== arguments['length'])
                            $runtime['raise-arity-error']('anonymous procedure 137', 0, arguments['length']);
                        {
                            while (true) {
                                return runtime__runtime401['error']('syntax error', 'module must start with require and provide forms');
                            }
                        }
                    };
                    const _555 = false !== runtime__runtime401['not'](runtime__runtime401['list?'](sexp552)) ? module_syntax_error554() : runtime__runtime401['null'];
                    const valid_reqprov_huh_556 = function (form571, name572) {
                        if (2 !== arguments['length'])
                            $runtime['raise-arity-error']('anonymous procedure 138', 2, arguments['length']);
                        {
                            var form569 = form571;
                            var name570 = name572;
                            while (true) {
                                if (false !== (false !== runtime__runtime401['list?'](form569) ? runtime__runtime401['>'](runtime__runtime401['size'](form569), 0) : false))
                                    if (false !== runtime__runtime401['equal?'](runtime__runtime401['get'](form569, 0), runtime__runtime401['make-identifier'](name570)))
                                        return andmap423(runtime__runtime401['identifier?'], runtime__runtime401['rest'](form569));
                                    else
                                        return false;
                                else
                                    return false;
                            }
                        }
                    };
                    const require_form557 = runtime__runtime401['get'](sexp552, 0);
                    const _2558 = false !== runtime__runtime401['not'](valid_reqprov_huh_556(require_form557, 'require')) ? module_syntax_error554() : runtime__runtime401['null'];
                    const provide_form559 = runtime__runtime401['get'](sexp552, 1);
                    const _3560 = false !== runtime__runtime401['not'](valid_reqprov_huh_556(provide_form559, 'provide')) ? module_syntax_error554() : runtime__runtime401['null'];
                    const requires561 = runtime__runtime401['rest'](require_form557);
                    const provides562 = runtime__runtime401['rest'](provide_form559);
                    const body563 = runtime__runtime401['rest'](runtime__runtime401['rest'](sexp552));
                    const module_bindings564 = runtime__runtime401['foldl'](function (table575, name576) {
                        if (2 !== arguments['length'])
                            $runtime['raise-arity-error']('anonymous procedure 139', 2, arguments['length']);
                        {
                            var table573 = table575;
                            var name574 = name576;
                            while (true) {
                                return runtime__runtime401['assoc'](table573, name574, gensym408(name574));
                            }
                        }
                    }, runtime__runtime401['hash'](), requires561);
                    const module_env565 = runtime__runtime401['foldl'](function (env584, req585) {
                        if (2 !== arguments['length'])
                            $runtime['raise-arity-error']('anonymous procedure 140', 2, arguments['length']);
                        {
                            var env577 = env584;
                            var req578 = req585;
                            while (true) {
                                const decl579 = runtime__runtime401['get'](runner553, 'load')(runtime__runtime401['identifier-string'](req578));
                                return runtime__runtime401['foldl'](function (env582, name583) {
                                    if (2 !== arguments['length'])
                                        $runtime['raise-arity-error']('anonymous procedure 141', 2, arguments['length']);
                                    {
                                        var env580 = env582;
                                        var name581 = name583;
                                        while (true) {
                                            return runtime__runtime401['assoc'](env580, runtime__runtime401['make-identifier'](name581), runtime__runtime401['obj']('module-ref-sym', runtime__runtime401['get'](module_bindings564, req578), 'module-ref-field', name581));
                                        }
                                    }
                                }, env577, runtime__runtime401['get'](decl579, 'exports'));
                            }
                        }
                    }, initial_env418, requires561);
                    const parsed_defs566 = parse_defs420(body563, module_env565);
                    const _4567 = false !== runtime__runtime401['not'](runtime__runtime401['subset'](provides562, runtime__runtime401['get'](parsed_defs566, 'surface-def-ids'))) ? runtime__runtime401['error']('syntax error', 'some provided identifiers not defined') : runtime__runtime401['null'];
                    const provide_internal_ids568 = runtime__runtime401['map'](function (p587) {
                        if (1 !== arguments['length'])
                            $runtime['raise-arity-error']('anonymous procedure 142', 1, arguments['length']);
                        {
                            var p586 = p587;
                            while (true) {
                                return runtime__runtime401['get'](runtime__runtime401['get'](runtime__runtime401['get'](parsed_defs566, 'new-env'), p586), 'local-ref');
                            }
                        }
                    }, provides562);
                    return runtime__runtime401['obj']('module-requires', runtime__runtime401['map'](runtime__runtime401['identifier-string'], requires561), 'module-require-internal-ids', runtime__runtime401['map'](function (r589) {
                        if (1 !== arguments['length'])
                            $runtime['raise-arity-error']('anonymous procedure 143', 1, arguments['length']);
                        {
                            var r588 = r589;
                            while (true) {
                                return runtime__runtime401['get'](module_bindings564, r588);
                            }
                        }
                    }, requires561), 'module-provides', runtime__runtime401['map'](runtime__runtime401['identifier-string'], provides562), 'module-provide-internal-ids', provide_internal_ids568, 'block-defs', runtime__runtime401['get'](parsed_defs566, 'block-defs'));
                }
            }
        };
        return {
            'parse-module': parse_module424,
            'transform-reserved': transform_reserved406
        };
    }))(runtime__minimal, runtime__runtime, compile__reader);
    const lang__a = ((function ($runtime, compile__reader240, compile__compile241, compile__parse242) {
        const compile_a592 = function (input596, runner597) {
            if (2 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 144', 2, arguments['length']);
            {
                var input594 = input596;
                var runner595 = runner597;
                while (true) {
                    return compile__compile241['compile-module'](compile__parse242['parse-module'](compile__reader240['read'](input594), runner595));
                }
            }
        };
        const compile_language593 = compile_a592;
        return {
            'compile-a': compile_a592,
            'compile-language': compile_language593
        };
    }))(runtime__minimal, compile__reader, compile__compile, compile__parse);
    const compile__lang = ((function ($runtime, runtime__runtime2, lang__js3, lang__a4, compile__parser_tools5) {
        const compile_via_lang598 = function (source605, runner606) {
            if (2 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 145', 2, arguments['length']);
            {
                var source599 = source605;
                var runner600 = runner606;
                while (true) {
                    const res601 = compile__parser_tools5['parse'](compile__parser_tools5['seq'](compile__parser_tools5['string/p']('#lang'), compile__parser_tools5['c'](' '), compile__parser_tools5['module-name'], compile__parser_tools5['c'](runtime__runtime2['newline'])), source599);
                    if (false !== (false !== runtime__runtime2['get'](res601, 'position') ? runtime__runtime2['<='](runtime__runtime2['get'](runtime__runtime2['get'](res601, 'position'), 'index'), runtime__runtime2['size'](runtime__runtime2['get'](source599, 'string'))) : false)) {
                        const lang602 = runtime__runtime2['get'](res601, 'result');
                        if (false !== runtime__runtime2['equal?']('js', lang602))
                            return lang__js3['compile-js'](runtime__runtime2['get'](res601, 'position'), runner600);
                        else if (false !== runtime__runtime2['equal?']('a', lang602))
                            return lang__a4['compile-a'](runtime__runtime2['get'](res601, 'position'), runner600);
                        else {
                            const lang_mod_inst603 = runtime__runtime2['get'](runner600, 'run')(lang602);
                            const _604 = false !== runtime__runtime2['not'](runtime__runtime2['has'](lang_mod_inst603, 'compile-language')) ? runtime__runtime2['error']('compile-via-lang', '#lang module does not implement compile-language') : runtime__runtime2['null'];
                            return runtime__runtime2['get'](lang_mod_inst603, 'compile-language')(runtime__runtime2['get'](res601, 'position'), runner600);
                        }
                    } else
                        return runtime__runtime2['error']('compile-via-lang', res601);
                }
            }
        };
        return { 'compile-via-lang': compile_via_lang598 };
    }))(runtime__minimal, runtime__runtime, lang__js, lang__a, compile__parser_tools);
    const compile__runner = ((function ($runtime, runtime__runtime0, compile__lang1) {
        const make_runner607 = function (platform643) {
            if (1 !== arguments['length'])
                $runtime['raise-arity-error']('anonymous procedure 146', 1, arguments['length']);
            {
                var platform608 = platform643;
                while (true) {
                    const declaration_cache609 = runtime__runtime0['box'](runtime__runtime0['hash']());
                    const load610 = function (module_name618) {
                        if (1 !== arguments['length'])
                            $runtime['raise-arity-error']('anonymous procedure 147', 1, arguments['length']);
                        {
                            var module_name613 = module_name618;
                            while (true) {
                                if (false !== runtime__runtime0['has'](runtime__runtime0['unbox'](declaration_cache609), module_name613))
                                    return runtime__runtime0['get'](runtime__runtime0['unbox'](declaration_cache609), module_name613);
                                else {
                                    const source614 = runtime__runtime0['get'](platform608, 'resolve')(module_name613);
                                    const module_declaration615 = compile__lang1['compile-via-lang'](source614, runtime__runtime0['obj']('load', load610, 'run', run612));
                                    const module_declaration2616 = runtime__runtime0['assoc'](module_declaration615, 'body-function', runtime__runtime0['get'](platform608, 'eval-module')(runtime__runtime0['get'](module_declaration615, 'body-code')));
                                    const _617 = runtime__runtime0['set-box!'](declaration_cache609, runtime__runtime0['assoc'](runtime__runtime0['unbox'](declaration_cache609), module_name613, module_declaration2616));
                                    return module_declaration2616;
                                }
                            }
                        }
                    };
                    const andmap611 = function (f625, l626) {
                        if (2 !== arguments['length'])
                            $runtime['raise-arity-error']('anonymous procedure 148', 2, arguments['length']);
                        {
                            var f619 = f625;
                            var l620 = l626;
                            while (true) {
                                return runtime__runtime0['foldl'](function (a623, b624) {
                                    if (2 !== arguments['length'])
                                        $runtime['raise-arity-error']('anonymous procedure 149', 2, arguments['length']);
                                    {
                                        var a621 = a623;
                                        var b622 = b624;
                                        while (true) {
                                            if (false !== a621)
                                                return b622;
                                            else
                                                return false;
                                        }
                                    }
                                }, runtime__runtime0['true'], runtime__runtime0['map'](f619, l620));
                            }
                        }
                    };
                    const run612 = function (module_name642) {
                        if (1 !== arguments['length'])
                            $runtime['raise-arity-error']('anonymous procedure 150', 1, arguments['length']);
                        {
                            var module_name627 = module_name642;
                            while (true) {
                                const _628 = runtime__runtime0['string/c']('run', module_name627);
                                const run_module_internal629 = function (instance_map640, module_name641) {
                                    if (2 !== arguments['length'])
                                        $runtime['raise-arity-error']('anonymous procedure 151', 2, arguments['length']);
                                    {
                                        var instance_map630 = instance_map640;
                                        var module_name631 = module_name641;
                                        while (true) {
                                            if (false !== runtime__runtime0['has'](instance_map630, module_name631))
                                                return instance_map630;
                                            else {
                                                const module_declaration632 = load610(module_name631);
                                                const instance_map2633 = runtime__runtime0['foldl'](run_module_internal629, instance_map630, runtime__runtime0['get'](module_declaration632, 'imports'));
                                                const instance634 = runtime__runtime0['apply'](runtime__runtime0['get'](module_declaration632, 'body-function'), runtime__runtime0['map'](function (i637) {
                                                    if (1 !== arguments['length'])
                                                        $runtime['raise-arity-error']('anonymous procedure 152', 1, arguments['length']);
                                                    {
                                                        var i636 = i637;
                                                        while (true) {
                                                            return runtime__runtime0['get'](instance_map2633, i636);
                                                        }
                                                    }
                                                }, runtime__runtime0['get'](module_declaration632, 'imports')));
                                                const _635 = false !== runtime__runtime0['not'](andmap611(function (export639) {
                                                    if (1 !== arguments['length'])
                                                        $runtime['raise-arity-error']('anonymous procedure 153', 1, arguments['length']);
                                                    {
                                                        var export638 = export639;
                                                        while (true) {
                                                            return runtime__runtime0['has'](instance634, export638);
                                                        }
                                                    }
                                                }, runtime__runtime0['get'](module_declaration632, 'exports'))) ? runtime__runtime0['error']('run', runtime__runtime0['string-append']('Module instance does not include all keys listed in exports: ', module_name631)) : runtime__runtime0['null'];
                                                return runtime__runtime0['assoc'](instance_map2633, module_name631, instance634);
                                            }
                                        }
                                    }
                                };
                                return runtime__runtime0['get'](run_module_internal629(runtime__runtime0['hash'](), module_name627), module_name627);
                            }
                        }
                    };
                    return runtime__runtime0['obj']('load', load610, 'run', run612);
                }
            }
        };
        return { 'make-runner': make_runner607 };
    }))(runtime__minimal, runtime__runtime, compile__lang);
    const node__platform = ((function () {
        const fs = require("fs")
        const vm = require("vm");
    
        function resolve(name) {
            const filename = "modules/" + name + ".js";
            const text = fs.readFileSync("modules/" + name + ".js").toString();
    
            return {
                string: text,
                source: filename,
                index: 0,
                srcpos: {line: 1, column: 0}
            };
        }
    
        function eval_module(text) {
            return vm.runInNewContext(text, {setImmediate: setImmediate, console: console, require: require, process: process});
        }
    
        return { resolve: resolve,
                 "eval-module": eval_module }
    })
    )();
    const node__cli = ((function (runner, nodeplatform) {
        function usage() {
            console.log("Usage: node run.js <module-name> <function>");
            process.exit(1);
        }
    
        function main(args) {
            if (args.length >= 2) {
                const module_instance = runner["make-runner"](nodeplatform).run(args[0]);
                module_instance[args[1]](args.slice(2));
            } else {
                usage();
            }
        }
    
        return { main: main };
    })
    )(compile__runner, node__platform);
    return node__cli;
});