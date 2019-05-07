import { ARROW_LEFT, ARROW_RIGHT, ZERO_WIDTH_SPACE } from './constants'
import { isInlineBanned, moveToEndOf, moveToStartOf } from './utils'

/**
 * Determines behavior if the caret is currently outside of an inline, while arrowing left
 *
 * @param {Event} event
 * @param {Editor} editor
 * @param {function} next
 * @param {Object} opts
 * @return {Null | Editor}
 */

function handleArrowLeftOutsideInline(event, editor, next, opts) {
  const isExtending = event.shiftKey
  const { hasStickyBoundaries } = opts

  // We are outside of an inline and need to figure out if we are anywhere close to a sticky inline
  const isAtStartOfCurrentTextNode = editor.value.selection.focus.offset === 0

  if (!isAtStartOfCurrentTextNode) return next()
  const textNodeIndex = editor.value.focusBlock.nodes.findIndex((node) => { return node.key === editor.value.focusText.key }) - 1
  const upcomingNode = editor.value.focusBlock.nodes.get(textNodeIndex)

  if (isInlineBanned(editor, upcomingNode, opts) || !hasStickyBoundaries || isExtending || editor.isVoid(upcomingNode) || textNodeIndex === -1) return next()
  return editor.call(moveToEndOf, upcomingNode, event)
}

/**
 * Determines behavior if the caret is currently inside of an inline
 *
 * @param {Event} event
 * @param {Editor} editor
 * @param {function} next
 * @param {Object} opts
 * @return {Null | Editor}
 */

function handleArrowLeftInsideInline(event, editor, next, opts) {
  const isExtending = event.shiftKey
  const { hasStickyBoundaries } = opts

  // In normal slate inline world, these two boundaries are the true start/end of an Inline.
  // Since you can never actually move to the start or end of an inline (that's what we are fixing after all!)
  const isAtSecondToFirstCharacter = editor.value.selection.focus.offset === 1

  // Thanks to this very plugin, it's common to be in this editor.value where you are at the edge of an inline.
  const isAtFirstCharacter = editor.value.selection.focus.offset === 0

  const inlineIndex = editor.value.focusBlock.nodes.findIndex((node) => { return node.key === editor.value.focusInline.key }) - 1
  const upcomingNode = editor.value.focusBlock.nodes.get(inlineIndex)

  if (inlineIndex === -1) return next()

  // We are on an edge on the inside of an inline.  If they don't want sticky boundaries, or if they are extending,
  // then it doesn't stick here.
  if (hasStickyBoundaries && isAtFirstCharacter && upcomingNode && !isExtending) {
    return editor.call(moveToEndOf, upcomingNode, event)
  }

  // In this case they are attempting to leave an artifact so we should make sure that
  // Is a smooth process
  if (editor.value.focusInline.text === ZERO_WIDTH_SPACE && upcomingNode) {
    return editor.call(moveToEndOf, upcomingNode, event, -1)
  }

  if (isAtSecondToFirstCharacter) {
    return editor.call(moveToStartOf, editor.value.focusInline, event)
  }

  return next()
}

/**
 * Caret Manipulation logic
 *
 * @param {Event} event
 * @param {Editor} editor
 * @param {function} next
 * @param {Object} opts
 * @return {Null}
 */

export default function onArrowLeft(event, editor, next, opts) {
  if (event.ctrlKey) return next()

  // In these cases we are actually inside the inline.
  if (editor.value.focusInline) return handleArrowLeftInsideInline(event, editor, next, opts)

  return handleArrowLeftOutsideInline(event, editor, next, opts)
}
