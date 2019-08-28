import { ARROW_LEFT, ARROW_RIGHT, BACKSPACE, DELETE, ZERO_WIDTH_SPACE } from './constants'
import onArrowLeft from './onArrowLeft'
import onArrowRight from './onArrowRight'
import onBackspace from './onBackspace'
import onDelete from './onDelete'
import { isInlineBanned } from './utils'

const defaults = {
  allowedTypes: null,
  bannedTypes: [],
  hasStickyBoundaries: true,
  canBeEmpty: true,
  stickOnDelete: true,
}

/**
 * Cross Boundaries on Left Arrow, or Right arrow
 * when on the Start or End of an inline boundary
 * can delete all the text inside and still type to add more
 *
 * @param {Object} options
 *   @property {Array} allowedTypes (optional)
 *   @property {Array} bannedTypes (optional)
 *   @property {Boolean} hasStickyBoundaries (optional)
 *   @property {Boolean} canBeEmpty (optional)
 *   @property {Boolean} stickOnDelete (optional)
 * @return {Object} plugin
 */

function StickyInlines(opts) {
  opts = Object.assign({}, defaults, opts)
  const { allowedTypes, bannedTypes, hasStickyBoundaries, canBeEmpty } = opts

  if (allowedTypes && !Array.isArray(allowedTypes)) { console.warn('slate-sticky-inline: allowedTypes must be an Array of Strings') }
  if (!Array.isArray(bannedTypes)) { console.warn('slate-sticky-inlines: bannedTypes must be an Array of Strings') }

  /**
   * Keydown entry point.
   *
   * @param {Event} event
   * @param {Editor} editor
   * @param {function} next
   * @return {Editor}
   */

  function onKeyDown(event, editor, next) {
    // We are working inside a specific inline, and they specifically said they don't want it to be sticky.
    if (editor.value.focusInline && isInlineBanned(editor, editor.value.focusInline, opts)) return next()

    // They are moving the caret around, let's see if we need to interfere.
    switch (event.which) {
      case ARROW_LEFT:
        return onArrowLeft(event, editor, next, opts)
      case ARROW_RIGHT:
        return onArrowRight(event, editor, next, opts)
      case BACKSPACE:
        return onBackspace(event, editor, next, opts)
      case DELETE:
        return onDelete(event, editor, next, opts)
      default:
        return next()
    }
  }

  /**
   * Change entry point.  Used right now to clean up non-focused empty inline artifacts
   *
   * @param {Editor} editor
   * @return {Editor}
   */

  function onChange(editor, next) {
    if (!canBeEmpty) return next()

    const { document, selection } = editor.value

    const toRemove = document.getInlines().reduce((failures, inline) => {
      const hasFocus = selection.isFocused &&
        (selection.anchor.isInNode(inline) ||
         selection.focus.isInNode(inline))
      const onlyHasZeroWidthSpace = inline.text === ZERO_WIDTH_SPACE

      if (isInlineBanned(editor, inline, opts)) return failures
      return !hasFocus && onlyHasZeroWidthSpace ? [inline, ...failures] : failures
    }, [])

    if (!toRemove.length) return next()

    toRemove.forEach((failure) => editor = editor.removeNodeByKey(failure.key))
    return true
  }

  /**
   * Override getInsertPoint to allow selections on sticky node boundaries.
   *
   * @param {Editor} editor
   * @param {Point} point
   * @param {Node} node
   * @return {Point}
   */

  function getInsertPoint(editor, point, node) {
    const resolvedPoint = point.resolveToTextNode(node)
    if (resolvedPoint.path == null) return

    const inline = node.getClosestInline(resolvedPoint.path)
    if (!isInlineBanned(editor, inline, opts)) {
      // If we're in a sticky inline, don't adjust the insert point
      return resolvedPoint
    }

    const resolvedNode = node.getDescendant(resolvedPoint.path)

    if (resolvedPoint.offset === 0) {
      // If we are at the beginning of a node, and the previous node
      // is a sticky inline, don't adjust the point
      const previousNode = node.getPreviousSibling(resolvedPoint.path)

      if (!isInlineBanned(editor, previousNode, opts)) {
        return resolvedPoint
      }
    } else if (resolvedPoint.offset === resolvedNode.text.length) {
      // If we are at the end of a node, and the next node
      // is a sticky inline, don't adjust the point
      const nextNode = node.getNextSibling(resolvedPoint.path)

      if (!isInlineBanned(editor, nextNode, opts)) {
        return resolvedPoint
      }
    }
  }

  /**
   * Return the plugin.
   *
   * @type {Object}
   */

  return {
    onKeyDown,
    onChange,
    queries: {
      getInsertPoint
    }
  }
}

/**
 * Export.
 *
 * @type {Function}
 */

export default StickyInlines
