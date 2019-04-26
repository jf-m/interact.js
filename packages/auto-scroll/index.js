"use strict";
exports.__esModule = true;
var domUtils = require("@interactjs/utils/domUtils");
var is = require("@interactjs/utils/is");
var raf_1 = require("@interactjs/utils/raf");
var rect_1 = require("@interactjs/utils/rect");
var window_1 = require("@interactjs/utils/window");
function install(scope) {
    var interactions = scope.interactions, defaults = scope.defaults, actions = scope.actions;
    scope.autoScroll = autoScroll;
    autoScroll.now = function () { return scope.now(); };
    interactions.signals.on('new', function (_a) {
        var interaction = _a.interaction;
        interaction.autoScroll = null;
    });
    interactions.signals.on('unset', function (_a) {
        var interaction = _a.interaction;
        interaction.autoScroll = null;
        autoScroll.stop();
        if (autoScroll.interaction) {
            autoScroll.interaction = null;
        }
    });
    interactions.signals.on('stop', autoScroll.stop);
    interactions.signals.on('action-move', function (arg) { return autoScroll.onInteractionMove(arg); });
    actions.eventTypes.push('autoscroll');
    defaults.perAction.autoScroll = autoScroll.defaults;
}
var autoScroll = {
    defaults: {
        enabled: false,
        margin: 60,
        // the item that is scrolled (Window or HTMLElement)
        container: null,
        // the scroll speed in pixels per second
        speed: 300
    },
    now: Date.now,
    interaction: null,
    i: null,
    x: 0,
    y: 0,
    isScrolling: false,
    prevTime: 0,
    margin: 0,
    speed: 0,
    start: function (interaction) {
        autoScroll.isScrolling = true;
        raf_1["default"].cancel(autoScroll.i);
        interaction.autoScroll = autoScroll;
        autoScroll.interaction = interaction;
        autoScroll.prevTime = autoScroll.now();
        autoScroll.i = raf_1["default"].request(autoScroll.scroll);
    },
    stop: function () {
        autoScroll.isScrolling = false;
        if (autoScroll.interaction) {
            autoScroll.interaction.autoScroll = null;
        }
        raf_1["default"].cancel(autoScroll.i);
    },
    // scroll the window by the values in scroll.x/y
    scroll: function () {
        var interaction = autoScroll.interaction;
        var interactable = interaction.interactable, element = interaction.element;
        var options = interactable.options[autoScroll.interaction.prepared.name].autoScroll;
        var container = getContainer(options.container, interactable, element);
        var now = autoScroll.now();
        // change in time in seconds
        var dt = (now - autoScroll.prevTime) / 1000;
        // displacement
        var s = options.speed * dt;
        if (s >= 1) {
            var scrollBy_1 = {
                x: autoScroll.x * s,
                y: autoScroll.y * s
            };
            if (scrollBy_1.x || scrollBy_1.y) {
                var prevScroll = getScroll(container);
                if (is.window(container)) {
                    container.scrollBy(scrollBy_1.x, scrollBy_1.y);
                }
                else if (container) {
                    container.scrollLeft += scrollBy_1.x;
                    container.scrollTop += scrollBy_1.y;
                }
                var curScroll = getScroll(container);
                var delta = {
                    x: curScroll.x - prevScroll.x,
                    y: curScroll.y - prevScroll.y
                };
                if (delta.x || delta.y) {
                    interactable.fire({
                        type: 'autoscroll',
                        target: element,
                        interactable: interactable,
                        delta: delta,
                        interaction: interaction,
                        container: container
                    });
                }
            }
            autoScroll.prevTime = now;
        }
        if (autoScroll.isScrolling) {
            raf_1["default"].cancel(autoScroll.i);
            autoScroll.i = raf_1["default"].request(autoScroll.scroll);
        }
    },
    check: function (interactable, actionName) {
        var options = interactable.options;
        return options[actionName].autoScroll && options[actionName].autoScroll.enabled;
    },
    onInteractionMove: function (_a) {
        var interaction = _a.interaction, pointer = _a.pointer;
        if (!(interaction.interacting() &&
            autoScroll.check(interaction.interactable, interaction.prepared.name))) {
            return;
        }
        if (interaction.simulation) {
            autoScroll.x = autoScroll.y = 0;
            return;
        }
        var top;
        var right;
        var bottom;
        var left;
        var interactable = interaction.interactable, element = interaction.element;
        var options = interactable.options[interaction.prepared.name].autoScroll;
        var container = getContainer(options.container, interactable, element);
        if (is.window(container)) {
            left = pointer.clientX < autoScroll.margin;
            top = pointer.clientY < autoScroll.margin;
            right = pointer.clientX > container.innerWidth - autoScroll.margin;
            bottom = pointer.clientY > container.innerHeight - autoScroll.margin;
        }
        else {
            var rect = domUtils.getElementClientRect(container);
            left = pointer.clientX < rect.left + autoScroll.margin;
            top = pointer.clientY < rect.top + autoScroll.margin;
            right = pointer.clientX > rect.right - autoScroll.margin;
            bottom = pointer.clientY > rect.bottom - autoScroll.margin;
        }
        autoScroll.x = (right ? 1 : left ? -1 : 0);
        autoScroll.y = (bottom ? 1 : top ? -1 : 0);
        if (!autoScroll.isScrolling) {
            // set the autoScroll properties to those of the target
            autoScroll.margin = options.margin;
            autoScroll.speed = options.speed;
            autoScroll.start(interaction);
        }
    }
};
function getContainer(value, interactable, element) {
    return (is.string(value) ? rect_1.getStringOptionResult(value, interactable, element) : value) || window_1.getWindow(element);
}
exports.getContainer = getContainer;
function getScroll(container) {
    if (is.window(container)) {
        container = window.document.body;
    }
    return { x: container.scrollLeft, y: container.scrollTop };
}
exports.getScroll = getScroll;
function getScrollSize(container) {
    if (is.window(container)) {
        container = window.document.body;
    }
    return { x: container.scrollWidth, y: container.scrollHeight };
}
exports.getScrollSize = getScrollSize;
function getScrollSizeDelta(_a, func) {
    var interaction = _a.interaction, element = _a.element;
    var scrollOptions = interaction && interaction.interactable.options[interaction.prepared.name].autoScroll;
    if (!scrollOptions || !scrollOptions.enabled) {
        func();
        return { x: 0, y: 0 };
    }
    var scrollContainer = getContainer(scrollOptions.container, interaction.interactable, element);
    var prevSize = getScroll(scrollContainer);
    func();
    var curSize = getScroll(scrollContainer);
    return {
        x: curSize.x - prevSize.x,
        y: curSize.y - prevSize.y
    };
}
exports.getScrollSizeDelta = getScrollSizeDelta;
exports["default"] = {
    id: 'auto-scroll',
    install: install
};
