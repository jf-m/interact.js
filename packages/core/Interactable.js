"use strict";
exports.__esModule = true;
var arr = require("@interactjs/utils/arr");
var browser_1 = require("@interactjs/utils/browser");
var clone_1 = require("@interactjs/utils/clone");
var domUtils_1 = require("@interactjs/utils/domUtils");
var events_1 = require("@interactjs/utils/events");
var extend_1 = require("@interactjs/utils/extend");
var is = require("@interactjs/utils/is");
var normalizeListeners_1 = require("@interactjs/utils/normalizeListeners");
var window_1 = require("@interactjs/utils/window");
var Eventable_1 = require("./Eventable");
/** */
var Interactable = /** @class */ (function () {
    /** */
    function Interactable(target, options, defaultContext) {
        this.events = new Eventable_1["default"]();
        this._actions = options.actions;
        this.target = target;
        this._context = options.context || defaultContext;
        this._win = window_1.getWindow(domUtils_1.trySelector(target) ? this._context : target);
        this._doc = this._win.document;
        this.set(options);
    }
    Object.defineProperty(Interactable.prototype, "_defaults", {
        get: function () {
            return {
                base: {},
                perAction: {},
                actions: {}
            };
        },
        enumerable: true,
        configurable: true
    });
    Interactable.prototype.setOnEvents = function (actionName, phases) {
        if (is.func(phases.onstart)) {
            this.on(actionName + "start", phases.onstart);
        }
        if (is.func(phases.onmove)) {
            this.on(actionName + "move", phases.onmove);
        }
        if (is.func(phases.onend)) {
            this.on(actionName + "end", phases.onend);
        }
        if (is.func(phases.oninertiastart)) {
            this.on(actionName + "inertiastart", phases.oninertiastart);
        }
        return this;
    };
    Interactable.prototype.updatePerActionListeners = function (actionName, prev, cur) {
        if (is.array(prev) || is.object(prev)) {
            this.off(actionName, prev);
        }
        if (is.array(cur) || is.object(cur)) {
            this.on(actionName, cur);
        }
    };
    Interactable.prototype.setPerAction = function (actionName, options) {
        var defaults = this._defaults;
        // for all the default per-action options
        for (var optionName in options) {
            var actionOptions = this.options[actionName];
            var optionValue = options[optionName];
            var isArray = is.array(optionValue);
            // remove old event listeners and add new ones
            if (optionName === 'listeners') {
                this.updatePerActionListeners(actionName, actionOptions.listeners, optionValue);
            }
            // if the option value is an array
            if (isArray) {
                actionOptions[optionName] = arr.from(optionValue);
            }
            // if the option value is an object
            else if (!isArray && is.plainObject(optionValue)) {
                // copy the object
                actionOptions[optionName] = extend_1["default"](actionOptions[optionName] || {}, clone_1["default"](optionValue));
                // set anabled field to true if it exists in the defaults
                if (is.object(defaults.perAction[optionName]) && 'enabled' in defaults.perAction[optionName]) {
                    actionOptions[optionName].enabled = optionValue.enabled !== false;
                }
            }
            // if the option value is a boolean and the default is an object
            else if (is.bool(optionValue) && is.object(defaults.perAction[optionName])) {
                actionOptions[optionName].enabled = optionValue;
            }
            // if it's anything else, do a plain assignment
            else {
                actionOptions[optionName] = optionValue;
            }
        }
    };
    /**
     * The default function to get an Interactables bounding rect. Can be
     * overridden using {@link Interactable.rectChecker}.
     *
     * @param {Element} [element] The element to measure.
     * @return {object} The object's bounding rectangle.
     */
    Interactable.prototype.getRect = function (element) {
        element = element || (is.element(this.target)
            ? this.target
            : null);
        if (is.string(this.target)) {
            element = element || this._context.querySelector(this.target);
        }
        return domUtils_1.getElementRect(element);
    };
    /**
     * Returns or sets the function used to calculate the interactable's
     * element's rectangle
     *
     * @param {function} [checker] A function which returns this Interactable's
     * bounding rectangle. See {@link Interactable.getRect}
     * @return {function | object} The checker function or this Interactable
     */
    Interactable.prototype.rectChecker = function (checker) {
        if (is.func(checker)) {
            this.getRect = checker;
            return this;
        }
        if (checker === null) {
            delete this.getRect;
            return this;
        }
        return this.getRect;
    };
    Interactable.prototype._backCompatOption = function (optionName, newValue) {
        if (domUtils_1.trySelector(newValue) || is.object(newValue)) {
            this.options[optionName] = newValue;
            for (var _i = 0, _a = this._actions.names; _i < _a.length; _i++) {
                var action = _a[_i];
                this.options[action][optionName] = newValue;
            }
            return this;
        }
        return this.options[optionName];
    };
    /**
     * Gets or sets the origin of the Interactable's element.  The x and y
     * of the origin will be subtracted from action event coordinates.
     *
     * @param {Element | object | string} [origin] An HTML or SVG Element whose
     * rect will be used, an object eg. { x: 0, y: 0 } or string 'parent', 'self'
     * or any CSS selector
     *
     * @return {object} The current origin or this Interactable
     */
    Interactable.prototype.origin = function (newValue) {
        return this._backCompatOption('origin', newValue);
    };
    /**
     * Returns or sets the mouse coordinate types used to calculate the
     * movement of the pointer.
     *
     * @param {string} [newValue] Use 'client' if you will be scrolling while
     * interacting; Use 'page' if you want autoScroll to work
     * @return {string | object} The current deltaSource or this Interactable
     */
    Interactable.prototype.deltaSource = function (newValue) {
        if (newValue === 'page' || newValue === 'client') {
            this.options.deltaSource = newValue;
            return this;
        }
        return this.options.deltaSource;
    };
    /**
     * Gets the selector context Node of the Interactable. The default is
     * `window.document`.
     *
     * @return {Node} The context Node of this Interactable
     */
    Interactable.prototype.context = function () {
        return this._context;
    };
    Interactable.prototype.inContext = function (element) {
        return (this._context === element.ownerDocument ||
            domUtils_1.nodeContains(this._context, element));
    };
    Interactable.prototype.testIgnoreAllow = function (options, interactableElement, eventTarget) {
        return (!this.testIgnore(options.ignoreFrom, interactableElement, eventTarget) &&
            this.testAllow(options.allowFrom, interactableElement, eventTarget));
    };
    Interactable.prototype.testAllow = function (allowFrom, interactableElement, element) {
        if (!allowFrom) {
            return true;
        }
        if (!is.element(element)) {
            return false;
        }
        if (is.string(allowFrom)) {
            return domUtils_1.matchesUpTo(element, allowFrom, interactableElement);
        }
        else if (is.element(allowFrom)) {
            return domUtils_1.nodeContains(allowFrom, element);
        }
        return false;
    };
    Interactable.prototype.testIgnore = function (ignoreFrom, interactableElement, element) {
        if (!ignoreFrom || !is.element(element)) {
            return false;
        }
        if (is.string(ignoreFrom)) {
            return domUtils_1.matchesUpTo(element, ignoreFrom, interactableElement);
        }
        else if (is.element(ignoreFrom)) {
            return domUtils_1.nodeContains(ignoreFrom, element);
        }
        return false;
    };
    /**
     * Calls listeners for the given InteractEvent type bound globally
     * and directly to this Interactable
     *
     * @param {InteractEvent} iEvent The InteractEvent object to be fired on this
     * Interactable
     * @return {Interactable} this Interactable
     */
    Interactable.prototype.fire = function (iEvent) {
        this.events.fire(iEvent);
        return this;
    };
    Interactable.prototype._onOff = function (method, typeArg, listenerArg, options) {
        if (is.object(typeArg) && !is.array(typeArg)) {
            options = listenerArg;
            listenerArg = null;
        }
        var addRemove = method === 'on' ? 'add' : 'remove';
        var listeners = normalizeListeners_1["default"](typeArg, listenerArg);
        for (var type in listeners) {
            if (type === 'wheel') {
                type = browser_1["default"].wheelEvent;
            }
            for (var _i = 0, _a = listeners[type]; _i < _a.length; _i++) {
                var listener = _a[_i];
                // if it is an action event type
                if (arr.contains(this._actions.eventTypes, type)) {
                    this.events[method](type, listener);
                }
                // delegated event
                else if (is.string(this.target)) {
                    events_1["default"][addRemove + "Delegate"](this.target, this._context, type, listener, options);
                }
                // remove listener from this Interatable's element
                else {
                    events_1["default"][addRemove](this.target, type, listener, options);
                }
            }
        }
        return this;
    };
    /**
     * Binds a listener for an InteractEvent, pointerEvent or DOM event.
     *
     * @param {string | array | object} types The types of events to listen
     * for
     * @param {function | array | object} [listener] The event listener function(s)
     * @param {object | boolean} [options] options object or useCapture flag for
     * addEventListener
     * @return {Interactable} This Interactable
     */
    Interactable.prototype.on = function (types, listener, options) {
        return this._onOff('on', types, listener, options);
    };
    /**
     * Removes an InteractEvent, pointerEvent or DOM event listener.
     *
     * @param {string | array | object} types The types of events that were
     * listened for
     * @param {function | array | object} [listener] The event listener function(s)
     * @param {object | boolean} [options] options object or useCapture flag for
     * removeEventListener
     * @return {Interactable} This Interactable
     */
    Interactable.prototype.off = function (types, listener, options) {
        return this._onOff('off', types, listener, options);
    };
    /**
     * Reset the options of this Interactable
     *
     * @param {object} options The new settings to apply
     * @return {object} This Interactable
     */
    Interactable.prototype.set = function (options) {
        var defaults = this._defaults;
        if (!is.object(options)) {
            options = {};
        }
        this.options = clone_1["default"](defaults.base);
        for (var actionName in this._actions.methodDict) {
            var methodName = this._actions.methodDict[actionName];
            this.options[actionName] = {};
            this.setPerAction(actionName, extend_1["default"](extend_1["default"]({}, defaults.perAction), defaults.actions[actionName]));
            this[methodName](options[actionName]);
        }
        for (var setting in options) {
            if (is.func(this[setting])) {
                this[setting](options[setting]);
            }
        }
        return this;
    };
    /**
     * Remove this interactable from the list of interactables and remove it's
     * action capabilities and event listeners
     *
     * @return {interact}
     */
    Interactable.prototype.unset = function () {
        events_1["default"].remove(this.target, 'all');
        if (is.string(this.target)) {
            // remove delegated events
            for (var type in events_1["default"].delegatedEvents) {
                var delegated = events_1["default"].delegatedEvents[type];
                if (delegated.selectors[0] === this.target &&
                    delegated.contexts[0] === this._context) {
                    delegated.selectors.splice(0, 1);
                    delegated.contexts.splice(0, 1);
                    delegated.listeners.splice(0, 1);
                    // remove the arrays if they are empty
                    if (!delegated.selectors.length) {
                        delegated[type] = null;
                    }
                }
                events_1["default"].remove(this._context, type, events_1["default"].delegateListener);
                events_1["default"].remove(this._context, type, events_1["default"].delegateUseCapture, true);
            }
        }
        else {
            events_1["default"].remove(this.target, 'all');
        }
    };
    return Interactable;
}());
exports.Interactable = Interactable;
exports["default"] = Interactable;
