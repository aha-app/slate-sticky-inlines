import { PathUtils } from 'slate'
import { STICKY_LEFT, STICKY_RIGHT } from './constants'

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

export function moveToEndOf(editor, node, event, state, offset = 0) {
  event.preventDefault()
  state.sticky = offset === 0 ? STICKY_LEFT : null
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

export function moveToStartOf(editor, node, event, state, offset = 0) {
  event.preventDefault()
  state.sticky = offset === 0 ? STICKY_RIGHT : null
  return event.shiftKey ? editor.moveFocusToStartOfNode(node).moveFocusForward(offset) : editor.moveToStartOfNode(node)
}

/**
 * Returns the point at the very end of the previous text under the
 * same block.
 *
 * @param {Point} point
 * @param {Node} node
 * @return {Point}
 */

function pointAtEndOfPreviousText(point, node) {
  const block = node.getClosestBlock(point.path)
  const depth = node.getDepth(block.key)
  const relativePath = PathUtils.drop(point.path, depth)
  const [previous] = block.texts({ path: relativePath, direction: 'backward' })

  if (previous) {
    const [previousText, previousPath] = previous
    const absolutePath = point.path.slice(0, depth).concat(previousPath)

    return point.merge({
      key: previousText.key,
      path: absolutePath,
      offset: previousText.text.length,
    })
  } else {
    return point
  }
}

/**
 * Assuming point is at the start of node, returns a point that is at
 * the end of the previous node if stickyPreference is
 * STICKY_LEFT. Returns undefined otherwise, so we can fall back to
 * default Slate resolution.
 *
 * @param {Point} point
 * @param {Node} node
 * @param {string} stickyPreference
 * @return {Point}
 */

export function resolvePointAtStartOfNode(point, node, stickyPreference) {
  if (stickyPreference === STICKY_LEFT) {
    // We're at the left edge of a node, and want to be in the
    // previous node instead.
    return pointAtEndOfPreviousText(point, node)
  } else {
    return
  }
}

/**
 * Assuming point is at the end of node, returns a point that is
 * unchanged if stickyPreference is STICKY_LEFT. Returns undefined
 * otherwise, so we can fall back to default Slate resolution.
 *
 * @param {Point} point
 * @param {Node} node
 * @param {string} stickyPreference
 * @return {Point}
 */

export function resolvePointAtEndOfNode(point, node, stickyPreference) {
  if (stickyPreference === STICKY_LEFT) {
    // We're at the end of a sticky node already, no need to adjust
    // anything.
    return point
  } else {
    return
  }
}
