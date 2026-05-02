import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const ProjectDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'Medium', assigned_to: '', due_date: '', status: 'Todo' });
  const [memberEmail, setMemberEmail] = useState('');
  const [error, setError] = useState('');
  const [editingTask, setEditingTask] = useState(null);

  const isAdmin = user?.role === 'Admin';

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [projectRes, tasksRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks/project/${id}`)
      ]);
      setProject(projectRes.data.project);
      setMembers(projectRes.data.members);
      setTasks(tasksRes.data.tasks);
    } catch (err) {
      console.error('Error:', err);
      if (err.response?.status === 403 || err.response?.status === 404) {
        navigate('/projects');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = { ...taskForm };
      if (!payload.assigned_to) delete payload.assigned_to;
      if (!payload.due_date) delete payload.due_date;
      await api.post(`/tasks/project/${id}`, payload);
      setShowTaskModal(false);
      setTaskForm({ title: '', description: '', priority: 'Medium', assigned_to: '', due_date: '', status: 'Todo' });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task');
    }
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.put(`/tasks/${editingTask.id}`, taskForm);
      setEditingTask(null);
      setShowTaskModal(false);
      setTaskForm({ title: '', description: '', priority: 'Medium', assigned_to: '', due_date: '', status: 'Todo' });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      fetchData();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      fetchData();
    } catch (err) {
      console.error('Status update error:', err);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post(`/projects/${id}/members`, { email: memberEmail, role: 'Member' });
      setShowMemberModal(false);
      setMemberEmail('');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      await api.delete(`/projects/${id}/members/${userId}`);
      fetchData();
    } catch (err) {
      console.error('Remove error:', err);
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('Delete this project and all its tasks?')) return;
    try {
      await api.delete(`/projects/${id}`);
      navigate('/projects');
    } catch (err) {
      console.error('Delete project error:', err);
    }
  };

  const openEditTask = (task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      assigned_to: task.assigned_to || '',
      due_date: task.due_date ? task.due_date.split('T')[0] : '',
      status: task.status
    });
    setShowTaskModal(true);
  };

  if (loading) return <div>Loading...</div>;
  if (!project) return <div>Project not found</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{project.name}</h1>
          <p style={{ color: '#666', marginTop: '4px' }}>{project.description || 'No description'}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {isAdmin && (
            <>
              <button className="btn btn-primary" onClick={() => { setEditingTask(null); setTaskForm({ title: '', description: '', priority: 'Medium', assigned_to: '', due_date: '', status: 'Todo' }); setShowTaskModal(true); }}>
                + Add Task
              </button>
              <button className="btn btn-secondary" onClick={() => setShowMemberModal(true)}>
                + Add Member
              </button>
              <button className="btn btn-danger btn-sm" onClick={handleDeleteProject}>
                Delete Project
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tasks Section */}
      <div className="card">
        <h3 style={{ marginBottom: '16px' }}>Tasks ({tasks.length})</h3>
        {tasks.length === 0 ? (
          <p style={{ color: '#999' }}>No tasks yet. Create one to get started!</p>
        ) : (
          <div className="task-list">
            {tasks.map(task => (
              <div key={task.id} className="task-item">
                <select
                  value={task.status}
                  onChange={(e) => handleStatusChange(task.id, e.target.value)}
                  style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.8rem' }}
                >
                  <option value="Todo">Todo</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Done">Done</option>
                </select>
                <div className="task-title" style={{ flex: 1 }}>
                  <div>{task.title}</div>
                  <div className="task-meta">
                    {task.assigned_to_name && `Assigned: ${task.assigned_to_name}`}
                    {task.due_date && ` • Due: ${new Date(task.due_date).toLocaleDateString()}`}
                  </div>
                </div>
                <span className={`badge badge-${task.priority.toLowerCase()}`}>{task.priority}</span>
                {(isAdmin || task.assigned_to === user?.id) && (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => openEditTask(task)}>Edit</button>
                    {isAdmin && <button className="btn btn-danger btn-sm" onClick={() => handleDeleteTask(task.id)}>✕</button>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Members Section */}
      <div className="card">
        <h3 style={{ marginBottom: '16px' }}>Team Members ({members.length})</h3>
        <table className="members-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              {isAdmin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {members.map(member => (
              <tr key={member.id}>
                <td>{member.name}</td>
                <td>{member.email}</td>
                <td><span className="badge badge-progress">{member.role}</span></td>
                {isAdmin && (
                  <td>
                    {member.id !== project.owner_id && (
                      <button className="btn btn-danger btn-sm" onClick={() => handleRemoveMember(member.id)}>Remove</button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={() => { setShowTaskModal(false); setEditingTask(null); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingTask ? 'Edit Task' : 'Create Task'}</h2>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={editingTask ? handleUpdateTask : handleCreateTask}>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Status</label>
                  <select value={taskForm.status} onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}>
                    <option value="Todo">Todo</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Assign To</label>
                  <select value={taskForm.assigned_to} onChange={(e) => setTaskForm({ ...taskForm, assigned_to: e.target.value })}>
                    <option value="">Unassigned</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Due Date</label>
                  <input
                    type="date"
                    value={taskForm.due_date}
                    onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowTaskModal(false); setEditingTask(null); }}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingTask ? 'Update' : 'Create'} Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showMemberModal && (
        <div className="modal-overlay" onClick={() => setShowMemberModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Add Team Member</h2>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleAddMember}>
              <div className="form-group">
                <label>Member Email</label>
                <input
                  type="email"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  placeholder="Enter member's email"
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowMemberModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Member</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
