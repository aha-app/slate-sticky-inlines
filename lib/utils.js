import { PathUtils } from 'slate'

/**
 * Return true if settings bans the inline type, or it is void.
 *
 * @param {Editor} editor
 * @param {Inline} inline
 * @param {Object} opts
 * @return {Boolean}
 */

export function isInlineBanned(editor, inline, opts) {
  const { allowedTypes, bannedTypes } = opts

  // Something crazy happened, there is no inline, or somehow focus inline is not an inline.
  if (!inline || inline.object !== 'inline' || editor.isVoid(inline)) return true

  // The inline we are working with isn't allowed by user config.
  if (allowedTypes && !allowedTypes.includes(inline.type)) return true
  if (bannedTypes.includes(inline.type)) return true

  return false
}

/**
 * Prevents default event behavior, and either collapses to or extends to the start
 * of a node
 *
 * @param {Editor} editor
 * @param {Node} node
 * @param {Event} event
 * @param {Number} offset (optional)
 * @return {Editor}
 */

export function moveToEndOf(editor, node, event, offset = 0) {
  event.preventDefault()
  return event.shiftKey ? editor.moveFocusToEndOfNode(node).moveFocusForward(offset) : editor.moveToEndOfNode(node).moveForward(offset)
}

/**
 * Prevents default event behavior, and either collapses to or extends to the end
 * of a node
 *
 * @param {Editor} editor
 * @param {Node} node
 * @param {Event} event
 * @param {Number} offset (optional)
 * @return {Editor}
 */

export function moveToStartOf(editor, node, event, offset = 0) {
  event.preventDefault()
  return event.shiftKey ? editor.moveFocusToStartOfNode(node).moveFocusForward(offset) : editor.moveToStartOfNode(node)
}
