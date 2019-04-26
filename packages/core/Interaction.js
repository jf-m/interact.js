"use strict";
exports.__esModule = true;
var utils = require("@interactjs/utils");
var InteractEvent_1 = require("./InteractEvent");
var PointerInfo_1 = require("./PointerInfo");
exports.PointerInfo = PointerInfo_1["default"];
var scope_1 = require("./scope");
var Interaction = /** @class */ (function () {
    /** */
    function Interaction(_a) {
        var pointerType = _a.pointerType, signals = _a.signals;
        // current interactable being interacted with
        this.interactable = null;
        // the target element of the interactable
        this.element = null;
        // action that's ready to be fired on next move event
        this.prepared = {
            name: null,
            axis: null,
            edges: null
        };
        // keep track of added pointers
        this.pointers = [];
        // pointerdown/mousedown/touchstart event
        this.downEvent = null;
        this.downPointer = {};
        this._latestPointer = {
            pointer: null,
            event: null,
            eventTarget: null
        };
        // previous action event
        this.prevEvent = null;
        this.pointerIsDown = false;
        this.pointerWasMoved = false;
        this._interacting = false;
        this._ending = false;
        this._proxy = null;
        this.simulation = null;
        /**
         * @alias Interaction.prototype.move
         */
        this.doMove = utils.warnOnce(function (signalArg) {
            this.move(signalArg);
        }, 'The interaction.doMove() method has been renamed to interaction.move()');
        this.coords = {
            // Starting InteractEvent pointer coordinates
            start: utils.pointer.newCoords(),
            // Previous native pointer move event coordinates
            prev: utils.pointer.newCoords(),
            // current native pointer move event coordinates
            cur: utils.pointer.newCoords(),
            // Change in coordinates and time of the pointer
            delta: utils.pointer.newCoords(),
            // pointer velocity
            velocity: utils.pointer.newCoords()
        };
        this._signals = signals;
        this.pointerType = pointerType;
        var that = this;
        this._proxy = {
            get pointerIsDown() { return that.pointerIsDown; },
            get pointerWasMoved() { return that.pointerWasMoved; },
            start: function (action, i, e) { return that.start(action, i, e); },
            move: function (arg) { return that.move(arg); },
            end: function (event) { return that.end(event); },
            stop: function () { return that.stop(); },
            interacting: function () { return that.interacting(); },
            get _proxy() { return this; }
        };
        this._signals.fire('new', { interaction: this });
    }
    Object.defineProperty(Interaction.prototype, "pointerMoveTolerance", {
        get: function () {
            return 1;
        },
        enumerable: true,
        configurable: true
    });
    Interaction.prototype.pointerDown = function (pointer, event, eventTarget) {
        var pointerIndex = this.updatePointer(pointer, event, eventTarget, true);
        this._signals.fire('down', {
            pointer: pointer,
            event: event,
            eventTarget: eventTarget,
            pointerIndex: pointerIndex,
            interaction: this
        });
    };
    /**
     * ```js
     * interact(target)
     *   .draggable({
     *     // disable the default drag start by down->move
     *     manualStart: true
     *   })
     *   // start dragging after the user holds the pointer down
     *   .on('hold', function (event) {
     *     var interaction = event.interaction
     *
     *     if (!interaction.interacting()) {
     *       interaction.start({ name: 'drag' },
     *                         event.interactable,
     *                         event.currentTarget)
     *     }
     * })
     * ```
     *
     * Start an action with the given Interactable and Element as tartgets. The
     * action must be enabled for the target Interactable and an appropriate
     * number of pointers must be held down - 1 for drag/resize, 2 for gesture.
     *
     * Use it with `interactable.<action>able({ manualStart: false })` to always
     * [start actions manually](https://github.com/taye/interact.js/issues/114)
     *
     * @param {object} action   The action to be performed - drag, resize, etc.
     * @param {Interactable} target  The Interactable to target
     * @param {Element} element The DOM Element to target
     * @return {object} interact
     */
    Interaction.prototype.start = function (action, interactable, element) {
        if (this.interacting() ||
            !this.pointerIsDown ||
            this.pointers.length < (action.name === scope_1.ActionName.Gesture ? 2 : 1) ||
            !interactable.options[action.name].enabled) {
            return false;
        }
        utils.copyAction(this.prepared, action);
        this.interactable = interactable;
        this.element = element;
        this.rect = interactable.getRect(element);
        this.edges = this.prepared.edges;
        this._interacting = this._doPhase({
            interaction: this,
            event: this.downEvent,
            phase: InteractEvent_1.EventPhase.Start
        });
        return this._interacting;
    };
    Interaction.prototype.pointerMove = function (pointer, event, eventTarget) {
        if (!this.simulation) {
            this.updatePointer(pointer, event, eventTarget, false);
            utils.pointer.setCoords(this.coords.cur, this.pointers.map(function (p) { return p.pointer; }), this._now());
        }
        var duplicateMove = (this.coords.cur.page.x === this.coords.prev.page.x &&
            this.coords.cur.page.y === this.coords.prev.page.y &&
            this.coords.cur.client.x === this.coords.prev.client.x &&
            this.coords.cur.client.y === this.coords.prev.client.y);
        var dx;
        var dy;
        // register movement greater than pointerMoveTolerance
        if (this.pointerIsDown && !this.pointerWasMoved) {
            dx = this.coords.cur.client.x - this.coords.start.client.x;
            dy = this.coords.cur.client.y - this.coords.start.client.y;
            this.pointerWasMoved = utils.hypot(dx, dy) > this.pointerMoveTolerance;
        }
        var signalArg = {
            pointer: pointer,
            pointerIndex: this.getPointerIndex(pointer),
            event: event,
            eventTarget: eventTarget,
            dx: dx,
            dy: dy,
            duplicate: duplicateMove,
            interaction: this
        };
        if (!duplicateMove) {
            // set pointer coordinate, time changes and velocity
            utils.pointer.setCoordDeltas(this.coords.delta, this.coords.prev, this.coords.cur);
            utils.pointer.setCoordVelocity(this.coords.velocity, this.coords.delta);
        }
        this._signals.fire('move', signalArg);
        if (!duplicateMove) {
            // if interacting, fire an 'action-move' signal etc
            if (this.interacting()) {
                this.move(signalArg);
            }
            if (this.pointerWasMoved) {
                utils.pointer.copyCoords(this.coords.prev, this.coords.cur);
            }
        }
    };
    /**
     * ```js
     * interact(target)
     *   .draggable(true)
     *   .on('dragmove', function (event) {
     *     if (someCondition) {
     *       // change the snap settings
     *       event.interactable.draggable({ snap: { targets: [] }})
     *       // fire another move event with re-calculated snap
     *       event.interaction.move()
     *     }
     *   })
     * ```
     *
     * Force a move of the current action at the same coordinates. Useful if
     * snap/restrict has been changed and you want a movement with the new
     * settings.
     */
    Interaction.prototype.move = function (signalArg) {
        signalArg = utils.extend({
            pointer: this._latestPointer.pointer,
            event: this._latestPointer.event,
            eventTarget: this._latestPointer.eventTarget,
            interaction: this
        }, signalArg || {});
        signalArg.phase = InteractEvent_1.EventPhase.Move;
        this._doPhase(signalArg);
    };
    // End interact move events and stop auto-scroll unless simulation is running
    Interaction.prototype.pointerUp = function (pointer, event, eventTarget, curEventTarget) {
        var pointerIndex = this.getPointerIndex(pointer);
        if (pointerIndex === -1) {
            pointerIndex = this.updatePointer(pointer, event, eventTarget, false);
        }
        this._signals.fire(/cancel$/i.test(event.type) ? 'cancel' : 'up', {
            pointer: pointer,
            pointerIndex: pointerIndex,
            event: event,
            eventTarget: eventTarget,
            curEventTarget: curEventTarget,
            interaction: this
        });
        if (!this.simulation) {
            this.end(event);
        }
        this.pointerIsDown = false;
        this.removePointer(pointer, event);
    };
    Interaction.prototype.documentBlur = function (event) {
        this.end(event);
        this._signals.fire('blur', { event: event, interaction: this });
    };
    /**
     * ```js
     * interact(target)
     *   .draggable(true)
     *   .on('move', function (event) {
     *     if (event.pageX > 1000) {
     *       // end the current action
     *       event.interaction.end()
     *       // stop all further listeners from being called
     *       event.stopImmediatePropagation()
     *     }
     *   })
     * ```
     *
     * @param {PointerEvent} [event]
     */
    Interaction.prototype.end = function (event) {
        this._ending = true;
        event = event || this._latestPointer.event;
        var endPhaseResult;
        if (this.interacting()) {
            endPhaseResult = this._doPhase({
                event: event,
                interaction: this,
                phase: InteractEvent_1.EventPhase.End
            });
        }
        this._ending = false;
        if (endPhaseResult === true) {
            this.stop();
        }
    };
    Interaction.prototype.currentAction = function () {
        return this._interacting ? this.prepared.name : null;
    };
    Interaction.prototype.interacting = function () {
        return this._interacting;
    };
    /** */
    Interaction.prototype.stop = function () {
        this._signals.fire('stop', { interaction: this });
        this.interactable = this.element = null;
        this._interacting = false;
        this.prepared.name = this.prevEvent = null;
    };
    Interaction.prototype.getPointerIndex = function (pointer) {
        var pointerId = utils.pointer.getPointerId(pointer);
        // mouse and pen interactions may have only one pointer
        return (this.pointerType === 'mouse' || this.pointerType === 'pen')
            ? this.pointers.length - 1
            : utils.arr.findIndex(this.pointers, function (curPointer) { return curPointer.id === pointerId; });
    };
    Interaction.prototype.getPointerInfo = function (pointer) {
        return this.pointers[this.getPointerIndex(pointer)];
    };
    Interaction.prototype.updatePointer = function (pointer, event, eventTarget, down) {
        var id = utils.pointer.getPointerId(pointer);
        var pointerIndex = this.getPointerIndex(pointer);
        var pointerInfo = this.pointers[pointerIndex];
        down = down === false
            ? false
            : down || /(down|start)$/i.test(event.type);
        if (!pointerInfo) {
            pointerInfo = new PointerInfo_1["default"](id, pointer, event, null, null);
            pointerIndex = this.pointers.length;
            this.pointers.push(pointerInfo);
        }
        else {
            pointerInfo.pointer = pointer;
        }
        if (down) {
            this.pointerIsDown = true;
            if (!this.interacting()) {
                utils.pointer.setCoords(this.coords.start, this.pointers.map(function (p) { return p.pointer; }), this._now());
                utils.pointer.copyCoords(this.coords.cur, this.coords.start);
                utils.pointer.copyCoords(this.coords.prev, this.coords.start);
                utils.pointer.pointerExtend(this.downPointer, pointer);
                this.downEvent = event;
                pointerInfo.downTime = this.coords.cur.timeStamp;
                pointerInfo.downTarget = eventTarget;
                this.pointerWasMoved = false;
            }
        }
        this._updateLatestPointer(pointer, event, eventTarget);
        this._signals.fire('update-pointer', {
            pointer: pointer,
            event: event,
            eventTarget: eventTarget,
            down: down,
            pointerInfo: pointerInfo,
            pointerIndex: pointerIndex,
            interaction: this
        });
        return pointerIndex;
    };
    Interaction.prototype.removePointer = function (pointer, event) {
        var pointerIndex = this.getPointerIndex(pointer);
        if (pointerIndex === -1) {
            return;
        }
        var pointerInfo = this.pointers[pointerIndex];
        this._signals.fire('remove-pointer', {
            pointer: pointer,
            event: event,
            pointerIndex: pointerIndex,
            pointerInfo: pointerInfo,
            interaction: this
        });
        this.pointers.splice(pointerIndex, 1);
    };
    Interaction.prototype._updateLatestPointer = function (pointer, event, eventTarget) {
        this._latestPointer.pointer = pointer;
        this._latestPointer.event = event;
        this._latestPointer.eventTarget = eventTarget;
    };
    Interaction.prototype.destroy = function () {
        this._latestPointer.pointer = null;
        this._latestPointer.event = null;
        this._latestPointer.eventTarget = null;
    };
    Interaction.prototype._createPreparedEvent = function (event, phase, preEnd, type) {
        var actionName = this.prepared.name;
        return new InteractEvent_1["default"](this, event, actionName, phase, this.element, null, preEnd, type);
    };
    Interaction.prototype._fireEvent = function (iEvent) {
        this.interactable.fire(iEvent);
        if (!this.prevEvent || iEvent.timeStamp >= this.prevEvent.timeStamp) {
            this.prevEvent = iEvent;
        }
    };
    Interaction.prototype._doPhase = function (signalArg) {
        var event = signalArg.event, phase = signalArg.phase, preEnd = signalArg.preEnd, type = signalArg.type;
        var beforeResult = this._signals.fire("before-action-" + phase, signalArg);
        if (beforeResult === false) {
            return false;
        }
        var iEvent = signalArg.iEvent = this._createPreparedEvent(event, phase, preEnd, type);
        var rect = this.rect;
        if (rect) {
            // update the rect modifications
            var edges = this.edges || this.prepared.edges || { left: true, right: true, top: true, bottom: true };
            if (edges.top) {
                rect.top += iEvent.delta.y;
            }
            if (edges.bottom) {
                rect.bottom += iEvent.delta.y;
            }
            if (edges.left) {
                rect.left += iEvent.delta.x;
            }
            if (edges.right) {
                rect.right += iEvent.delta.x;
            }
            rect.width = rect.right - rect.left;
            rect.height = rect.bottom - rect.top;
        }
        this._signals.fire("action-" + phase, signalArg);
        this._fireEvent(iEvent);
        this._signals.fire("after-action-" + phase, signalArg);
        return true;
    };
    Interaction.prototype._now = function () { return Date.now(); };
    return Interaction;
}());
exports.Interaction = Interaction;
exports["default"] = Interaction;
