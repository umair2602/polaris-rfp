import { useState } from 'react'
import { 
  BoldIcon, 
  ItalicIcon, 
  ListBulletIcon,
  EyeIcon,
  PencilIcon
} from '@heroicons/react/24/outline'

interface TextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export default function TextEditor({ value, onChange, placeholder = "Enter content...", className = "" }: TextEditorProps) {
  const [isPreview, setIsPreview] = useState(false)

  const formatText = (format: string) => {
    const textarea = document.getElementById('editor-textarea') as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    
    let formattedText = selectedText
    let newValue = value
    
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText || 'bold text'}**`
        break
      case 'italic':
        formattedText = `*${selectedText || 'italic text'}*`
        break
      case 'bullet':
        formattedText = selectedText 
          ? selectedText.split('\n').map(line => line.trim() ? `• ${line}` : line).join('\n')
          : '• List item'
        break
      case 'numbered':
        formattedText = selectedText 
          ? selectedText.split('\n').map((line, i) => line.trim() ? `${i + 1}. ${line}` : line).join('\n')
          : '1. List item'
        break
    }
    
    newValue = value.substring(0, start) + formattedText + value.substring(end)
    onChange(newValue)
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start, start + formattedText.length)
    }, 0)
  }

  const renderPreview = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^• (.+)$/gm, '<li>$1</li>')
      .replace(/^(\d+)\. (.+)$/gm, '<li>$1. $2</li>')
      .replace(/\n/g, '<br>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
  }

  return (
    <div className={`border border-gray-300 rounded-lg ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2 bg-gray-50 rounded-t-lg">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => formatText('bold')}
            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
            title="Bold (Ctrl+B)"
          >
            <BoldIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => formatText('italic')}
            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
            title="Italic (Ctrl+I)"
          >
            <ItalicIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => formatText('bullet')}
            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
            title="Bullet List"
          >
            <ListBulletIcon className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setIsPreview(!isPreview)}
            className={`flex items-center px-2 py-1 text-xs font-medium rounded transition-colors ${
              isPreview
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
            }`}
          >
            {isPreview ? (
              <>
                <PencilIcon className="h-3 w-3 mr-1" />
                Edit
              </>
            ) : (
              <>
                <EyeIcon className="h-3 w-3 mr-1" />
                Preview
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor/Preview Area */}
      <div className="relative">
        {isPreview ? (
          <div 
            className="min-h-40 p-4 prose max-w-none text-sm text-gray-700"
            dangerouslySetInnerHTML={{ __html: renderPreview(value) }}
          />
        ) : (
          <textarea
            id="editor-textarea"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full min-h-40 p-4 border-0 resize-none focus:ring-0 focus:outline-none text-sm"
            onKeyDown={(e) => {
              if (e.ctrlKey || e.metaKey) {
                if (e.key === 'b') {
                  e.preventDefault()
                  formatText('bold')
                } else if (e.key === 'i') {
                  e.preventDefault()
                  formatText('italic')
                }
              }
            }}
          />
        )}
      </div>

      {/* Help Text */}
      {!isPreview && (
        <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <p className="text-xs text-gray-500">
            Use **bold**, *italic*, or • for bullet points. Ctrl+B for bold, Ctrl+I for italic.
          </p>
        </div>
      )}
    </div>
  )
}