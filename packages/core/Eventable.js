"use strict";
exports.__esModule = true;
var arr = require("@interactjs/utils/arr");
var extend_1 = require("@interactjs/utils/extend");
var normalizeListeners_1 = require("@interactjs/utils/normalizeListeners");
function fireUntilImmediateStopped(event, listeners) {
    for (var _i = 0, listeners_1 = listeners; _i < listeners_1.length; _i++) {
        var listener = listeners_1[_i];
        if (event.immediatePropagationStopped) {
            break;
        }
        listener(event);
    }
}
var Eventable = /** @class */ (function () {
    function Eventable(options) {
        this.types = {};
        this.propagationStopped = false;
        this.immediatePropagationStopped = false;
        this.options = extend_1["default"]({}, options || {});
    }
    Eventable.prototype.fire = function (event) {
        var listeners;
        var global = this.global;
        // Interactable#on() listeners
        // tslint:disable no-conditional-assignment
        if ((listeners = this.types[event.type])) {
            fireUntilImmediateStopped(event, listeners);
        }
        // interact.on() listeners
        if (!event.propagationStopped && global && (listeners = global[event.type])) {
            fireUntilImmediateStopped(event, listeners);
        }
    };
    Eventable.prototype.on = function (type, listener) {
        var listeners = normalizeListeners_1["default"](type, listener);
        for (type in listeners) {
            this.types[type] = arr.merge(this.types[type] || [], listeners[type]);
        }
    };
    Eventable.prototype.off = function (type, listener) {
        var listeners = normalizeListeners_1["default"](type, listener);
        for (type in listeners) {
            var eventList = this.types[type];
            if (!eventList || !eventList.length) {
                continue;
            }
            for (var _i = 0, _a = listeners[type]; _i < _a.length; _i++) {
                var subListener = _a[_i];
                var index = eventList.indexOf(subListener);
                if (index !== -1) {
                    eventList.splice(index, 1);
                }
            }
        }
    };
    return Eventable;
}());
exports["default"] = Eventable;
