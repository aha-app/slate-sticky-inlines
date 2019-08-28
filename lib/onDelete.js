import { ARROW_LEFT, ARROW_RIGHT, BACKSPACE, DELETE, ZERO_WIDTH_SPACE } from './constants'
import { isInlineBanned } from './utils'

/**
 * Sticky Delete Link logic
 *
 * @param {Event} event
 * @param {Editor} editor
 * @param {function} next
 * @param {Objects} opts
 * @return {Any}
 */

export default function onDelete(event, editor, next, opts) {
  const { document, selection, focusInline, focusText } = editor.value

  const { canBeEmpty, stickOnDelete } = opts
  if (selection.isExpanded) return next()

  // Logic for deleting "into" a sticky inline
  const isAtEndOfCurrentTextNode = !focusInline && selection.focus.offset === focusText.text.length

  if (isAtEndOfCurrentTextNode && stickOnDelete) {
    const upcomingNode = document.getNextSibling(selection.focus.path)
    if (isInlineBanned(editor, upcomingNode, opts)) return next()

    event.preventDefault()
    return editor.moveToStartOfNode(upcomingNode).deleteForward()
  }

  // Logic for deleting inside the sticky inline
  if (!focusInline || !canBeEmpty) return next()
  if (focusInline.text.length === 1 && focusInline.text === ZERO_WIDTH_SPACE) return next()

  if (focusInline.text.length !== 1) return next()
  event.preventDefault()
  return editor.insertText(ZERO_WIDTH_SPACE).moveBackward(1).deleteBackward().moveForward(1)
}
