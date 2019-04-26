"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var extend_1 = require("@interactjs/utils/extend");
var getOriginXY_1 = require("@interactjs/utils/getOriginXY");
var hypot_1 = require("@interactjs/utils/hypot");
var BaseEvent_1 = require("./BaseEvent");
var defaultOptions_1 = require("./defaultOptions");
var EventPhase;
(function (EventPhase) {
    EventPhase["Start"] = "start";
    EventPhase["Move"] = "move";
    EventPhase["End"] = "end";
    EventPhase["_NONE"] = "";
})(EventPhase = exports.EventPhase || (exports.EventPhase = {}));
var InteractEvent = /** @class */ (function (_super) {
    __extends(InteractEvent, _super);
    /** */
    function InteractEvent(interaction, event, actionName, phase, element, related, preEnd, type) {
        var _this = _super.call(this, interaction) || this;
        element = element || interaction.element;
        var target = interaction.interactable;
        // FIXME: add deltaSource to defaults
        var deltaSource = ((target && target.options) || defaultOptions_1["default"]).deltaSource;
        var origin = getOriginXY_1["default"](target, element, actionName);
        var starting = phase === 'start';
        var ending = phase === 'end';
        var prevEvent = starting ? _this : interaction.prevEvent;
        var coords = starting
            ? interaction.coords.start
            : ending
                ? { page: prevEvent.page, client: prevEvent.client, timeStamp: interaction.coords.cur.timeStamp }
                : interaction.coords.cur;
        _this.page = extend_1["default"]({}, coords.page);
        _this.client = extend_1["default"]({}, coords.client);
        _this.rect = extend_1["default"]({}, interaction.rect);
        _this.timeStamp = coords.timeStamp;
        if (!ending) {
            _this.page.x -= origin.x;
            _this.page.y -= origin.y;
            _this.client.x -= origin.x;
            _this.client.y -= origin.y;
        }
        _this.ctrlKey = event.ctrlKey;
        _this.altKey = event.altKey;
        _this.shiftKey = event.shiftKey;
        _this.metaKey = event.metaKey;
        _this.button = event.button;
        _this.buttons = event.buttons;
        _this.target = element;
        _this.currentTarget = element;
        _this.relatedTarget = related || null;
        _this.preEnd = preEnd;
        _this.type = type || (actionName + (phase || ''));
        _this.interactable = target;
        _this.t0 = starting
            ? interaction.pointers[interaction.pointers.length - 1].downTime
            : prevEvent.t0;
        _this.x0 = interaction.coords.start.page.x - origin.x;
        _this.y0 = interaction.coords.start.page.y - origin.y;
        _this.clientX0 = interaction.coords.start.client.x - origin.x;
        _this.clientY0 = interaction.coords.start.client.y - origin.y;
        if (starting || ending) {
            _this.delta = { x: 0, y: 0 };
        }
        else {
            _this.delta = {
                x: _this[deltaSource].x - prevEvent[deltaSource].x,
                y: _this[deltaSource].y - prevEvent[deltaSource].y
            };
        }
        _this.dt = interaction.coords.delta.timeStamp;
        _this.duration = _this.timeStamp - _this.t0;
        // velocity and speed in pixels per second
        _this.velocity = extend_1["default"]({}, interaction.coords.velocity[deltaSource]);
        _this.speed = hypot_1["default"](_this.velocity.x, _this.velocity.y);
        _this.swipe = (ending || phase === 'inertiastart') ? _this.getSwipe() : null;
        return _this;
    }
    Object.defineProperty(InteractEvent.prototype, "pageX", {
        get: function () { return this.page.x; },
        set: function (value) { this.page.x = value; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(InteractEvent.prototype, "pageY", {
        get: function () { return this.page.y; },
        set: function (value) { this.page.y = value; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(InteractEvent.prototype, "clientX", {
        get: function () { return this.client.x; },
        set: function (value) { this.client.x = value; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(InteractEvent.prototype, "clientY", {
        get: function () { return this.client.y; },
        set: function (value) { this.client.y = value; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(InteractEvent.prototype, "dx", {
        get: function () { return this.delta.x; },
        set: function (value) { this.delta.x = value; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(InteractEvent.prototype, "dy", {
        get: function () { return this.delta.y; },
        set: function (value) { this.delta.y = value; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(InteractEvent.prototype, "velocityX", {
        get: function () { return this.velocity.x; },
        set: function (value) { this.velocity.x = value; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(InteractEvent.prototype, "velocityY", {
        get: function () { return this.velocity.y; },
        set: function (value) { this.velocity.y = value; },
        enumerable: true,
        configurable: true
    });
    InteractEvent.prototype.getSwipe = function () {
        var interaction = this._interaction;
        if (interaction.prevEvent.speed < 600 ||
            this.timeStamp - interaction.prevEvent.timeStamp > 150) {
            return null;
        }
        var angle = 180 * Math.atan2(interaction.prevEvent.velocityY, interaction.prevEvent.velocityX) / Math.PI;
        var overlap = 22.5;
        if (angle < 0) {
            angle += 360;
        }
        var left = 135 - overlap <= angle && angle < 225 + overlap;
        var up = 225 - overlap <= angle && angle < 315 + overlap;
        var right = !left && (315 - overlap <= angle || angle < 45 + overlap);
        var down = !up && 45 - overlap <= angle && angle < 135 + overlap;
        return {
            up: up,
            down: down,
            left: left,
            right: right,
            angle: angle,
            speed: interaction.prevEvent.speed,
            velocity: {
                x: interaction.prevEvent.velocityX,
                y: interaction.prevEvent.velocityY
            }
        };
    };
    InteractEvent.prototype.preventDefault = function () { };
    /**
     * Don't call listeners on the remaining targets
     */
    InteractEvent.prototype.stopImmediatePropagation = function () {
        this.immediatePropagationStopped = this.propagationStopped = true;
    };
    /**
     * Don't call any other listeners (even on the current target)
     */
    InteractEvent.prototype.stopPropagation = function () {
        this.propagationStopped = true;
    };
    return InteractEvent;
}(BaseEvent_1["default"]));
exports.InteractEvent = InteractEvent;
exports["default"] = InteractEvent;
