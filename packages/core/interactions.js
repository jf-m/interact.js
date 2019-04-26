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
var browser_1 = require("@interactjs/utils/browser");
var domObjects_1 = require("@interactjs/utils/domObjects");
var events_1 = require("@interactjs/utils/events");
var pointerUtils_1 = require("@interactjs/utils/pointerUtils");
var Signals_1 = require("@interactjs/utils/Signals");
var Interaction_1 = require("./Interaction");
var interactionFinder_1 = require("./interactionFinder");
var methodNames = [
    'pointerDown', 'pointerMove', 'pointerUp',
    'updatePointer', 'removePointer', 'windowBlur',
];
function install(scope) {
    var signals = new Signals_1["default"]();
    var listeners = {};
    for (var _i = 0, methodNames_1 = methodNames; _i < methodNames_1.length; _i++) {
        var method = methodNames_1[_i];
        listeners[method] = doOnInteractions(method, scope);
    }
    var pEventTypes = browser_1["default"].pEventTypes;
    var eventMap = {};
    if (domObjects_1["default"].PointerEvent) {
        eventMap[pEventTypes.down] = listeners.pointerDown;
        eventMap[pEventTypes.move] = listeners.pointerMove;
        eventMap[pEventTypes.up] = listeners.pointerUp;
        eventMap[pEventTypes.cancel] = listeners.pointerUp;
    }
    else {
        eventMap.mousedown = listeners.pointerDown;
        eventMap.mousemove = listeners.pointerMove;
        eventMap.mouseup = listeners.pointerUp;
        eventMap.touchstart = listeners.pointerDown;
        eventMap.touchmove = listeners.pointerMove;
        eventMap.touchend = listeners.pointerUp;
        eventMap.touchcancel = listeners.pointerUp;
    }
    eventMap.blur = function (event) {
        for (var _i = 0, _a = scope.interactions.list; _i < _a.length; _i++) {
            var interaction = _a[_i];
            interaction.documentBlur(event);
        }
    };
    scope.signals.on('add-document', onDocSignal);
    scope.signals.on('remove-document', onDocSignal);
    // for ignoring browser's simulated mouse events
    scope.prevTouchTime = 0;
    scope.Interaction = /** @class */ (function (_super) {
        __extends(Interaction, _super);
        function Interaction() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Object.defineProperty(Interaction.prototype, "pointerMoveTolerance", {
            get: function () {
                return scope.interactions.pointerMoveTolerance;
            },
            set: function (value) {
                scope.interactions.pointerMoveTolerance = value;
            },
            enumerable: true,
            configurable: true
        });
        Interaction.prototype._now = function () { return scope.now(); };
        return Interaction;
    }(Interaction_1["default"]));
    scope.interactions = {
        signals: signals,
        // all active and idle interactions
        list: [],
        "new": function (options) {
            options.signals = signals;
            var interaction = new scope.Interaction(options);
            scope.interactions.list.push(interaction);
            return interaction;
        },
        listeners: listeners,
        eventMap: eventMap,
        pointerMoveTolerance: 1
    };
}
function doOnInteractions(method, scope) {
    return function (event) {
        var interactions = scope.interactions.list;
        var pointerType = pointerUtils_1["default"].getPointerType(event);
        var _a = pointerUtils_1["default"].getEventTargets(event), eventTarget = _a[0], curEventTarget = _a[1];
        var matches = []; // [ [pointer, interaction], ...]
        if (browser_1["default"].supportsTouch && /touch/.test(event.type)) {
            scope.prevTouchTime = scope.now();
            for (var _i = 0, _b = event.changedTouches; _i < _b.length; _i++) {
                var changedTouch = _b[_i];
                var pointer = changedTouch;
                var pointerId = pointerUtils_1["default"].getPointerId(pointer);
                var searchDetails = {
                    pointer: pointer,
                    pointerId: pointerId,
                    pointerType: pointerType,
                    eventType: event.type,
                    eventTarget: eventTarget,
                    curEventTarget: curEventTarget,
                    scope: scope
                };
                var interaction = getInteraction(searchDetails);
                matches.push([
                    searchDetails.pointer,
                    searchDetails.eventTarget,
                    searchDetails.curEventTarget,
                    interaction,
                ]);
            }
        }
        else {
            var invalidPointer = false;
            if (!browser_1["default"].supportsPointerEvent && /mouse/.test(event.type)) {
                // ignore mouse events while touch interactions are active
                for (var i = 0; i < interactions.length && !invalidPointer; i++) {
                    invalidPointer = interactions[i].pointerType !== 'mouse' && interactions[i].pointerIsDown;
                }
                // try to ignore mouse events that are simulated by the browser
                // after a touch event
                invalidPointer = invalidPointer ||
                    (scope.now() - scope.prevTouchTime < 500) ||
                    // on iOS and Firefox Mobile, MouseEvent.timeStamp is zero if simulated
                    event.timeStamp === 0;
            }
            if (!invalidPointer) {
                var searchDetails = {
                    pointer: event,
                    pointerId: pointerUtils_1["default"].getPointerId(event),
                    pointerType: pointerType,
                    eventType: event.type,
                    curEventTarget: curEventTarget,
                    eventTarget: eventTarget,
                    scope: scope
                };
                var interaction = getInteraction(searchDetails);
                matches.push([
                    searchDetails.pointer,
                    searchDetails.eventTarget,
                    searchDetails.curEventTarget,
                    interaction,
                ]);
            }
        }
        // eslint-disable-next-line no-shadow
        for (var _c = 0, matches_1 = matches; _c < matches_1.length; _c++) {
            var _d = matches_1[_c], pointer = _d[0], eventTarget_1 = _d[1], curEventTarget_1 = _d[2], interaction = _d[3];
            interaction[method](pointer, event, eventTarget_1, curEventTarget_1);
        }
    };
}
function getInteraction(searchDetails) {
    var pointerType = searchDetails.pointerType, scope = searchDetails.scope;
    var foundInteraction = interactionFinder_1["default"].search(searchDetails);
    var signalArg = { interaction: foundInteraction, searchDetails: searchDetails };
    scope.interactions.signals.fire('find', signalArg);
    return signalArg.interaction || scope.interactions["new"]({ pointerType: pointerType });
}
function onDocSignal(_a, signalName) {
    var doc = _a.doc, scope = _a.scope, options = _a.options;
    var eventMap = scope.interactions.eventMap;
    var eventMethod = signalName.indexOf('add') === 0
        ? events_1["default"].add : events_1["default"].remove;
    if (scope.browser.isIOS && !options.events) {
        options.events = { passive: false };
    }
    // delegate event listener
    for (var eventType in events_1["default"].delegatedEvents) {
        eventMethod(doc, eventType, events_1["default"].delegateListener);
        eventMethod(doc, eventType, events_1["default"].delegateUseCapture, true);
    }
    var eventOptions = options && options.events;
    for (var eventType in eventMap) {
        eventMethod(doc, eventType, eventMap[eventType], eventOptions);
    }
}
exports["default"] = {
    id: 'core/interactions',
    install: install,
    onDocSignal: onDocSignal,
    doOnInteractions: doOnInteractions,
    methodNames: methodNames
};
