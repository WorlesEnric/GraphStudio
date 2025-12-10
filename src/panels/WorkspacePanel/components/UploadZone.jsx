/**
 * UploadZone Component
 * Drag-and-drop overlay for file uploads
 */

import React, { memo } from 'react';
import { Upload, FileUp } from 'lucide-react';

/**
 * UploadZone overlay component
 */
function UploadZone({ isDragging }) {
    if (!isDragging) return null;

    return (
        <div className="absolute inset-0 z-50 m-2 rounded-xl border-2 border-dashed border-violet-500 bg-violet-500/10 backdrop-blur-sm flex items-center justify-center pointer-events-none animate-fadeIn">
            <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-violet-500/20 flex items-center justify-center">
                    <FileUp size={40} className="text-violet-400" />
                </div>
                <h3 className="text-lg font-semibold text-violet-200 mb-2">
                    Drop files to upload
                </h3>
                <p className="text-sm text-violet-300/70">
                    Release to add files to your workspace
                </p>
            </div>
        </div>
    );
}

export default memo(UploadZone);