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
var utils = require("@interactjs/utils");
var domObjects_1 = require("@interactjs/utils/domObjects");
var defaultOptions_1 = require("./defaultOptions");
var Eventable_1 = require("./Eventable");
var Interactable_1 = require("./Interactable");
var InteractableSet_1 = require("./InteractableSet");
var InteractEvent_1 = require("./InteractEvent");
var interactions_1 = require("./interactions");
var win = utils.win, browser = utils.browser, raf = utils.raf, Signals = utils.Signals, events = utils.events;
var ActionName;
(function (ActionName) {
})(ActionName = exports.ActionName || (exports.ActionName = {}));
function createScope() {
    return new Scope();
}
exports.createScope = createScope;
var Scope = /** @class */ (function () {
    function Scope() {
        var _this = this;
        this.id = "__interact_scope_" + Math.floor(Math.random() * 100);
        this.signals = new Signals();
        this.browser = browser;
        this.events = events;
        this.utils = utils;
        this.defaults = utils.clone(defaultOptions_1["default"]);
        this.Eventable = Eventable_1["default"];
        this.actions = {
            names: [],
            methodDict: {},
            eventTypes: []
        };
        this.InteractEvent = InteractEvent_1["default"];
        this.interactables = new InteractableSet_1["default"](this);
        // all documents being listened to
        this.documents = [];
        this._plugins = [];
        this._pluginMap = {};
        this.onWindowUnload = function (event) { return _this.removeDocument(event.target); };
        var scope = this;
        this.Interactable = /** @class */ (function (_super) {
            __extends(Interactable, _super);
            function Interactable() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            Object.defineProperty(Interactable.prototype, "_defaults", {
                get: function () { return scope.defaults; },
                enumerable: true,
                configurable: true
            });
            Interactable.prototype.set = function (options) {
                _super.prototype.set.call(this, options);
                scope.interactables.signals.fire('set', {
                    options: options,
                    interactable: this
                });
                return this;
            };
            Interactable.prototype.unset = function () {
                _super.prototype.unset.call(this);
                for (var _i = 0, _a = scope.interactions.list; _i < _a.length; _i++) {
                    var interaction = _a[_i];
                    if (interaction.interactable === this) {
                        interaction.stop();
                    }
                    scope.interactions.signals.fire('unset', { interaction });
                    interaction.destroy();
                }
                scope.interactions.list = [];
                scope.interactables.signals.fire('unset', { interactable: this });
            };
            return Interactable;
        }(Interactable_1["default"]));
    }
    Scope.prototype.init = function (window) {
        return initScope(this, window);
    };
    Scope.prototype.pluginIsInstalled = function (plugin) {
        return this._pluginMap[plugin.id] || this._plugins.indexOf(plugin) !== -1;
    };
    Scope.prototype.usePlugin = function (plugin, options) {
        if (this.pluginIsInstalled(plugin)) {
            return this;
        }
        if (plugin.id) {
            this._pluginMap[plugin.id] = plugin;
        }
        plugin.install(this, options);
        this._plugins.push(plugin);
        return this;
    };
    Scope.prototype.addDocument = function (doc, options) {
        // do nothing if document is already known
        if (this.getDocIndex(doc) !== -1) {
            return false;
        }
        var window = win.getWindow(doc);
        options = options ? utils.extend({}, options) : {};
        this.documents.push({ doc: doc, options: options });
        events.documents.push(doc);
        // don't add an unload event for the main document
        // so that the page may be cached in browser history
        if (doc !== this.document) {
            events.add(window, 'unload', this.onWindowUnload);
        }
        this.signals.fire('add-document', { doc: doc, window: window, scope: this, options: options });
    };
    Scope.prototype.removeDocument = function (doc) {
        var index = this.getDocIndex(doc);
        var window = win.getWindow(doc);
        var options = this.documents[index].options;
        events.remove(window, 'unload', this.onWindowUnload);
        this.documents.splice(index, 1);
        events.documents.splice(index, 1);
        this.signals.fire('remove-document', { doc: doc, window: window, scope: this, options: options });
    };
    Scope.prototype.getDocIndex = function (doc) {
        for (var i = 0; i < this.documents.length; i++) {
            if (this.documents[i].doc === doc) {
                return i;
            }
        }
        return -1;
    };
    Scope.prototype.getDocOptions = function (doc) {
        var docIndex = this.getDocIndex(doc);
        return docIndex === -1 ? null : this.documents[docIndex].options;
    };
    Scope.prototype.now = function () {
        return (this.window.Date || Date).now();
    };
    return Scope;
}());
exports.Scope = Scope;
function initScope(scope, window) {
    win.init(window);
    domObjects_1["default"].init(window);
    browser.init(window);
    raf.init(window);
    events.init(window);
    scope.usePlugin(interactions_1["default"]);
    scope.document = window.document;
    scope.window = window;
    return scope;
}
exports.initScope = initScope;
