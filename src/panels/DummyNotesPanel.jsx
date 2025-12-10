import React, { useState } from 'react';
import { FileText, Plus, Search, Trash2, GripVertical, ChevronRight, File, Folder, Star, Clock } from 'lucide-react';
import { createPanelDefinition, PanelCategories, ContentTypes } from './BasePanelInterface';

/**
 * Dummy Notes Panel - Demonstrates the panel interface for source/notes management
 */

// Note item component
function NoteItem({ note, isSelected, onSelect, onDelete }) {
  return (
    <div
      onClick={onSelect}
      className={`
        group flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all
        ${isSelected
          ? 'bg-amber-500/10 border border-amber-500/30'
          : 'hover:bg-white/5 border border-transparent'
        }
      `}
    >
      <div className="p-2 rounded-lg bg-amber-500/10">
        <File size={14} className="text-amber-500" />
      </div>

      <div className="flex-1 min-w-0">
        <h4 className={`text-sm font-medium truncate ${isSelected ? 'text-amber-400' : 'text-zinc-200'}`}>
          {note.title}
        </h4>
        <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{note.content}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-zinc-600 flex items-center gap-1">
            <Clock size={10} />
            {new Date(note.updatedAt).toLocaleDateString()}
          </span>
          {note.starred && <Star size={10} className="text-amber-500 fill-amber-500" />}
        </div>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

// Main View Component
function NotesMainView({ panelState, updateState, isFocused }) {
  const [notes, setNotes] = useState(panelState?.notes || [
    { id: '1', title: 'Project Requirements', content: 'Build an AI-powered graphical IDE that supports flowcharts, Kanban boards, and more...', starred: true, updatedAt: Date.now() - 86400000 },
    { id: '2', title: 'Design Inspiration', content: 'Look at NotebookLM for panel layout ideas. Consider glass morphism effects...', starred: false, updatedAt: Date.now() - 172800000 },
    { id: '3', title: 'API Notes', content: 'The backend will use a DSL for unified modeling across all graphical types...', starred: false, updatedAt: Date.now() - 259200000 },
  ]);
  const [selectedId, setSelectedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingContent, setEditingContent] = useState('');

  const selectedNote = notes.find(n => n.id === selectedId);

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addNote = () => {
    const newNote = {
      id: `note-${Date.now()}`,
      title: 'Untitled Note',
      content: '',
      starred: false,
      updatedAt: Date.now(),
    };
    const updated = [newNote, ...notes];
    setNotes(updated);
    setSelectedId(newNote.id);
    setEditingContent('');
    updateState?.({ notes: updated });
  };

  const deleteNote = (id) => {
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    if (selectedId === id) {
      setSelectedId(null);
      setEditingContent('');
    }
    updateState?.({ notes: updated });
  };

  const updateNote = (id, changes) => {
    const updated = notes.map(n =>
      n.id === id ? { ...n, ...changes, updatedAt: Date.now() } : n
    );
    setNotes(updated);
    updateState?.({ notes: updated });
  };

  const handleContentChange = (content) => {
    setEditingContent(content);
    if (selectedId) {
      updateNote(selectedId, { content });
    }
  };

  const handleTitleChange = (title) => {
    if (selectedId) {
      updateNote(selectedId, { title });
    }
  };

  return (
    <div className="flex h-full">
      {/* Notes list */}
      <div className="w-64 flex-shrink-0 border-r border-white/5 flex flex-col">
        {/* Search */}
        <div className="p-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/30 border border-white/5">
            <Search size={14} className="text-zinc-500" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 text-sm text-white placeholder-zinc-500"
            />
          </div>
        </div>

        {/* Add button */}
        <div className="px-3 pb-2">
          <button
            onClick={addNote}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors text-sm font-medium"
          >
            <Plus size={14} />
            New Note
          </button>
        </div>

        {/* Notes list */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1 pb-4">
          {filteredNotes.map(note => (
            <NoteItem
              key={note.id}
              note={note}
              isSelected={selectedId === note.id}
              onSelect={() => {
                setSelectedId(note.id);
                setEditingContent(note.content);
              }}
              onDelete={() => deleteNote(note.id)}
            />
          ))}

          {filteredNotes.length === 0 && (
            <div className="text-center py-8 text-zinc-500">
              <FileText size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No notes found</p>
            </div>
          )}
        </div>
      </div>

      {/* Note editor */}
      <div className="flex-1 flex flex-col">
        {selectedNote ? (
          <>
            {/* Note header */}
            <div className="p-4 border-b border-white/5">
              <input
                type="text"
                value={selectedNote.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="text-lg font-semibold text-white bg-transparent w-full"
                placeholder="Note title..."
              />
              <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  Last edited {new Date(selectedNote.updatedAt).toLocaleString()}
                </span>
                <button
                  onClick={() => updateNote(selectedId, { starred: !selectedNote.starred })}
                  className={`flex items-center gap-1 ${selectedNote.starred ? 'text-amber-500' : ''}`}
                >
                  <Star size={12} className={selectedNote.starred ? 'fill-amber-500' : ''} />
                  {selectedNote.starred ? 'Starred' : 'Star'}
                </button>
              </div>
            </div>

            {/* Note content */}
            <textarea
              value={editingContent}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Start writing..."
              className="flex-1 p-4 text-sm text-zinc-200 bg-transparent resize-none leading-relaxed"
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
            <FileText size={48} className="mb-4 opacity-20" />
            <p className="text-sm">Select a note or create a new one</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Panel Definition
const DummyNotesPanel = createPanelDefinition({
  id: 'notes',
  name: 'Source Notes',
  description: 'Manage reference materials and notes',
  icon: FileText,
  category: PanelCategories.DATA,
  accentColor: 'amber',

  renderMainView: (props) => <NotesMainView {...props} />,

  getInitialState: () => ({
    notes: [
      { id: '1', title: 'Project Requirements', content: 'Build an AI-powered graphical IDE that supports flowcharts, Kanban boards, and more...', starred: true, updatedAt: Date.now() },
      { id: '2', title: 'Design Inspiration', content: 'Look at NotebookLM for panel layout ideas. Consider glass morphism effects...', starred: false, updatedAt: Date.now() - 86400000 },
    ],
  }),

  getLLMContext: async (panelState) => {
    const notes = panelState?.notes || [];
    return {
      contentType: 'text/plain',
      data: {
        type: 'notes',
        noteCount: notes.length,
        notes: notes.map(n => ({ title: n.title, content: n.content })),
      },
      schemaVersion: '1.0',
    };
  },

  getMCPTools: async () => [
    {
      name: 'create_note',
      description: 'Creates a new note with title and content',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Title of the note' },
          content: { type: 'string', description: 'Body code/text of the note' }
        },
        required: ['title']
      }
    }
  ],

  executeMCPTool: async (name, args, panelState, updateState) => {
    if (name === 'create_note') {
      const notes = [...(panelState?.notes || []), {
        id: `note-${Date.now()}`,
        title: args.title || 'Untitled',
        content: args.content || '',
        starred: false,
        updatedAt: Date.now(),
      }];
      updateState({ notes });
      return { success: true, message: `Created note: ${args.title}` };
    }
    throw new Error(`Unknown tool: ${name}`);
  },

  applyLLMChange: async (panelState, updateState, dslDiff) => {
    if (dslDiff.addNote) {
      const notes = [...(panelState?.notes || []), {
        id: `note-${Date.now()}`,
        ...dslDiff.addNote,
        updatedAt: Date.now(),
      }];
      updateState({ notes });
      return true;
    }
    return false;
  },

  dropZone: {
    acceptTypes: [ContentTypes.TEXT_PLAIN, ContentTypes.TEXT_MARKDOWN, ContentTypes.JSON],
    onDrop: (data, panelState, updateState) => {
      console.log('Notes received drop:', data);
    },
  },

  exportFormats: [
    { format: 'md', label: 'Markdown', mimeType: 'text/markdown' },
    { format: 'json', label: 'JSON', mimeType: 'application/json' },
  ],

  actions: [
    { id: 'notes.new', label: 'Create New Note', category: 'Notes' },
    { id: 'notes.search', label: 'Search Notes', category: 'Notes' },
    { id: 'notes.export-all', label: 'Export All Notes', category: 'Notes' },
  ],
});

export default DummyNotesPanel;