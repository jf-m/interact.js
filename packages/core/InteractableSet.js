"use strict";
exports.__esModule = true;
var arr = require("@interactjs/utils/arr");
var domUtils = require("@interactjs/utils/domUtils");
var extend_1 = require("@interactjs/utils/extend");
var is = require("@interactjs/utils/is");
var Signals_1 = require("@interactjs/utils/Signals");
var InteractableSet = /** @class */ (function () {
    function InteractableSet(scope) {
        var _this = this;
        this.scope = scope;
        this.signals = new Signals_1["default"]();
        // all set interactables
        this.list = [];
        this.selectorMap = {};
        this.signals.on('unset', function (_a) {
            var interactable = _a.interactable;
            var target = interactable.target, context = interactable._context;
            var targetMappings = is.string(target)
                ? _this.selectorMap[target]
                : target[_this.scope.id];
            targetMappings.splice(targetMappings.findIndex(function (m) { return m.context === context; }), 1);
            if (interactable.target[scope.id]) {
                interactable.target[scope.id].context = null;
                interactable.target[scope.id].interactable = null;
            }
        });
    }
    InteractableSet.prototype["new"] = function (target, options) {
        options = extend_1["default"](options || {}, {
            actions: this.scope.actions
        });
        var interactable = new this.scope.Interactable(target, options, this.scope.document);
        var mappingInfo = { context: interactable._context, interactable: interactable };
        this.scope.addDocument(interactable._doc);
        this.list.push(interactable);
        if (is.string(target)) {
            if (!this.selectorMap[target]) {
                this.selectorMap[target] = [];
            }
            this.selectorMap[target].push(mappingInfo);
        }
        else {
            if (!interactable.target[this.scope.id]) {
                Object.defineProperty(target, this.scope.id, {
                    value: [],
                    configurable: true
                });
            }
            target[this.scope.id].push(mappingInfo);
        }
        this.signals.fire('new', {
            target: target,
            options: options,
            interactable: interactable,
            win: this.scope._win
        });
        return interactable;
    };
    InteractableSet.prototype.get = function (target, options) {
        var context = (options && options.context) || this.scope.document;
        var isSelector = is.string(target);
        var targetMappings = isSelector
            ? this.selectorMap[target]
            : target[this.scope.id];
        if (!targetMappings) {
            return null;
        }
        var found = arr.find(targetMappings, function (m) { return m.context === context &&
            (isSelector || m.interactable.inContext(target)); });
        return found && found.interactable;
    };
    InteractableSet.prototype.forEachMatch = function (element, callback) {
        for (var _i = 0, _a = this.list; _i < _a.length; _i++) {
            var interactable = _a[_i];
            var ret = void 0;
            if ((is.string(interactable.target)
                // target is a selector and the element matches
                ? (is.element(element) && domUtils.matchesSelector(element, interactable.target))
                // target is the element
                : element === interactable.target) &&
                // the element is in context
                (interactable.inContext(element))) {
                ret = callback(interactable);
            }
            if (ret !== undefined) {
                return ret;
            }
        }
    };
    return InteractableSet;
}());
exports["default"] = InteractableSet;
