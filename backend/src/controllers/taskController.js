const { validationResult } = require('express-validator');
const pool = require('../config/db');

// GET /api/projects/:projectId/tasks
const getTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status, priority, assigned_to } = req.query;

    let query = `
      SELECT t.*, u.name as assigned_to_name, c.name as created_by_name
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      JOIN users c ON t.created_by = c.id
      WHERE t.project_id = ?
    `;
    const params = [projectId];

    if (status) {
      query += ' AND t.status = ?';
      params.push(status);
    }
    if (priority) {
      query += ' AND t.priority = ?';
      params.push(priority);
    }
    if (assigned_to) {
      query += ' AND t.assigned_to = ?';
      params.push(assigned_to);
    }

    query += ' ORDER BY t.created_at DESC';

    const [rows] = await pool.query(query, params);
    res.json({ tasks: rows });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/projects/:projectId/tasks
const createTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { projectId } = req.params;
    const { title, description, status, priority, assigned_to, due_date } = req.body;
    const createdBy = req.user.id;

    // Validate assigned_to is a project member if provided
    if (assigned_to) {
      const [member] = await pool.query(
        'SELECT id FROM project_members WHERE project_id = ? AND user_id = ?',
        [projectId, assigned_to]
      );
      if (member.length === 0) {
        return res.status(400).json({ message: 'Assigned user is not a project member' });
      }
    }

    const [result] = await pool.query(
      `INSERT INTO tasks (project_id, title, description, status, priority, assigned_to, due_date, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [projectId, title, description || null, status || 'Todo', priority || 'Medium', assigned_to || null, due_date || null, createdBy]
    );

    res.status(201).json({
      message: 'Task created successfully',
      task: { id: result.insertId, title, status: status || 'Todo', priority: priority || 'Medium' }
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/tasks/:id
const getTask = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT t.*, u.name as assigned_to_name, c.name as created_by_name
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      JOIN users c ON t.created_by = c.id
      WHERE t.id = ?
    `, [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ task: rows[0] });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/tasks/:id
const updateTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, status, priority, assigned_to, due_date } = req.body;
    const taskId = req.params.id;

    // Get current task
    const [existing] = await pool.query('SELECT * FROM tasks WHERE id = ?', [taskId]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const task = existing[0];

    // Check permission: Admin or assigned user can update
    if (req.user.role !== 'Admin' && task.assigned_to !== req.user.id) {
      const [memberRole] = await pool.query(
        'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?',
        [task.project_id, req.user.id]
      );
      if (memberRole.length === 0 || memberRole[0].role !== 'Admin') {
        return res.status(403).json({ message: 'Not authorized to update this task' });
      }
    }

    await pool.query(
      `UPDATE tasks SET title = ?, description = ?, status = ?, priority = ?, assigned_to = ?, due_date = ?
       WHERE id = ?`,
      [
        title || task.title,
        description !== undefined ? description : task.description,
        status || task.status,
        priority || task.priority,
        assigned_to !== undefined ? assigned_to : task.assigned_to,
        due_date !== undefined ? due_date : task.due_date,
        taskId
      ]
    );

    res.json({ message: 'Task updated successfully' });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/tasks/:id
const deleteTask = async (req, res) => {
  try {
    const [existing] = await pool.query('SELECT project_id FROM tasks WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await pool.query('DELETE FROM tasks WHERE id = ?', [req.params.id]);
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getTasks, createTask, getTask, updateTask, deleteTask };
