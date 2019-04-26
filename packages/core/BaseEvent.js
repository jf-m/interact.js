"use strict";
exports.__esModule = true;
var EventPhase;
(function (EventPhase) {
    EventPhase["Start"] = "start";
    EventPhase["Move"] = "move";
    EventPhase["End"] = "end";
    EventPhase["_NONE"] = "";
})(EventPhase = exports.EventPhase || (exports.EventPhase = {}));
var BaseEvent = /** @class */ (function () {
    function BaseEvent(interaction) {
        this.immediatePropagationStopped = false;
        this.propagationStopped = false;
        this._interaction = interaction;
    }
    Object.defineProperty(BaseEvent.prototype, "interaction", {
        get: function () {
            return this._interaction._proxy;
        },
        enumerable: true,
        configurable: true
    });
    BaseEvent.prototype.preventDefault = function () { };
    /**
     * Don't call any other listeners (even on the current target)
     */
    BaseEvent.prototype.stopPropagation = function () {
        this.propagationStopped = true;
    };
    /**
     * Don't call listeners on the remaining targets
     */
    BaseEvent.prototype.stopImmediatePropagation = function () {
        this.immediatePropagationStopped = this.propagationStopped = true;
    };
    return BaseEvent;
}());
exports.BaseEvent = BaseEvent;
exports["default"] = BaseEvent;
