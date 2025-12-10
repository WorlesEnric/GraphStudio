/**
 * AttachmentPreview Component
 * Displays file attachments in messages
 */

import React from 'react';
import { File, FileText, Image, Music, Video, Archive, X, Download } from 'lucide-react';

/**
 * Get icon for file type
 */
function getFileIcon(mimeType) {
    if (!mimeType) return File;

    if (mimeType.startsWith('image/')) return Image;
    if (mimeType.startsWith('video/')) return Video;
    if (mimeType.startsWith('audio/')) return Music;
    if (mimeType.includes('pdf')) return FileText;
    if (mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('rar')) return Archive;
    if (mimeType.startsWith('text/') || mimeType.includes('json')) return FileText;

    return File;
}

/**
 * Get color for file type
 */
function getFileColor(mimeType) {
    if (!mimeType) return 'text-zinc-400';

    if (mimeType.startsWith('image/')) return 'text-purple-400';
    if (mimeType.startsWith('video/')) return 'text-pink-400';
    if (mimeType.startsWith('audio/')) return 'text-green-400';
    if (mimeType.includes('pdf')) return 'text-red-400';
    if (mimeType.includes('zip') || mimeType.includes('tar')) return 'text-yellow-400';
    if (mimeType.startsWith('text/') || mimeType.includes('json')) return 'text-blue-400';

    return 'text-zinc-400';
}

/**
 * Format file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Image attachment preview
 */
function ImagePreview({ attachment }) {
    const src = attachment.preview || attachment.url;

    if (!src) {
        return (
            <div className="w-full h-32 bg-zinc-800 rounded-lg flex items-center justify-center">
                <Image size={24} className="text-zinc-600" />
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={attachment.name}
            className="w-full max-h-64 object-cover rounded-lg"
        />
    );
}

/**
 * Generic file attachment preview
 */
function FilePreview({ attachment }) {
    const Icon = getFileIcon(attachment.type);
    const colorClass = getFileColor(attachment.type);

    return (
        <div className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg border border-white/5">
            <div className={`p-2 rounded-lg bg-black/30 ${colorClass}`}>
                <Icon size={20} />
            </div>

            <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-200 font-medium truncate">
                    {attachment.name}
                </p>
                <p className="text-xs text-zinc-500">
                    {formatFileSize(attachment.size)}
                </p>
            </div>

            {attachment.url && (
                <a
                    href={attachment.url}
                    download={attachment.name}
                    className="p-2 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                >
                    <Download size={16} />
                </a>
            )}
        </div>
    );
}

/**
 * AttachmentPreview component
 */
function AttachmentPreview({ attachment, onRemove, showRemove = false }) {
    const isImage = attachment.type?.startsWith('image/');

    return (
        <div className="relative group">
            {isImage ? (
                <ImagePreview attachment={attachment} />
            ) : (
                <FilePreview attachment={attachment} />
            )}

            {showRemove && (
                <button
                    onClick={() => onRemove?.(attachment.id)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
                >
                    <X size={12} />
                </button>
            )}
        </div>
    );
}

/**
 * Multiple attachments display
 */
export function AttachmentList({ attachments, onRemove, showRemove = false }) {
    if (!attachments || attachments.length === 0) {
        return null;
    }

    // Group by type
    const images = attachments.filter(a => a.type?.startsWith('image/'));
    const files = attachments.filter(a => !a.type?.startsWith('image/'));

    return (
        <div className="space-y-2">
            {/* Image grid */}
            {images.length > 0 && (
                <div className={`grid gap-2 ${images.length === 1 ? 'grid-cols-1' :
                        images.length === 2 ? 'grid-cols-2' :
                            'grid-cols-3'
                    }`}>
                    {images.map(img => (
                        <AttachmentPreview
                            key={img.id}
                            attachment={img}
                            onRemove={onRemove}
                            showRemove={showRemove}
                        />
                    ))}
                </div>
            )}

            {/* File list */}
            {files.length > 0 && (
                <div className="space-y-2">
                    {files.map(file => (
                        <AttachmentPreview
                            key={file.id}
                            attachment={file}
                            onRemove={onRemove}
                            showRemove={showRemove}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default AttachmentPreview;