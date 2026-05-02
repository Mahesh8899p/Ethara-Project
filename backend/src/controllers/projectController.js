const { validationResult } = require('express-validator');
const pool = require('../config/db');

// GET /api/projects
const getProjects = async (req, res) => {
  try {
    const userId = req.user.id;
    let rows;

    if (req.user.role === 'Admin') {
      // Admins can see all projects
      [rows] = await pool.query(`
        SELECT p.*, u.name as owner_name,
          (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count,
          (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count
        FROM projects p
        JOIN users u ON p.owner_id = u.id
        ORDER BY p.created_at DESC
      `);
    } else {
      // Members see only their projects
      [rows] = await pool.query(`
        SELECT p.*, u.name as owner_name,
          (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count,
          (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count
        FROM projects p
        JOIN users u ON p.owner_id = u.id
        JOIN project_members pm ON p.id = pm.project_id
        WHERE pm.user_id = ?
        ORDER BY p.created_at DESC
      `, [userId]);
    }

    res.json({ projects: rows });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/projects
const createProject = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description } = req.body;
    const ownerId = req.user.id;

    const [result] = await pool.query(
      'INSERT INTO projects (name, description, owner_id) VALUES (?, ?, ?)',
      [name, description || null, ownerId]
    );

    // Add owner as project admin
    await pool.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)',
      [result.insertId, ownerId, 'Admin']
    );

    res.status(201).json({
      message: 'Project created successfully',
      project: { id: result.insertId, name, description, owner_id: ownerId }
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/projects/:id
const getProject = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.*, u.name as owner_name
      FROM projects p
      JOIN users u ON p.owner_id = u.id
      WHERE p.id = ?
    `, [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Get members
    const [members] = await pool.query(`
      SELECT u.id, u.name, u.email, pm.role, pm.joined_at
      FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = ?
    `, [req.params.id]);

    res.json({ project: rows[0], members });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/projects/:id
const updateProject = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description } = req.body;

    await pool.query(
      'UPDATE projects SET name = ?, description = ? WHERE id = ?',
      [name, description || null, req.params.id]
    );

    res.json({ message: 'Project updated successfully' });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/projects/:id
const deleteProject = async (req, res) => {
  try {
    await pool.query('DELETE FROM projects WHERE id = ?', [req.params.id]);
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/projects/:id/members
const addMember = async (req, res) => {
  try {
    const { email, role } = req.body;
    const projectId = req.params.id;

    // Find user by email
    const [users] = await pool.query('SELECT id, name, email FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found with this email' });
    }

    const user = users[0];

    // Check if already a member
    const [existing] = await pool.query(
      'SELECT id FROM project_members WHERE project_id = ? AND user_id = ?',
      [projectId, user.id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'User is already a member of this project' });
    }

    await pool.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)',
      [projectId, user.id, role || 'Member']
    );

    res.status(201).json({ message: 'Member added successfully', member: user });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/projects/:id/members/:userId
const removeMember = async (req, res) => {
  try {
    const { id, userId } = req.params;

    // Can't remove the project owner
    const [project] = await pool.query('SELECT owner_id FROM projects WHERE id = ?', [id]);
    if (project.length > 0 && project[0].owner_id === parseInt(userId)) {
      return res.status(400).json({ message: 'Cannot remove the project owner' });
    }

    await pool.query(
      'DELETE FROM project_members WHERE project_id = ? AND user_id = ?',
      [id, userId]
    );

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getProjects, createProject, getProject, updateProject, deleteProject, addMember, removeMember };
