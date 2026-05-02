const pool = require('../config/db');

// Check if user is Admin (global role)
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }
  next();
};

// Check if user is project admin or member
const isProjectMember = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.params.id;
    const userId = req.user.id;

    // Global admins always have access
    if (req.user.role === 'Admin') {
      req.projectRole = 'Admin';
      return next();
    }

    const [rows] = await pool.query(
      'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?',
      [projectId, userId]
    );

    if (rows.length === 0) {
      return res.status(403).json({ message: 'Access denied. Not a project member.' });
    }

    req.projectRole = rows[0].role;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Check if user is project admin
const isProjectAdmin = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.params.id;
    const userId = req.user.id;

    // Global admins always have access
    if (req.user.role === 'Admin') {
      return next();
    }

    const [rows] = await pool.query(
      'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?',
      [projectId, userId]
    );

    if (rows.length === 0 || rows[0].role !== 'Admin') {
      return res.status(403).json({ message: 'Access denied. Project admin only.' });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { isAdmin, isProjectMember, isProjectAdmin };
