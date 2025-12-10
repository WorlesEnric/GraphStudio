/**
 * FileIcon Component
 * Displays appropriate icon based on file type
 */

import React, { memo } from 'react';
import {
    File,
    FileText,
    FileCode,
    FileJson,
    FileImage,
    FileVideo,
    FileAudio,
    FileArchive,
    FileSpreadsheet,
    Presentation,
    Folder,
    FolderOpen,
} from 'lucide-react';
import { getFileCategory, getFileExtension } from '../utils/mimeTypes';

/**
 * Get icon component and color for file type
 */
function getIconConfig(file) {
    const category = file.category || getFileCategory(file.name, file.type);
    const ext = getFileExtension(file.name);

    // Special handling for folders
    if (file.type === 'folder') {
        return {
            Icon: file.isOpen ? FolderOpen : Folder,
            color: 'text-yellow-400',
        };
    }

    // Handle by extension for specific files
    switch (ext) {
        case 'json':
            return { Icon: FileJson, color: 'text-yellow-400' };
        case 'md':
        case 'markdown':
            return { Icon: FileText, color: 'text-blue-400' };
        case 'js':
        case 'jsx':
        case 'ts':
        case 'tsx':
            return { Icon: FileCode, color: 'text-yellow-400' };
        case 'py':
            return { Icon: FileCode, color: 'text-blue-400' };
        case 'html':
        case 'htm':
            return { Icon: FileCode, color: 'text-orange-400' };
        case 'css':
        case 'scss':
        case 'sass':
            return { Icon: FileCode, color: 'text-pink-400' };
        case 'xls':
        case 'xlsx':
        case 'csv':
            return { Icon: FileSpreadsheet, color: 'text-green-400' };
        case 'ppt':
        case 'pptx':
            return { Icon: Presentation, color: 'text-orange-400' };
    }

    // Handle by category
    switch (category) {
        case 'image':
            return { Icon: FileImage, color: 'text-purple-400' };
        case 'video':
            return { Icon: FileVideo, color: 'text-pink-400' };
        case 'audio':
            return { Icon: FileAudio, color: 'text-green-400' };
        case 'archive':
            return { Icon: FileArchive, color: 'text-yellow-400' };
        case 'document':
            return { Icon: FileText, color: 'text-red-400' };
        case 'code':
        case 'text':
            return { Icon: FileCode, color: 'text-blue-400' };
        default:
            return { Icon: File, color: 'text-zinc-400' };
    }
}

/**
 * FileIcon component
 */
function FileIcon({ file, size = 20, className = '' }) {
    const { Icon, color } = getIconConfig(file);

    return (
        <Icon
            size={size}
            className={`${color} ${className}`}
        />
    );
}

export default memo(FileIcon);