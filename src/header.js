/**
*   CanvasLite
*   an html canvas implementation in pure JavaScript
*
*   @version @@VERSION@@ (@@DATE@@)
*   https://github.com/foo123/CanvasLite
*
**/
!function(root, name, factory) {
"use strict";
if (('object' === typeof module) && module.exports) /* CommonJS */
    module.exports = factory.call(root);
else if (('function' === typeof define) && define.amd && ('function' === typeof require) && ('function' === typeof require.specified) && require.specified(name) /*&& !require.defined(name)*/) /* AMD */
    define(name, ['module'], function(module) {return factory.call(root);});
else if (!(name in root)) /* Browser/WebWorker/.. */
    (root[name] = factory.call(root)||1) && ('function' === typeof(define)) && define.amd && define(function() {return root[name];});
}(  /* current root */          'undefined' !== typeof self ? self : this,
    /* module name */           "CanvasLite",
    /* module factory */        function ModuleFactory__CanvasLite(undef) {
"use strict";

var PROTO = 'prototype',
    def = Object.defineProperty,
    HAS = Object[PROTO].hasOwnProperty,
    toString = Object[PROTO].toString,
    isNode = ("undefined" !== typeof global) && ("[object global]" === toString.call(global)),
    isBrowser = ("undefined" !== typeof window) && ("[object Window]" === toString.call(window)),
    stdMath = Math, INF = Infinity, sqrt2 = stdMath.sqrt(2),
    is_nan = isNaN, is_finite = isFinite,
    PI = stdMath.PI, TWO_PI = 2*PI, HALF_PI = PI/2,
    NUM_POINTS = 6, MIN_LEN = sqrt2, PIXEL_SIZE = 0.5, EPS = 1e-6,
    ImArray = 'undefined' !== typeof Uint8ClampedArray ? Uint8ClampedArray : ('undefined' !== typeof Uint8Array ? Uint8Array : Array),
    BLANK = [0, 0, 0, 0],
    COMMAND = /[MLHVCSQTAZ]/gi,
    NUMBER = /-?(?:(?:\d+\.\d+)|(?:\.\d+)|(?:\d+))/g
;

