/**
 * ChatInput Component
 * Text input with attachments, send button, and keyboard shortcuts
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Send, Paperclip, Mic, Square, X, Image, FileText, File } from 'lucide-react';

/**
 * Attachment preview component
 */
function AttachmentPreview({ attachment, onRemove }) {
    const getIcon = () => {
        if (attachment.type?.startsWith('image/')) return <Image size={16} className="text-purple-400" />;
        if (attachment.type === 'application/pdf') return <FileText size={16} className="text-red-400" />;
        return <File size={16} className="text-zinc-400" />;
    };

    return (
        <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800/50 rounded-lg border border-white/5 group">
            {getIcon()}
            <span className="text-xs text-zinc-300 truncate max-w-[120px]">
                {attachment.name}
            </span>
            <button
                onClick={onRemove}
                className="p-0.5 rounded hover:bg-white/10 text-zinc-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <X size={12} />
            </button>
        </div>
    );
}

/**
 * ChatInput component
 */
function ChatInput({
    onSend,
    onStop,
    isLoading = false,
    disabled = false,
    placeholder = 'Type a message...',
}) {
    const [input, setInput] = useState('');
    const [attachments, setAttachments] = useState([]);
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);

    // Auto-resize textarea
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
        }
    }, [input]);

    // Handle send
    const handleSend = useCallback(() => {
        if ((!input.trim() && attachments.length === 0) || disabled) return;

        onSend(input.trim(), attachments);
        setInput('');
        setAttachments([]);

        // Reset textarea height
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    }, [input, attachments, disabled, onSend]);

    // Handle key down
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }, [handleSend]);

    // Handle file selection
    const handleFileSelect = useCallback((e) => {
        const files = Array.from(e.target.files || []);
        const newAttachments = files.map(file => ({
            id: `file-${Date.now()}-${Math.random()}`,
            name: file.name,
            type: file.type,
            size: file.size,
            file,
        }));
        setAttachments(prev => [...prev, ...newAttachments]);

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, []);

    // Remove attachment
    const removeAttachment = useCallback((id) => {
        setAttachments(prev => prev.filter(a => a.id !== id));
    }, []);

    const canSend = (input.trim() || attachments.length > 0) && !disabled;

    return (
        <div className="p-4 border-t border-white/5 bg-zinc-900/80 backdrop-blur-sm">
            {/* Attachments preview */}
            {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                    {attachments.map(attachment => (
                        <AttachmentPreview
                            key={attachment.id}
                            attachment={attachment}
                            onRemove={() => removeAttachment(attachment.id)}
                        />
                    ))}
                </div>
            )}

            {/* Input area */}
            <div className={`
        flex items-end gap-2 p-2 rounded-2xl bg-zinc-800/80 border transition-all
        ${disabled ? 'border-white/5 opacity-50' : 'border-white/10 focus-within:border-violet-500/50'}
        shadow-inner
      `}>
                {/* Attachment button */}
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="image/*,.pdf,.md,.txt,.json"
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled || isLoading}
                    className="p-2 rounded-full text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors disabled:opacity-50"
                >
                    <Paperclip size={18} />
                </button>

                {/* Text input */}
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={disabled}
                    rows={1}
                    className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 resize-none max-h-[200px] py-2 focus:outline-none disabled:cursor-not-allowed"
                    style={{ minHeight: '24px' }}
                />

                {/* Voice input button (placeholder) */}
                <button
                    disabled={disabled || isLoading}
                    className="p-2 rounded-full text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors disabled:opacity-50"
                >
                    <Mic size={18} />
                </button>

                {/* Send/Stop button */}
                {isLoading ? (
                    <button
                        onClick={onStop}
                        className="p-2 rounded-full bg-red-500 text-white hover:bg-red-400 transition-colors shadow-lg shadow-red-500/20"
                    >
                        <Square size={18} />
                    </button>
                ) : (
                    <button
                        onClick={handleSend}
                        disabled={!canSend}
                        className="p-2 rounded-full bg-violet-500 text-white hover:bg-violet-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-violet-500/20"
                    >
                        <Send size={18} />
                    </button>
                )}
            </div>

            {/* Keyboard hint */}
            <div className="flex justify-between items-center mt-2 px-1">
                <p className="text-[10px] text-zinc-600">
                    Press <kbd className="px-1 py-0.5 rounded bg-zinc-800 text-zinc-500 font-mono">Enter</kbd> to send,{' '}
                    <kbd className="px-1 py-0.5 rounded bg-zinc-800 text-zinc-500 font-mono">Shift+Enter</kbd> for new line
                </p>
            </div>
        </div>
    );
}

export default ChatInput;