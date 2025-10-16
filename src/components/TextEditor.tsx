import React, { useState, useRef, useEffect } from 'react'

/**
 * TextEditor Component (PR-25)
 * Contenteditable overlay for editing text shapes on double-click
 */

interface TextEditorProps {
  initialText: string
  x: number // screen position (already transformed by viewport)
  y: number
  width: number
  fontFamily?: string
  fontSize?: number
  fontWeight?: 'normal' | 'bold'
  fontStyle?: 'normal' | 'italic'
  textAlign?: 'left' | 'center' | 'right'
  fill: string
  onSave: (newText: string) => void
  onCancel: () => void
}

export const TextEditor: React.FC<TextEditorProps> = ({
  initialText,
  x,
  y,
  width,
  fontFamily = 'Inter, sans-serif',
  fontSize = 20,
  fontWeight = 'normal',
  fontStyle = 'normal',
  textAlign = 'left',
  fill,
  onSave,
  onCancel,
}) => {
  const [text, setText] = useState(initialText)
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Auto-focus and select all text
    if (editorRef.current) {
      editorRef.current.focus()
      
      // Select all text
      const range = document.createRange()
      range.selectNodeContents(editorRef.current)
      const selection = window.getSelection()
      selection?.removeAllRanges()
      selection?.addRange(range)
    }
  }, [])

  const handleBlur = () => {
    const trimmedText = text.trim()
    if (trimmedText && trimmedText !== initialText.trim()) {
      onSave(trimmedText)
    } else if (trimmedText) {
      // Text unchanged
      onCancel()
    } else {
      // Empty text - cancel
      onCancel()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
    }
    // Allow Enter for multi-line text
  }

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    setText(e.currentTarget.textContent || '')
  }

  return (
    <div
      className="absolute bg-white border-2 border-blue-500 rounded shadow-lg z-[1000]"
      style={{
        left: x,
        top: y,
        width: width,
      }}
    >
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        className="px-2 py-1 min-h-[30px] outline-none whitespace-pre-wrap break-words overflow-hidden"
        style={{
          fontFamily,
          fontSize: `${fontSize}px`,
          fontWeight,
          fontStyle,
          textAlign: textAlign as any,
          color: fill.slice(0, 7), // Remove alpha for text color
          lineHeight: '1.2',
        }}
      >
        {initialText}
      </div>
      <div className="text-xs text-gray-500 px-2 pb-1 border-t bg-gray-50">
        Press Esc to cancel • Click outside to save
      </div>
    </div>
  )
}


