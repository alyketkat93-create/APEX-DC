'use client';

import React, { useState, useEffect } from 'react';
import { useProject } from '@/context/ProjectContext';
import { Task } from '@/types';
import { 
  CheckSquare, Plus, Search, Calendar, User, 
  Clock, AlertTriangle, CheckCircle2, ListFilter, Kanban
} from 'lucide-react';

export function TasksView() {
  const { currentProjectId, currentProject, language, t } = useProject();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  // Create Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDocRef, setNewDocRef] = useState('APX-KSP-03-MEP-MAT-0024-01');
  const [newAssignee, setNewAssignee] = useState('Eng. Aly Ketkat');
  const [newPriority, setNewPriority] = useState<any>('High');
  const [newDue, setNewDue] = useState(new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks?projectId=${currentProjectId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setTasks(json.data);
      }
    } catch (e) {
      console.error('Error fetching tasks', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [currentProjectId]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProjectId,
          taskNumber: `TSK-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          title: newTitle,
          description: newDesc,
          relatedDocumentType: 'Document Reference',
          relatedDocumentNumber: newDocRef,
          assignedTo: newAssignee,
          priority: newPriority,
          startDate: new Date().toISOString().split('T')[0],
          dueDate: newDue,
          status: 'To Do',
          checklist: [
            { id: '1', text: 'Review comments and draft action plan', done: false },
            { id: '2', text: 'Obtain engineer verification', done: false }
          ]
        }),
      });
      const json = await res.json();
      if (json.success) {
        setCreateModalOpen(false);
        setNewTitle('');
        setNewDesc('');
        fetchTasks();
      }
    } catch (err) {
      alert('Error creating task');
    }
  };

  const handleToggleChecklist = async (taskId: string, checkIndex: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const newChecklist = [...task.checklist];
    newChecklist[checkIndex].done = !newChecklist[checkIndex].done;

    const allDone = newChecklist.every(c => c.done);
    const newStatus = allDone ? 'Completed' : 'In Progress';

    try {
      await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: taskId,
          checklist: newChecklist,
          status: newStatus,
        }),
      });
      fetchTasks();
    } catch (e) {
      console.error('Error updating task checklist', e);
    }
  };

  const todoTasks = tasks.filter(t => t.status === 'To Do');
  const inProgressTasks = tasks.filter(t => t.status === 'In Progress' || t.status === 'Under Review');
  const completedTasks = tasks.filter(t => t.status === 'Completed');

  return (
    <div className="space-y-4">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-rose-600" />
            <h2 className="text-base font-bold text-slate-900">
              {language === 'ar' ? 'مهام العمل ومتابعة المستندات (Tasks & Workflows)' : 'Document Tasks & Workflows'}
            </h2>
            <span className="font-mono text-xs font-bold bg-rose-50 text-rose-800 px-2 py-0.5 rounded border border-rose-200">
              {tasks.length} Tasks
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Tasks linked to rejected inspections, consultant comments, NCRs, and submittal follow-ups
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-slate-300 p-0.5 bg-slate-50 text-xs font-semibold">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1 rounded-md transition flex items-center gap-1 ${viewMode === 'kanban' ? 'bg-white shadow-xs text-navy-950 font-bold' : 'text-slate-600'}`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-md transition flex items-center gap-1 ${viewMode === 'list' ? 'bg-white shadow-xs text-navy-950 font-bold' : 'text-slate-600'}`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>List View</span>
            </button>
          </div>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition shadow-xs active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Kanban Board View */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Column 1: To Do */}
          <div className="bg-slate-100/70 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between font-bold text-slate-700 pb-2 border-b border-slate-200">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                <span>To Do</span>
              </span>
              <span className="font-mono bg-white px-2 py-0.5 rounded text-slate-600">{todoTasks.length}</span>
            </div>

            <div className="space-y-3">
              {todoTasks.map(t => (
                <div key={t.id} className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[11px] text-slate-900">{t.taskNumber}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">{t.priority}</span>
                  </div>
                  <div className="font-bold text-slate-800">{t.title}</div>
                  <p className="text-[11px] text-slate-500 line-clamp-2">{t.description}</p>
                  {t.relatedDocumentNumber && (
                    <div className="text-[10px] font-mono text-amber-800 bg-amber-50 p-1 rounded truncate">
                      Linked: {t.relatedDocumentNumber}
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                    <span>{t.assignedTo}</span>
                    <span className="font-mono">Due: {t.dueDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: In Progress */}
          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200 space-y-3">
            <div className="flex items-center justify-between font-bold text-blue-900 pb-2 border-b border-blue-200">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <span>In Progress</span>
              </span>
              <span className="font-mono bg-white px-2 py-0.5 rounded text-blue-800">{inProgressTasks.length}</span>
            </div>

            <div className="space-y-3">
              {inProgressTasks.map(t => (
                <div key={t.id} className="bg-white p-3.5 rounded-lg border border-blue-100 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[11px] text-slate-900">{t.taskNumber}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800">{t.priority}</span>
                  </div>
                  <div className="font-bold text-slate-800">{t.title}</div>
                  <p className="text-[11px] text-slate-500 line-clamp-2">{t.description}</p>
                  
                  {/* Checklist Items */}
                  {t.checklist && t.checklist.length > 0 && (
                    <div className="space-y-1 pt-1">
                      {t.checklist.map((chk, idx) => (
                        <label key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={chk.done}
                            onChange={() => handleToggleChecklist(t.id, idx)}
                            className="w-3.5 h-3.5 text-blue-600 rounded"
                          />
                          <span className={chk.done ? 'line-through text-slate-400' : ''}>{chk.text}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                    <span>{t.assignedTo}</span>
                    <span className="font-mono text-red-600 font-bold">Due: {t.dueDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 3: Completed */}
          <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200 space-y-3">
            <div className="flex items-center justify-between font-bold text-emerald-900 pb-2 border-b border-emerald-200">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>Completed</span>
              </span>
              <span className="font-mono bg-white px-2 py-0.5 rounded text-emerald-800">{completedTasks.length}</span>
            </div>

            <div className="space-y-3">
              {completedTasks.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">No completed tasks yet</div>
              ) : (
                completedTasks.map(t => (
                  <div key={t.id} className="bg-white p-3.5 rounded-lg border border-emerald-100 shadow-xs space-y-1 opacity-80">
                    <div className="font-bold text-slate-800 line-through">{t.title}</div>
                    <div className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>All checklist items verified</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0F2744] text-white uppercase text-[10px] font-bold">
              <tr>
                <th className="p-3">Task #</th>
                <th className="p-3">Title</th>
                <th className="p-3">Linked Document</th>
                <th className="p-3">Assignee</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Due Date</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tasks.map(t => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-bold">{t.taskNumber}</td>
                  <td className="p-3 font-semibold">{t.title}</td>
                  <td className="p-3 font-mono text-[11px] text-amber-800">{t.relatedDocumentNumber || '—'}</td>
                  <td className="p-3">{t.assignedTo}</td>
                  <td className="p-3 font-bold">{t.priority}</td>
                  <td className="p-3 font-mono">{t.dueDate}</td>
                  <td className="p-3">
                    <span className="font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">{t.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden">
            <div className="px-6 py-4 bg-navy-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">Create New Workflow Task</h3>
                <div className="text-[11px] text-slate-300">Link task to technical office submittal or quality action</div>
              </div>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateTask} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Task Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Prepare response to consultant Code C comments on Chiller Shop Drawing"
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Linked Document Number</label>
                <input
                  type="text"
                  value={newDocRef}
                  onChange={(e) => setNewDocRef(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2 text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assignee</label>
                  <input
                    type="text"
                    value={newAssignee}
                    onChange={(e) => setNewAssignee(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newDue}
                    onChange={(e) => setNewDue(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Task Scope & Description</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Detail instructions for assignee..."
                  className="w-full border border-slate-300 rounded p-2 text-xs focus:outline-none focus:border-rose-500"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
