import { useState, useRef } from "react";
import {
  BoldIcon,
  ItalicIcon,
  ListBulletIcon,
  EyeIcon,
  PencilIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import AIModal from "./AIModal";
import { aiApi } from "../lib/api";

interface TextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function TextEditor({
  value,
  onChange,
  placeholder = "Enter content...",
  className = "",
}: TextEditorProps) {
  const [isPreview, setIsPreview] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [showAITab, setShowAITab] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ top: 0, left: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // inside TextEditor component
  const aiButtonRef = useRef<HTMLButtonElement>(null);

  const handleOpenAI = () => {
    if (aiButtonRef.current) {
      const rect = aiButtonRef.current.getBoundingClientRect();
      setCursorPosition({
        top: rect.bottom + window.scrollY, // just below button
        left: rect.left + window.scrollX, // align with button
      });
    }
    setShowAIPanel(true);
  };

  // Handle cursor position and selection for AI panel
  const handleTextareaClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const rect = textarea.getBoundingClientRect();

    // Get mouse position relative to the textarea
    const relativeX = e.clientX - rect.left;
    const relativeY = e.clientY - rect.top;

    setCursorPosition({
      top: relativeY - 10, // Position above the click
      left: relativeX + 10, // Position to the right of the click
    });

    setShowAITab(true);

    // Also update selection
    updateCursorPosition(e);
  };

  const handleTextareaKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    updateCursorPosition(e);
  };

  const handleTextareaFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    updateCursorPosition(e);
  };

  const handleTextareaMouseMove = (
    e: React.MouseEvent<HTMLTextAreaElement>
  ) => {
    updateCursorPosition(e);
  };

  const handleTextareaBlur = () => {
    // Hide AI tab when textarea loses focus
    setShowAITab(false);
  };

  const updateCursorPosition = (
    e:
      | React.MouseEvent<HTMLTextAreaElement>
      | React.KeyboardEvent<HTMLTextAreaElement>
      | React.FocusEvent<HTMLTextAreaElement>
  ) => {
    if (!textareaRef.current) return;

    // Clear existing timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Debounce the update to prevent excessive re-renders
    updateTimeoutRef.current = setTimeout(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      setSelectedText(value.substring(start, end));
      setShowAITab(true);
    }, 0); // 100ms debounce
  };

  // AI functionality with real OpenAI API
  const handleAIEdit = async (prompt: string) => {
    setIsAILoading(true);

    try {
      let editedText = value;

      if (selectedText) {
        // If text is selected, apply AI to that specific text
        const response = await aiApi.editText({
          selectedText,
          prompt,
        });

        if (response.data.success) {
          editedText = value.replace(selectedText, response.data.editedText);
        } else {
          throw new Error(response.data.error || "AI edit failed");
        }
      } else {
        // If no text selected, apply AI to entire content
        const response = await aiApi.editText({
          text: value,
          prompt,
        });

        if (response.data.success) {
          editedText = response.data.editedText;
        } else {
          throw new Error(response.data.error || "AI edit failed");
        }
      }

      onChange(editedText);
      setShowAIPanel(false);
      setSelectedText(""); // Clear selection after successful edit
    } catch (error: any) {
      console.error("AI edit failed:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "AI edit failed. Please try again.";
      alert(errorMessage);
    } finally {
      setIsAILoading(false);
    }
  };

  const formatText = (format: string) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    let formattedText = selectedText;
    let newValue = value;

    switch (format) {
      case "bold":
        formattedText = `**${selectedText || "bold text"}**`;
        break;
      case "italic":
        formattedText = `*${selectedText || "italic text"}*`;
        break;
      case "bullet":
        formattedText = selectedText
          ? selectedText
              .split("\n")
              .map((line) => (line.trim() ? `• ${line}` : line))
              .join("\n")
          : "• List item";
        break;
      case "numbered":
        formattedText = selectedText
          ? selectedText
              .split("\n")
              .map((line, i) => (line.trim() ? `${i + 1}. ${line}` : line))
              .join("\n")
          : "1. List item";
        break;
    }

    newValue = value.substring(0, start) + formattedText + value.substring(end);
    onChange(newValue);

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + formattedText.length);
    }, 0);
  };

  const renderPreview = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/^• (.+)$/gm, "<li>$1</li>")
      .replace(/^(\d+)\. (.+)$/gm, "<li>$1. $2</li>")
      .replace(/\n/g, "<br>")
      .replace(/(<li>.*<\/li>)/, "<ul>$1</ul>");
  };
  function getCaretCoordinates(
    textarea: HTMLTextAreaElement,
    position: number
  ) {
    const div = document.createElement("div");
    const style = getComputedStyle(textarea);
    // Copy textarea styles to mirror div
    for (let i = 0; i < style.length; i++) {
      const prop = style[i];
      (div.style as any)[prop] = (style as any)[prop];
    }

    div.style.position = "absolute";
    div.style.visibility = "hidden";
    div.style.whiteSpace = "pre-wrap";
    div.style.wordWrap = "break-word";
    div.style.overflow = "hidden";
    div.style.height = "auto";
    div.style.width = `${textarea.offsetWidth}px`;

    // Insert text up to caret
    const before = textarea.value.substring(0, position);
    const after = textarea.value.substring(position) || ".";

    div.textContent = before;

    // Caret marker
    const span = document.createElement("span");
    span.textContent = after[0];
    div.appendChild(span);

    document.body.appendChild(div);

    const rect = span.getBoundingClientRect();
    const textareaRect = textarea.getBoundingClientRect();

    document.body.removeChild(div);

    return {
      top: rect.top - textareaRect.top + textarea.scrollTop,
      left: rect.left - textareaRect.left + textarea.scrollLeft,
    };
  }

  return (
    <div className={`border border-gray-300 rounded-lg ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2 bg-gray-50 rounded-t-lg">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => formatText("bold")}
            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
            title="Bold (Ctrl+B)"
          >
            <BoldIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => formatText("italic")}
            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
            title="Italic (Ctrl+I)"
          >
            <ItalicIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => formatText("bullet")}
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
                ? "bg-primary-100 text-primary-700"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
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
          <div className="relative">
            <textarea
              ref={textareaRef}
              id="editor-textarea"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="w-full min-h-40 p-4 border-0 resize-none focus:ring-0 focus:outline-none text-sm"
              onClick={handleTextareaClick}
              onFocus={handleTextareaFocus}
              onBlur={handleTextareaBlur}
              onMouseMove={handleTextareaMouseMove}
              onKeyUp={handleTextareaKeyUp}
              onKeyDown={(e) => {
                if (e.ctrlKey || e.metaKey) {
                  if (e.key === "b") {
                    e.preventDefault();
                    formatText("bold");
                  } else if (e.key === "i") {
                    e.preventDefault();
                    formatText("italic");
                  } else if (e.key === "k") {
                    e.preventDefault();
                    setShowAIPanel(true);
                  }
                }
              }}
            />

            {/* AI Tab - follows cursor position */}
            {!showAIPanel && showAITab && (
              <button
                ref={aiButtonRef}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault(); // prevent textarea blur
                  handleOpenAI();
                }}
                className="absolute bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center space-x-1 z-10"
                style={{
                  top: `${cursorPosition.top}px`,
                  left: `${cursorPosition.left}px`,
                }}
                title="Ask with AI (Ctrl+K)"
              >
                <SparklesIcon className="h-3 w-3" />
                <span>Ask with AI</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Help Text */}
      {!isPreview && (
        <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <p className="text-xs text-gray-500">
            Use **bold**, *italic*, or • for bullet points. Ctrl+B for bold,
            Ctrl+I for italic, Ctrl+K for AI editing.
          </p>
        </div>
      )}

      {/* AI Modal */}
      <AIModal
        isOpen={showAIPanel}
        onClose={() => setShowAIPanel(false)}
        onApply={handleAIEdit}
        selectedText={selectedText}
        isLoading={isAILoading}
      />
    </div>
  );
}
