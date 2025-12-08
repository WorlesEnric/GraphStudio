import React, { useState } from 'react';
import { Kanban, Plus, MoreHorizontal, Trash2, Edit2, GripVertical, Tag, User, Calendar } from 'lucide-react';
import { createPanelDefinition, PanelCategories, ContentTypes } from './BasePanelInterface';

/**
 * Dummy Kanban Panel - Demonstrates the panel interface for Kanban boards
 */

// Task card component
function TaskCard({ task, onDelete, onEdit }) {
  const priorityColors = {
    high: 'bg-red-500',
    medium: 'bg-amber-500',
    low: 'bg-green-500',
  };
  
  return (
    <div className="group p-3 rounded-xl bg-zinc-800/50 border border-white/5 hover:border-white/10 cursor-grab active:cursor-grabbing transition-all hover:shadow-lg">
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-medium text-zinc-200 flex-1">{task.title}</h4>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="p-1 rounded text-zinc-500 hover:text-white hover:bg-white/10"
          >
            <Edit2 size={12} />
          </button>
          <button
            onClick={onDelete}
            className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
      
      {task.description && (
        <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{task.description}</p>
      )}
      
      <div className="flex items-center gap-2 mt-3">
        {task.priority && (
          <span className={`w-2 h-2 rounded-full ${priorityColors[task.priority]}`} title={`${task.priority} priority`} />
        )}
        {task.tags?.map((tag, i) => (
          <span key={i} className="px-2 py-0.5 text-xs rounded-full bg-violet-500/20 text-violet-300">
            {tag}
          </span>
        ))}
        {task.assignee && (
          <span className="ml-auto flex items-center gap-1 text-xs text-zinc-500">
            <User size={10} />
            {task.assignee}
          </span>
        )}
      </div>
    </div>
  );
}

