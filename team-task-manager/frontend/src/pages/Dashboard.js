import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { format, isPast, parseISO } from 'date-fns';
import './Dashboard.css';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(res => setData(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-page"><span className="spinner" /></div>;

  const { stats, myTasks, overdueTasks } = data;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Good day, {user?.name?.split(' ')[0]} 👋</h1>
          <p style={{ color: 'var(--text2)', fontSize: '13px', marginTop: 2 }}>Here's what's happening across your projects</p>
        </div>
        <Link to="/projects" className="btn btn-primary">New Project</Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Tasks</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--info)' }}>{stats.in_progress}</div>
          <div className="stat-label">In Progress</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--success)' }}>{stats.done}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: overdueTasks > 0 ? 'var(--danger)' : 'var(--text)' }}>{overdueTasks}</div>
          <div className="stat-label">Overdue</div>
        </div>
      </div>

      {stats.total > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 12, color: 'var(--text2)' }}>
            <span>Overall Progress</span>
            <span>{Math.round((stats.done / stats.total) * 100)}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${(stats.done / stats.total) * 100}%` }} />
          </div>
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600 }}>My Tasks</h2>
          <span style={{ fontSize: 12, color: 'var(--text2)' }}>{myTasks.length} open</span>
        </div>

        {myTasks.length === 0 ? (
          <div className="empty-state">
            <h3>All caught up!</h3>
            <p>No tasks assigned to you</p>
          </div>
        ) : (
          <div className="task-list">
            {myTasks.map(task => (
              <div key={task.id} className="task-row">
                <div className="task-row-left">
                  <span className={`badge badge-${task.status}`}>{task.status.replace('_', ' ')}</span>
                  <span className="task-row-title">{task.title}</span>
                  <span className="task-row-project">{task.project_name}</span>
                </div>
                {task.due_date && (
                  <span className={`task-due ${isPast(parseISO(task.due_date)) ? 'overdue' : ''}`}>
                    {format(parseISO(task.due_date), 'MMM d')}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
