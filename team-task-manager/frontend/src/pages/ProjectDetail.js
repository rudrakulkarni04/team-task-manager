import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { format, isPast, parseISO } from 'date-fns';
import './ProjectDetail.css';

const STATUS_COLS = ['todo', 'in_progress', 'done'];
const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };

function TaskModal({ task, projectId, members, onClose, onSaved }) {
  const [form, setForm] = useState(task || { title: '', description: '', status: 'todo', priority: 'medium', due_date: '', assignee_id: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, assignee_id: form.assignee_id || null };
      if (task) {
        const res = await api.put(`/projects/${projectId}/tasks/${task.id}`, payload);
        onSaved(res.data, false);
      } else {
        const res = await api.post(`/projects/${projectId}/tasks`, payload);
        onSaved(res.data, true);
      }
      toast.success(task ? 'Task updated' : 'Task created');
    } catch {
      toast.error('Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">
          {task ? 'Edit Task' : 'New Task'}
          <button className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Title *</label>
            <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="label">Description</label>
            <textarea className="input" rows={3} value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ resize: 'vertical' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div className="form-group">
              <label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="label">Due Date</label>
              <input className="input" type="date" value={form.due_date || ''} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="label">Assignee</label>
              <select className="input" value={form.assignee_id || ''} onChange={e => setForm(f => ({ ...f, assignee_id: e.target.value }))}>
                <option value="">Unassigned</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : (task ? 'Save Changes' : 'Create Task')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MembersModal({ projectId, members, isAdmin, onClose, onUpdated }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post(`/projects/${projectId}/members`, { email, role });
      onUpdated([...members, res.data]);
      setEmail('');
      toast.success('Member added');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      await api.delete(`/projects/${projectId}/members/${userId}`);
      onUpdated(members.filter(m => m.id !== userId));
      toast.success('Member removed');
    } catch {
      toast.error('Failed to remove member');
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">
          Team Members
          <button className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
        </div>
        {isAdmin && (
          <form onSubmit={handleAdd} style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            <input className="input" placeholder="Email address" type="email" value={email} onChange={e => setEmail(e.target.value)} style={{ flex: 1 }} required />
            <select className="input" value={role} onChange={e => setRole(e.target.value)} style={{ width: 110 }}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <button className="btn btn-primary" disabled={loading}>Add</button>
          </form>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {members.map(m => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600 }}>{m.name[0].toUpperCase()}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{m.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text2)' }}>{m.email}</div>
              </div>
              <span className={`badge badge-${m.role}`}>{m.role}</span>
              {isAdmin && <button className="btn btn-danger btn-sm" onClick={() => handleRemove(m.id)}>Remove</button>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [taskModal, setTaskModal] = useState(null); // null | 'new' | task object
  const [showMembers, setShowMembers] = useState(false);
  const [filter, setFilter] = useState({ priority: '' });

  useEffect(() => {
    Promise.all([
      api.get(`/projects/${id}`),
      api.get(`/projects/${id}/tasks`),
      api.get(`/projects/${id}/members`)
    ]).then(([p, t, m]) => {
      setProject(p.data);
      setTasks(t.data);
      setMembers(m.data);
    }).catch(() => navigate('/projects'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!window.confirm('Delete this project? This cannot be undone.')) return;
    try {
      await api.delete(`/projects/${id}`);
      toast.success('Project deleted');
      navigate('/projects');
    } catch {
      toast.error('Failed to delete project');
    }
  };

  const handleTaskSaved = (task, isNew) => {
    if (isNew) setTasks(ts => [task, ...ts]);
    else setTasks(ts => ts.map(t => t.id === task.id ? task : t));
    setTaskModal(null);
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/projects/${id}/tasks/${taskId}`);
      setTasks(ts => ts.filter(t => t.id !== taskId));
      toast.success('Task deleted');
    } catch {
      toast.error('Failed to delete task');
    }
  };

  if (loading) return <div className="loading-page"><span className="spinner" /></div>;

  const isAdmin = project.my_role === 'admin';
  const filteredTasks = filter.priority ? tasks.filter(t => t.priority === filter.priority) : tasks;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/projects')}>← Back</button>
          <div>
            <h1 className="page-title">{project.name}</h1>
            {project.description && <p style={{ color: 'var(--text2)', fontSize: 12, marginTop: 2 }}>{project.description}</p>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowMembers(true)}>👤 Team ({members.length})</button>
          <button className="btn btn-primary" onClick={() => setTaskModal('new')}>+ Task</button>
          {isAdmin && <button className="btn btn-danger btn-sm" onClick={handleDelete}>Delete</button>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--text2)' }}>Filter:</span>
        {['', 'low', 'medium', 'high'].map(p => (
          <button key={p} onClick={() => setFilter(f => ({ ...f, priority: p }))}
            className={`btn btn-sm ${filter.priority === p ? 'btn-primary' : 'btn-secondary'}`}>
            {p || 'All'}
          </button>
        ))}
      </div>

      <div className="kanban">
        {STATUS_COLS.map(status => {
          const colTasks = filteredTasks.filter(t => t.status === status);
          return (
            <div key={status} className="kanban-col">
              <div className="kanban-col-header">
                <span className="kanban-col-title">{STATUS_LABELS[status]}</span>
                <span className="kanban-col-count">{colTasks.length}</span>
              </div>
              <div className="kanban-tasks">
                {colTasks.map(task => (
                  <div key={task.id} className="task-card" onClick={() => setTaskModal(task)}>
                    <div className="task-card-header">
                      <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                      {isAdmin && (
                        <button className="btn btn-icon" style={{ color: 'var(--text3)', fontSize: 14 }}
                          onClick={e => { e.stopPropagation(); handleDeleteTask(task.id); }}>✕</button>
                      )}
                    </div>
                    <div className="task-card-title">{task.title}</div>
                    {task.description && <div className="task-card-desc">{task.description}</div>}
                    <div className="task-card-footer">
                      {task.assignee_name && (
                        <div className="task-assignee">
                          <div className="task-assignee-avatar">{task.assignee_name[0]}</div>
                          <span>{task.assignee_name}</span>
                        </div>
                      )}
                      {task.due_date && (
                        <span className={`task-due-badge ${isPast(parseISO(task.due_date)) && task.status !== 'done' ? 'overdue' : ''}`}>
                          {format(parseISO(task.due_date), 'MMM d')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                <button className="add-task-btn" onClick={() => setTaskModal('new')}>+ Add task</button>
              </div>
            </div>
          );
        })}
      </div>

      {taskModal && (
        <TaskModal
          task={taskModal === 'new' ? null : taskModal}
          projectId={id}
          members={members}
          onClose={() => setTaskModal(null)}
          onSaved={handleTaskSaved}
        />
      )}

      {showMembers && (
        <MembersModal
          projectId={id}
          members={members}
          isAdmin={isAdmin}
          onClose={() => setShowMembers(false)}
          onUpdated={setMembers}
        />
      )}
    </div>
  );
}