// Column component
function KanbanColumn({ column, tasks, onAddTask, onDeleteTask, onEditColumn }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  
  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      onAddTask(newTaskTitle.trim());
      setNewTaskTitle('');
      setIsAdding(false);
    }
  };
  
  const columnColors = {
    todo: 'from-zinc-500 to-zinc-600',
    'in-progress': 'from-blue-500 to-blue-600',
    review: 'from-amber-500 to-amber-600',
    done: 'from-green-500 to-green-600',
  };
  
  return (
    <div className="flex-shrink-0 w-72 flex flex-col">
      {/* Column header */}
      <div className="flex items-center justify-between p-3 rounded-t-xl bg-zinc-800/80 border border-white/5 border-b-0">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${columnColors[column.id] || columnColors.todo}`} />
          <h3 className="text-sm font-semibold text-zinc-200">{column.title}</h3>
          <span className="px-1.5 py-0.5 text-xs rounded bg-white/10 text-zinc-400">
            {tasks.length}
          </span>
        </div>
        <button className="p-1 rounded text-zinc-500 hover:text-white hover:bg-white/10">
          <MoreHorizontal size={14} />
        </button>
      </div>
      
      {/* Tasks list */}
      <div className="flex-1 p-2 space-y-2 rounded-b-xl bg-zinc-900/50 border border-white/5 border-t-0 overflow-y-auto min-h-[200px]">
        {tasks.map(task => (
          <TaskCard 
            key={task.id} 
            task={task}
            onDelete={() => onDeleteTask(task.id)}
            onEdit={() => {}}
          />
        ))}
        
        {/* Add task form */}
        {isAdding ? (
          <div className="p-2 rounded-xl bg-zinc-800 border border-violet-500/30">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
              placeholder="Task title..."
              className="w-full text-sm text-white placeholder-zinc-500 bg-transparent"
              autoFocus
            />
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={handleAddTask}
                className="px-3 py-1 text-xs font-medium rounded bg-violet-500 text-white hover:bg-violet-400"
              >
                Add
              </button>
              <button
                onClick={() => { setIsAdding(false); setNewTaskTitle(''); }}
                className="px-3 py-1 text-xs font-medium rounded text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full flex items-center justify-center gap-2 p-2 rounded-xl border-2 border-dashed border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-400 transition-colors"
          >
            <Plus size={14} />
            <span className="text-sm">Add task</span>
          </button>
        )}
      </div>
    </div>
  );
}

// Main View Component
function KanbanMainView({ panelState, updateState, isFocused }) {
  const [columns] = useState([
    { id: 'todo', title: 'To Do' },
    { id: 'in-progress', title: 'In Progress' },
    { id: 'review', title: 'Review' },
    { id: 'done', title: 'Done' },
  ]);
  
  const [tasks, setTasks] = useState(panelState?.tasks || [
    { id: '1', title: 'Design panel interface', description: 'Create the IStudioPanel interface', columnId: 'done', priority: 'high', tags: ['design'] },
    { id: '2', title: 'Implement Canvas panel', description: 'Build the shape drawing canvas', columnId: 'in-progress', priority: 'high', tags: ['dev'], assignee: 'You' },
    { id: '3', title: 'Add drag & drop', description: 'Enable cross-panel drag and drop', columnId: 'todo', priority: 'medium', tags: ['feature'] },
    { id: '4', title: 'Write documentation', description: 'Document the panel interface', columnId: 'todo', priority: 'low', tags: ['docs'] },
    { id: '5', title: 'Review AI context flow', description: 'Check the getLLMContext implementation', columnId: 'review', priority: 'medium', tags: ['review'] },
  ]);
  
  const getColumnTasks = (columnId) => tasks.filter(t => t.columnId === columnId);
  
  const addTask = (columnId, title) => {
    const newTask = {
      id: `task-${Date.now()}`,
      title,
      description: '',
      columnId,
      priority: 'medium',
      tags: [],
    };
    const updated = [...tasks, newTask];
    setTasks(updated);
    updateState?.({ tasks: updated });
  };
  
  const deleteTask = (taskId) => {
    const updated = tasks.filter(t => t.id !== taskId);
    setTasks(updated);
    updateState?.({ tasks: updated });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-semibold text-zinc-200">Project Board</h2>
          <span className="text-xs text-zinc-500">{tasks.length} tasks</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 text-xs font-medium rounded-lg bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 transition-colors flex items-center gap-1.5">
            <Plus size={12} />
            Add Column
          </button>
        </div>
      </div>
      
      {/* Board */}
      <div className="flex-1 overflow-x-auto p-4">
        <div className="flex gap-4 h-full min-w-max">
          {columns.map(column => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={getColumnTasks(column.id)}
              onAddTask={(title) => addTask(column.id, title)}
              onDeleteTask={deleteTask}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Panel Definition
const DummyKanbanPanel = createPanelDefinition({
  id: 'kanban',
  name: 'Kanban Board',
  description: 'Manage tasks with a Kanban board',
  icon: Kanban,
  category: PanelCategories.DATA,
  accentColor: 'green',
  
  renderMainView: (props) => <KanbanMainView {...props} />,
  
  getInitialState: () => ({
    tasks: [
      { id: '1', title: 'Design panel interface', description: 'Create the IStudioPanel interface', columnId: 'done', priority: 'high', tags: ['design'] },
      { id: '2', title: 'Implement Canvas panel', columnId: 'in-progress', priority: 'high', tags: ['dev'] },
      { id: '3', title: 'Add drag & drop', columnId: 'todo', priority: 'medium', tags: ['feature'] },
    ],
  }),
  
  getLLMContext: async (panelState) => {
    const tasks = panelState?.tasks || [];
    const byColumn = {
      todo: tasks.filter(t => t.columnId === 'todo'),
      'in-progress': tasks.filter(t => t.columnId === 'in-progress'),
      review: tasks.filter(t => t.columnId === 'review'),
      done: tasks.filter(t => t.columnId === 'done'),
    };
    
    return {
      contentType: 'dsl/kanban',
      data: {
        type: 'kanban',
        totalTasks: tasks.length,
        columns: byColumn,
      },
      schemaVersion: '1.0',
    };
  },
  
  applyLLMChange: async (panelState, updateState, dslDiff) => {
    if (dslDiff.addTask) {
      const tasks = [...(panelState?.tasks || []), {
        id: `task-${Date.now()}`,
        ...dslDiff.addTask,
      }];
      updateState({ tasks });
      return true;
    }
    return false;
  },
  
  dropZone: {
    acceptTypes: [ContentTypes.TEXT_PLAIN, ContentTypes.JSON],
    onDrop: (data, panelState, updateState) => {
      console.log('Kanban received drop:', data);
    },
  },
  
  exportFormats: [
    { format: 'json', label: 'JSON', mimeType: 'application/json' },
    { format: 'csv', label: 'CSV', mimeType: 'text/csv' },
  ],
  
  actions: [
    { id: 'kanban.add-task', label: 'Add New Task', category: 'Kanban' },
    { id: 'kanban.add-column', label: 'Add New Column', category: 'Kanban' },
    { id: 'kanban.export', label: 'Export Board', category: 'Kanban' },
  ],
});

export default DummyKanbanPanel;