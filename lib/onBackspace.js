import { ARROW_LEFT, ARROW_RIGHT, BACKSPACE, DELETE, ZERO_WIDTH_SPACE } from './constants'
import { isInlineBanned } from './utils'

/**
 * Sticky Backspace Link logic
 *
 * @param {Event} event
 * @param {Editor} editor
 * @param {function} next
 * @param {Objects} opts
 * @return {Null | Change}
 */

export default function onBackspace(event, editor, next, opts) {
  const { canBeEmpty, stickOnDelete } = opts
  const { document, selection, focusInline } = editor.value
  if (selection.isExpanded) return next()

  // Logic for backspacing "into" a sticky inline
  const isAtStartOfCurrentTextNode = !focusInline && editor.value.selection.focus.offset === 0

  if (isAtStartOfCurrentTextNode && stickOnDelete) {
    const upcomingNode = document.getPreviousSibling(selection.focus.path)
    if (isInlineBanned(editor, upcomingNode, opts)) return next()

    event.preventDefault()
    return editor.moveToEndOfNode(upcomingNode).deleteBackward()
  }

  // Logic for deleting inside the sticky inline
  if (!focusInline || !canBeEmpty) return next()
  if (focusInline.text.length === 1 && focusInline.text === ZERO_WIDTH_SPACE) return next()

  if (focusInline.text.length !== 1) return next()
  event.preventDefault()
  return editor.insertText(ZERO_WIDTH_SPACE).moveBackward(1).deleteBackward().moveForward(1)
}
