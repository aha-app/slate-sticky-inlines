import { ARROW_LEFT, ARROW_RIGHT, ZERO_WIDTH_SPACE } from './constants'
import { isInlineBanned, moveToEndOf, moveToStartOf } from './utils'

/**
 * Determines behavior if the caret is currently outside of an inline, while arrowing to the right
 *
 * @param {Event} event
 * @param {Editor} editor
 * @param {function} next
 * @param {Object} opts
 * @param {Object} state
 * @return {Null | Editor}
 */

function handleArrowRightOutsideInline(event, editor, next, opts, state) {
  const { document, selection, focusText } = editor.value
  const isExtending = event.shiftKey
  const { hasStickyBoundaries } = opts

  // We are outside of an inline and need to figure out if we are anywhere close to a sticky inline
  const isAtEndOfCurrentTextNode = selection.focus.offset === focusText.text.length
  const isAtSecondToLastCharacter = selection.focus.offset === focusText.text.length - 1

  const upcomingNode = document.getNextSibling(selection.focus.path)

  if (isInlineBanned(editor, upcomingNode, opts) || !hasStickyBoundaries || isExtending || editor.isVoid(upcomingNode)) return next()

  if (isAtSecondToLastCharacter) {
    return editor.command(moveToEndOf, focusText, event, state)
  }

  if (isAtEndOfCurrentTextNode) {
    return editor.command(moveToStartOf, upcomingNode, event, state)
  }
}

/**
 * Determines behavior if the caret is currently inside of an inline, while arrowing to the right
 *
 * @param {Event} event
 * @param {Editor} editor
 * @param {function} next
 * @param {Object} opts
 * @param {Object} state
 * @return {Null | Editor}
 */

function handleArrowRightInsideInline(event, editor, next, opts, state) {
  const { document, selection, focusInline } = editor.value
  const isExtending = event.shiftKey
  const { hasStickyBoundaries } = opts

  // In normal slate inline world, these two boundaries are the true start/end of an Inline.
  // Since you can never actually move to the start or end of an inline (that's what we are fixing after all!)
  const isAtSecondToLastCharacter = selection.focus.offset === focusInline.text.length - 1

  // Thanks to this very plugin, it's common to be in this editor.value where you are at the edge of an inline.
  const isAtLastCharacter = selection.focus.offset === focusInline.text.length

  const inlinePath = document.getPath(focusInline)
  const upcomingNode = document.getNextSibling(inlinePath)

  // We are on an edge on the inside of an inline.  If they don't want sticky boundaries, or if they are extending,
  // then it doesn't stick here.
  if (isAtLastCharacter && upcomingNode && hasStickyBoundaries && !isExtending) {
    return editor.command(moveToStartOf, upcomingNode, event, state)
  }

  // In this case they are attempting to leave an artifact so we should make sure that
  // Is a smooth process
  if (upcomingNode && focusInline.text === ZERO_WIDTH_SPACE) {
    return editor.command(moveToStartOf, upcomingNode, event, state, 1)
  }

  if (isAtSecondToLastCharacter) {
    return editor.command(moveToEndOf, focusInline, event, state)
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
 * @param {Object} state
 * @return {Null}
 */

export default function onArrowRight(event, editor, next, opts, state) {
  if (event.ctrlKey) return next()

  // In these cases we are actually inside the inline.
  if (editor.value.focusInline) return handleArrowRightInsideInline(event, editor, next, opts, state)

  return handleArrowRightOutsideInline(event, editor, next, opts, state)
}
