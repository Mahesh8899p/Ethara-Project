import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/dashboard');
      setData(res.data);
    } catch (err) {
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading dashboard...</div>;

  const getStatusCount = (status) => {
    const item = data?.stats?.tasksByStatus?.find(s => s.status === status);
    return item ? item.count : 0;
  };

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome back, {user?.name}!</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>{data?.stats?.totalProjects || 0}</h3>
          <p>Total Projects</p>
        </div>
        <div className="stat-card todo">
          <h3>{getStatusCount('Todo')}</h3>
          <p>Todo Tasks</p>
        </div>
        <div className="stat-card progress">
          <h3>{getStatusCount('In Progress')}</h3>
          <p>In Progress</p>
        </div>
        <div className="stat-card done">
          <h3>{getStatusCount('Done')}</h3>
          <p>Completed</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* My Tasks */}
        <div className="card">
          <h3 style={{ marginBottom: '16px' }}>My Tasks</h3>
          {data?.myTasks?.length === 0 ? (
            <p style={{ color: '#999' }}>No tasks assigned to you</p>
          ) : (
            <div className="task-list">
              {data?.myTasks?.map(task => (
                <div key={task.id} className="task-item">
                  <div className="task-title">{task.title}</div>
                  <span className={`badge badge-${task.status === 'Todo' ? 'todo' : 'progress'}`}>
                    {task.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Overdue Tasks */}
        <div className="card">
          <h3 style={{ marginBottom: '16px', color: '#ff5252' }}>Overdue Tasks</h3>
          {data?.overdueTasks?.length === 0 ? (
            <p style={{ color: '#999' }}>No overdue tasks 🎉</p>
          ) : (
            <div className="task-list">
              {data?.overdueTasks?.map(task => (
                <div key={task.id} className="task-item">
                  <div>
                    <div className="task-title">{task.title}</div>
                    <div className="task-meta">{task.project_name} • Due: {new Date(task.due_date).toLocaleDateString()}</div>
                  </div>
                  <span className="badge badge-high">Overdue</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
