"use strict";
exports.__esModule = true;
var arr_1 = require("@interactjs/utils/arr");
var dom = require("@interactjs/utils/domUtils");
var finder = {
    methodOrder: ['simulationResume', 'mouseOrPen', 'hasPointer', 'idle'],
    search: function (details) {
        for (var _i = 0, _a = finder.methodOrder; _i < _a.length; _i++) {
            var method = _a[_i];
            var interaction = finder[method](details);
            if (interaction) {
                return interaction;
            }
        }
    },
    // try to resume simulation with a new pointer
    simulationResume: function (_a) {
        var pointerType = _a.pointerType, eventType = _a.eventType, eventTarget = _a.eventTarget, scope = _a.scope;
        if (!/down|start/i.test(eventType)) {
            return null;
        }
        for (var _i = 0, _b = scope.interactions.list; _i < _b.length; _i++) {
            var interaction = _b[_i];
            var element = eventTarget;
            if (interaction.simulation && interaction.simulation.allowResume &&
                (interaction.pointerType === pointerType)) {
                while (element) {
                    // if the element is the interaction element
                    if (element === interaction.element) {
                        return interaction;
                    }
                    element = dom.parentNode(element);
                }
            }
        }
        return null;
    },
    // if it's a mouse or pen interaction
    mouseOrPen: function (_a) {
        var pointerId = _a.pointerId, pointerType = _a.pointerType, eventType = _a.eventType, scope = _a.scope;
        if (pointerType !== 'mouse' && pointerType !== 'pen') {
            return null;
        }
        var firstNonActive;
        for (var _i = 0, _b = scope.interactions.list; _i < _b.length; _i++) {
            var interaction = _b[_i];
            if (interaction.pointerType === pointerType) {
                // if it's a down event, skip interactions with running simulations
                if (interaction.simulation && !hasPointerId(interaction, pointerId)) {
                    continue;
                }
                // if the interaction is active, return it immediately
                if (interaction.interacting()) {
                    return interaction;
                }
                // otherwise save it and look for another active interaction
                else if (!firstNonActive) {
                    firstNonActive = interaction;
                }
            }
        }
        // if no active mouse interaction was found use the first inactive mouse
        // interaction
        if (firstNonActive) {
            return firstNonActive;
        }
        // find any mouse or pen interaction.
        // ignore the interaction if the eventType is a *down, and a simulation
        // is active
        for (var _c = 0, _d = scope.interactions.list; _c < _d.length; _c++) {
            var interaction = _d[_c];
            if (interaction.pointerType === pointerType && !(/down/i.test(eventType) && interaction.simulation)) {
                return interaction;
            }
        }
        return null;
    },
    // get interaction that has this pointer
    hasPointer: function (_a) {
        var pointerId = _a.pointerId, scope = _a.scope;
        for (var _i = 0, _b = scope.interactions.list; _i < _b.length; _i++) {
            var interaction = _b[_i];
            if (hasPointerId(interaction, pointerId)) {
                return interaction;
            }
        }
        return null;
    },
    // get first idle interaction with a matching pointerType
    idle: function (_a) {
        var pointerType = _a.pointerType, scope = _a.scope;
        for (var _i = 0, _b = scope.interactions.list; _i < _b.length; _i++) {
            var interaction = _b[_i];
            // if there's already a pointer held down
            if (interaction.pointers.length === 1) {
                var target = interaction.interactable;
                // don't add this pointer if there is a target interactable and it
                // isn't gesturable
                if (target && !target.options.gesture.enabled) {
                    continue;
                }
            }
            // maximum of 2 pointers per interaction
            else if (interaction.pointers.length >= 2) {
                continue;
            }
            if (!interaction.interacting() && (pointerType === interaction.pointerType)) {
                return interaction;
            }
        }
        return null;
    }
};
function hasPointerId(interaction, pointerId) {
    return arr_1.some(interaction.pointers, function (_a) {
        var id = _a.id;
        return id === pointerId;
    });
}
exports["default"] = finder;
