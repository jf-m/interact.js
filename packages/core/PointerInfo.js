"use strict";
exports.__esModule = true;
var PointerInfo = /** @class */ (function () {
    function PointerInfo(id, pointer, event, downTime, downTarget) {
        this.id = id;
        this.pointer = pointer;
        this.event = event;
        this.downTime = downTime;
        this.downTarget = downTarget;
    }
    return PointerInfo;
}());
exports.PointerInfo = PointerInfo;
exports["default"] = PointerInfo;
