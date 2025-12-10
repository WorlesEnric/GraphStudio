/**
 * MIME Type Utilities
 * Maps file extensions to MIME types and provides file type detection
 */

/**
 * Extension to MIME type mapping
 */
export const MIME_TYPES = {
    // Images
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.bmp': 'image/bmp',

    // Documents
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',

    // Text
    '.txt': 'text/plain',
    '.md': 'text/markdown',
    '.markdown': 'text/markdown',
    '.html': 'text/html',
    '.htm': 'text/html',
    '.css': 'text/css',
    '.csv': 'text/csv',
    '.xml': 'application/xml',

    // Code
    '.js': 'text/javascript',
    '.jsx': 'text/javascript',
    '.ts': 'text/typescript',
    '.tsx': 'text/typescript',
    '.json': 'application/json',
    '.py': 'text/x-python',
    '.java': 'text/x-java',
    '.c': 'text/x-c',
    '.cpp': 'text/x-c++',
    '.h': 'text/x-c',
    '.hpp': 'text/x-c++',
    '.cs': 'text/x-csharp',
    '.go': 'text/x-go',
    '.rs': 'text/x-rust',
    '.rb': 'text/x-ruby',
    '.php': 'text/x-php',
    '.swift': 'text/x-swift',
    '.kt': 'text/x-kotlin',
    '.scala': 'text/x-scala',
    '.sql': 'application/sql',
    '.sh': 'application/x-sh',
    '.bash': 'application/x-sh',
    '.zsh': 'application/x-sh',
    '.yaml': 'application/x-yaml',
    '.yml': 'application/x-yaml',
    '.toml': 'application/toml',

    // Archives
    '.zip': 'application/zip',
    '.rar': 'application/x-rar-compressed',
    '.7z': 'application/x-7z-compressed',
    '.tar': 'application/x-tar',
    '.gz': 'application/gzip',

    // Audio
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.flac': 'audio/flac',
    '.m4a': 'audio/mp4',

    // Video
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.avi': 'video/x-msvideo',
    '.mov': 'video/quicktime',
    '.mkv': 'video/x-matroska',

    // Fonts
    '.ttf': 'font/ttf',
    '.otf': 'font/otf',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',

    // Other
    '.wasm': 'application/wasm',
};

/**
 * File category definitions
 */
export const FILE_CATEGORIES = {
    image: {
        label: 'Images',
        color: 'purple',
        extensions: ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico', '.bmp'],
    },
    document: {
        label: 'Documents',
        color: 'red',
        extensions: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'],
    },
    text: {
        label: 'Text',
        color: 'blue',
        extensions: ['.txt', '.md', '.markdown', '.html', '.htm', '.css', '.csv', '.xml'],
    },
    code: {
        label: 'Code',
        color: 'green',
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.json', '.py', '.java', '.c', '.cpp', '.go', '.rs', '.rb', '.php'],
    },
    archive: {
        label: 'Archives',
        color: 'yellow',
        extensions: ['.zip', '.rar', '.7z', '.tar', '.gz'],
    },
    audio: {
        label: 'Audio',
        color: 'pink',
        extensions: ['.mp3', '.wav', '.ogg', '.flac', '.m4a'],
    },
    video: {
        label: 'Video',
        color: 'orange',
        extensions: ['.mp4', '.webm', '.avi', '.mov', '.mkv'],
    },
};

/**
 * Get MIME type from filename
 * @param {string} filename 
 * @returns {string}
 */
export function getMimeType(filename) {
    if (!filename) return 'application/octet-stream';

    const ext = '.' + filename.split('.').pop()?.toLowerCase();
    return MIME_TYPES[ext] || 'application/octet-stream';
}

/**
 * Get file category from filename or MIME type
 * @param {string} filename 
 * @param {string} mimeType 
 * @returns {string}
 */
export function getFileCategory(filename, mimeType) {
    // Check by MIME type first
    if (mimeType) {
        if (mimeType.startsWith('image/')) return 'image';
        if (mimeType.startsWith('audio/')) return 'audio';
        if (mimeType.startsWith('video/')) return 'video';
        if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('sheet') || mimeType.includes('presentation')) return 'document';
        if (mimeType.startsWith('text/') || mimeType.includes('json') || mimeType.includes('xml')) return 'text';
        if (mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('rar') || mimeType.includes('7z')) return 'archive';
    }

    // Check by extension
    if (filename) {
        const ext = '.' + filename.split('.').pop()?.toLowerCase();

        for (const [category, config] of Object.entries(FILE_CATEGORIES)) {
            if (config.extensions.includes(ext)) {
                return category;
            }
        }
    }

    return 'other';
}

/**
 * Check if file is readable as text
 * @param {string} mimeType 
 * @returns {boolean}
 */
export function isTextFile(mimeType) {
    if (!mimeType) return false;

    return (
        mimeType.startsWith('text/') ||
        mimeType === 'application/json' ||
        mimeType === 'application/xml' ||
        mimeType === 'application/javascript' ||
        mimeType === 'application/x-yaml' ||
        mimeType === 'application/sql'
    );
}

/**
 * Check if file is an image
 * @param {string} mimeType 
 * @returns {boolean}
 */
export function isImageFile(mimeType) {
    return mimeType?.startsWith('image/') || false;
}

/**
 * Check if file is previewable
 * @param {string} mimeType 
 * @returns {boolean}
 */
export function isPreviewable(mimeType) {
    return isImageFile(mimeType) || isTextFile(mimeType) || mimeType === 'application/pdf';
}

/**
 * Get file extension from filename
 * @param {string} filename 
 * @returns {string}
 */
export function getFileExtension(filename) {
    if (!filename) return '';
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
}

export default {
    MIME_TYPES,
    FILE_CATEGORIES,
    getMimeType,
    getFileCategory,
    isTextFile,
    isImageFile,
    isPreviewable,
    getFileExtension,
};