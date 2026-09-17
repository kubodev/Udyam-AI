import { useState, useEffect } from 'react';
import { ListChecks, Plus, Trash2, CheckCircle2, Circle, AlertCircle, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getTasks, createTask, updateTaskStatus, deleteTask } from '../services/tasks';
import type { Task } from '../types';

const PRIORITIES: NonNullable<Task['priority']>[] = ['high', 'medium', 'low'];
const CATEGORIES: NonNullable<Task['category']>[] = ['funding', 'compliance', 'finance', 'operations', 'general'];

const priorityColor: Record<string, string> = {
  high: 'var(--color-danger-600)',
  medium: 'var(--color-accent-600)',
  low: 'var(--color-surface-500)',
};

const priorityBadge: Record<string, string> = {
  high: 'badge-danger',
  medium: 'badge-warning',
  low: '',
};

function groupTasks(tasks: Task[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekEnd = new Date(today);
  weekEnd.setDate(today.getDate() + 7);

  const open = tasks.filter((t) => t.status !== 'completed');
  const completed = tasks.filter((t) => t.status === 'completed');

  const todayTasks = open.filter((t) => {
    if (!t.due_date) return false;
    const d = new Date(t.due_date);
    return d.toDateString() === today.toDateString();
  });
  const thisWeek = open.filter((t) => {
    if (!t.due_date) return false;
    const d = new Date(t.due_date);
    return d > today && d <= weekEnd;
  });
  const upcoming = open.filter((t) => {
    if (!t.due_date) return t.status === 'open';
    const d = new Date(t.due_date);
    return d > weekEnd;
  });
  const noDue = open.filter((t) => !t.due_date && !upcoming.includes(t));

  return { todayTasks, thisWeek, upcoming: [...upcoming, ...noDue], completed };
}

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formDue, setFormDue] = useState('');
  const [formCategory, setFormCategory] = useState<Task['category']>('general');
  const [formPriority, setFormPriority] = useState<Task['priority']>('medium');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) getTasks(user.id).then((t) => { setTasks(t); setLoading(false); });
  }, [user]);

  const handleCreate = async () => {
    if (!formTitle.trim() || !user) return;
    setSaving(true);
    const { data, error: err } = await createTask(user.id, {
      title: formTitle.trim(),
      description: formDesc.trim() || undefined,
      due_date: formDue || undefined,
      category: formCategory ?? undefined,
      priority: formPriority ?? undefined,
    });
    setSaving(false);
    if (err) { setError(err); return; }
    if (data) setTasks((prev) => [data, ...prev]);
    setShowForm(false);
    setFormTitle(''); setFormDesc(''); setFormDue('');
    setFormCategory('general'); setFormPriority('medium');
  };

  const handleToggle = async (task: Task) => {
    const newStatus: Task['status'] = task.status === 'completed' ? 'open' : 'completed';
    await updateTaskStatus(task.id, newStatus);
    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: newStatus } : t));
  };

  const handleDelete = async (taskId: string) => {
    await deleteTask(taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const { todayTasks, thisWeek, upcoming, completed } = groupTasks(tasks);

  const inputStyle = {
    width: '100%', padding: '0.5rem 0.75rem',
    border: '1px solid var(--color-surface-300)',
    borderRadius: 'var(--radius-md)', fontSize: '0.875rem', outline: 'none',
  };

  function TaskGroup({ label, items }: { label: string; items: Task[] }) {
    if (items.length === 0) return null;
    return (
      <div style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-surface-500)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
          {label} ({items.length})
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {items.map((task) => (
            <div
              key={task.id}
              className="card"
              style={{ padding: '0.875rem 1rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem', opacity: task.status === 'completed' ? 0.6 : 1 }}
            >
              <button
                onClick={() => handleToggle(task)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: '1px', flexShrink: 0 }}
              >
                {task.status === 'completed'
                  ? <CheckCircle2 size={18} color="var(--color-success-600)" />
                  : <Circle size={18} color="var(--color-surface-300)" />
                }
              </button>
              <div style={{ flex: 1 }}>
                <p style={{
                  fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-surface-900)',
                  textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                  marginBottom: '0.125rem',
                }}>
                  {task.title}
                </p>
                {task.description && (
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-surface-500)', marginBottom: '0.25rem' }}>{task.description}</p>
                )}
                <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  {task.category && <span className="badge badge-primary">{task.category}</span>}
                  {task.priority && (
                    <span className={`badge ${priorityBadge[task.priority]}`} style={{ color: !priorityBadge[task.priority] ? priorityColor[task.priority] : undefined }}>
                      {task.priority}
                    </span>
                  )}
                  {task.due_date && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-surface-400)' }}>
                      Due {new Date(task.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDelete(task.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-surface-300)', padding: 0, flexShrink: 0 }}
                title="Delete task"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>Tasks</h1>
            <p>Your action items — created manually or suggested by AI</p>
          </div>
          <button
            id="new-task-btn"
            className="btn btn-primary"
            onClick={() => setShowForm(true)}
          >
            <Plus size={16} />
            New Task
          </button>
        </div>
      </div>

      {/* New task form */}
      {showForm && (
        <div className="card" style={{ padding: '1.25rem', marginBottom: '1.25rem', borderLeft: '4px solid var(--color-primary-500)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-surface-900)' }}>New Task</h3>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-surface-400)' }}>
              <X size={18} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <input
              id="task-title"
              style={inputStyle} type="text" value={formTitle} placeholder="Task title *"
              onChange={(e) => setFormTitle(e.target.value)}
              onFocus={(e) => e.target.style.borderColor = 'var(--color-primary-500)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--color-surface-300)'}
            />
            <input
              style={inputStyle} type="text" value={formDesc} placeholder="Description (optional)"
              onChange={(e) => setFormDesc(e.target.value)}
              onFocus={(e) => e.target.style.borderColor = 'var(--color-primary-500)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--color-surface-300)'}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-surface-600)' }}>Due date</span>
                <input style={inputStyle} type="date" value={formDue} onChange={(e) => setFormDue(e.target.value)}
                  onFocus={(e) => e.target.style.borderColor = 'var(--color-primary-500)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--color-surface-300)'}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-surface-600)' }}>Category</span>
                <select style={{ ...inputStyle, cursor: 'pointer' }} value={formCategory || 'general'} onChange={(e) => setFormCategory(e.target.value as Task['category'])}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-surface-600)' }}>Priority</span>
                <select style={{ ...inputStyle, cursor: 'pointer' }} value={formPriority || 'medium'} onChange={(e) => setFormPriority(e.target.value as Task['priority'])}>
                  {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </label>
            </div>
            {error && (
              <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', padding: '0.625rem 0.875rem', background: 'rgba(247, 108, 108, 0.12)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(247, 108, 108, 0.3)', backdropFilter: 'blur(12px)' }}>
                <AlertCircle size={14} color="#f87171" />
                <span style={{ fontSize: '0.8125rem', color: '#fca5a5' }}>{error}</span>
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.625rem' }}>
              <button id="task-save-btn" className="btn btn-primary" onClick={handleCreate} disabled={saving || !formTitle.trim()}>
                {saving ? 'Saving…' : 'Create task'}
              </button>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[1, 2, 3].map((i) => <div key={i} className="card animate-pulse-subtle" style={{ height: '4rem' }} />)}
        </div>
      ) : tasks.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <ListChecks className="empty-state-icon" />
            <h3>All clear — no tasks yet</h3>
            <p>Create tasks manually or let the AI suggest follow-up actions from your conversations.</p>
          </div>
        </div>
      ) : (
        <div>
          <TaskGroup label="Today" items={todayTasks} />
          <TaskGroup label="This Week" items={thisWeek} />
          <TaskGroup label="Upcoming" items={upcoming} />
          <TaskGroup label="Completed" items={completed} />
        </div>
      )}
    </div>
  );
}
