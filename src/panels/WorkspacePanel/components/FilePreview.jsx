/**
 * FilePreview Component
 * Modal for previewing file contents
 */

import React, { memo, useEffect } from 'react';
import { X, Download, ChevronLeft, ChevronRight, Loader2, AlertCircle, Maximize2, Minimize2 } from 'lucide-react';
import FileIcon from './FileIcon';
import { formatFileSize, formatDate, downloadFile } from '../utils/fileUtils';
import { isImageFile, isTextFile } from '../utils/mimeTypes';

/**
 * Image preview component
 */
function ImagePreview({ src, alt }) {
    return (
        <div className="flex items-center justify-center h-full p-4">
            <img
                src={src}
                alt={alt}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
        </div>
    );
}

/**
 * Text preview component
 */
function TextPreview({ content, fileName }) {
    // Determine language for syntax highlighting hint
    const getLanguageHint = () => {
        const ext = fileName?.split('.').pop()?.toLowerCase();
        switch (ext) {
            case 'js':
            case 'jsx':
                return 'JavaScript';
            case 'ts':
            case 'tsx':
                return 'TypeScript';
            case 'py':
                return 'Python';
            case 'json':
                return 'JSON';
            case 'html':
                return 'HTML';
            case 'css':
                return 'CSS';
            case 'md':
                return 'Markdown';
            default:
                return 'Plain Text';
        }
    };

    return (
        <div className="h-full flex flex-col">
            <div className="px-4 py-2 bg-zinc-800/50 border-b border-white/5 text-xs text-zinc-500">
                {getLanguageHint()}
            </div>
            <pre className="flex-1 overflow-auto p-4 text-sm text-zinc-300 font-mono whitespace-pre-wrap">
                {content}
            </pre>
        </div>
    );
}

/**
 * PDF preview component
 */
function PDFPreview({ file }) {
    const src = file.preview || (file.file ? URL.createObjectURL(file.file) : null);

    if (!src) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-zinc-500">PDF preview not available</p>
            </div>
        );
    }

    return (
        <iframe
            src={src}
            className="w-full h-full border-0"
            title={file.name}
        />
    );
}

/**
 * Unsupported file preview
 */
function UnsupportedPreview({ file }) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <FileIcon file={file} size={64} className="mb-4 opacity-50" />
            <h3 className="text-lg text-zinc-300 font-medium mb-2">{file.name}</h3>
            <p className="text-sm text-zinc-500 mb-4">
                Preview not available for this file type
            </p>
            <button
                onClick={() => downloadFile(file)}
                className="flex items-center gap-2 px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-400 transition-colors"
            >
                <Download size={16} />
                Download File
            </button>
        </div>
    );
}

/**
 * FilePreview modal component
 */
function FilePreview({
    isOpen,
    file,
    content,
    isLoading,
    error,
    onClose,
    onPrevious,
    onNext,
    hasPrevious = false,
    hasNext = false,
}) {
    const [isFullscreen, setIsFullscreen] = React.useState(false);

    // Handle keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            switch (e.key) {
                case 'Escape':
                    onClose?.();
                    break;
                case 'ArrowLeft':
                    if (hasPrevious) onPrevious?.();
                    break;
                case 'ArrowRight':
                    if (hasNext) onNext?.();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, hasPrevious, hasNext, onClose, onPrevious, onNext]);

    if (!isOpen || !file) return null;

    const isImage = isImageFile(file.type);
    const isText = isTextFile(file.type);
    const isPDF = file.type === 'application/pdf';

    // Render preview content
    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex items-center justify-center h-full">
                    <Loader2 size={32} className="text-violet-400 animate-spin" />
                </div>
            );
        }

        if (error) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <AlertCircle size={48} className="text-red-400 mb-4" />
                    <p className="text-red-300">{error}</p>
                </div>
            );
        }

        if (isImage && content) {
            return <ImagePreview src={content} alt={file.name} />;
        }

        if (isText && content) {
            return <TextPreview content={content} fileName={file.name} />;
        }

        if (isPDF) {
            return <PDFPreview file={file} />;
        }

        return <UnsupportedPreview file={file} />;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className={`
          relative bg-zinc-900 rounded-xl border border-white/10 shadow-2xl flex flex-col overflow-hidden
          ${isFullscreen ? 'w-full h-full m-0 rounded-none' : 'w-[90vw] h-[85vh] max-w-6xl'}
        `}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-zinc-800/50 flex-shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <FileIcon file={file} size={20} />
                        <div className="min-w-0">
                            <h3 className="text-sm text-white font-medium truncate">{file.name}</h3>
                            <p className="text-xs text-zinc-500">
                                {formatFileSize(file.size)} • {formatDate(file.lastModified)}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => downloadFile(file)}
                            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                            title="Download"
                        >
                            <Download size={18} />
                        </button>

                        <button
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                        >
                            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                        </button>

                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                            title="Close"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden bg-zinc-950">
                    {renderContent()}
                </div>

                {/* Navigation */}
                {(hasPrevious || hasNext) && (
                    <>
                        {hasPrevious && (
                            <button
                                onClick={onPrevious}
                                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors backdrop-blur-sm"
                                title="Previous (←)"
                            >
                                <ChevronLeft size={24} />
                            </button>
                        )}
                        {hasNext && (
                            <button
                                onClick={onNext}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors backdrop-blur-sm"
                                title="Next (→)"
                            >
                                <ChevronRight size={24} />
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default memo(FilePreview);