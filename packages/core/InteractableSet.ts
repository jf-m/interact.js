import * as arr from '@interactjs/utils/arr'
import * as domUtils from '@interactjs/utils/domUtils'
import extend from '@interactjs/utils/extend'
import * as is from '@interactjs/utils/is'
import Signals from '@interactjs/utils/Signals'

export default class InteractableSet {
  signals = new Signals()

  // all set interactables
  list: Interact.Interactable[] = []

  selectorMap: {
    [selector: string]: Array<{ context: Document | Element, interactable: Interact.Interactable }>
  } = {}

  constructor (protected scope: Interact.Scope) {
    this.signals.on('unset', ({ interactable }) => {
      const { target, _context: context } = interactable
      const targetMappings = is.string(target)
        ? this.selectorMap[target]
        : target[this.scope.id]

      targetMappings.splice(targetMappings.findIndex((m) => m.context === context), 1)
      if (interactable.target[scope.id]) {
        interactable.target[scope.id].context = null
        interactable.target[scope.id].interactable = null
      }
    })
  }

  new (target: Interact.Target, options?: any): Interact.Interactable {
    options = extend(options || {}, {
      actions: this.scope.actions,
    })
    const interactable = new this.scope.Interactable(target, options, this.scope.document)
    const mappingInfo = { context: interactable._context, interactable }

    this.scope.addDocument(interactable._doc)
    this.list.push(interactable)

    if (is.string(target)) {
      if (!this.selectorMap[target]) { this.selectorMap[target] = [] }
      this.selectorMap[target].push(mappingInfo)
    } else {
      if (!interactable.target[this.scope.id]) {
        Object.defineProperty(target, this.scope.id, {
          value: [],
          configurable: true,
        })
      }

      target[this.scope.id].push(mappingInfo)
    }

    this.signals.fire('new', {
      target,
      options,
      interactable,
      win: this.scope._win,
    })

    return interactable
  }

  get (target: Interact.Target, options) {
    const context = (options && options.context) || this.scope.document
    const isSelector = is.string(target)
    const targetMappings = isSelector
      ? this.selectorMap[target as string]
      : target[this.scope.id]

    if (!targetMappings) { return null }

    const found = arr.find(
      targetMappings,
      (m) => m.context === context &&
        (isSelector || m.interactable.inContext(target)))

    return found && found.interactable
  }

  forEachMatch (element: Document | Element, callback: (interactable: any) => any) {
    for (const interactable of this.list) {
      let ret

      if ((is.string(interactable.target)
      // target is a selector and the element matches
        ? (is.element(element) && domUtils.matchesSelector(element, interactable.target))
        // target is the element
        : element === interactable.target) &&
        // the element is in context
        (interactable.inContext(element))) {
        ret = callback(interactable)
      }

      if (ret !== undefined) {
        return ret
      }
    }
  }
}
