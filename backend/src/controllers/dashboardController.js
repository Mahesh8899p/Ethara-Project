const pool = require('../config/db');

// GET /api/dashboard
const getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'Admin';

    let projectFilter = '';
    let params = [];

    if (!isAdmin) {
      projectFilter = 'AND t.project_id IN (SELECT project_id FROM project_members WHERE user_id = ?)';
      params = [userId];
    }

    // Total tasks by status
    const [statusCounts] = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM tasks t
      WHERE 1=1 ${projectFilter}
      GROUP BY status
    `, params);

    // Overdue tasks
    const [overdueTasks] = await pool.query(`
      SELECT t.*, p.name as project_name, u.name as assigned_to_name
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.due_date < CURDATE() AND t.status != 'Done' ${projectFilter}
      ORDER BY t.due_date ASC
      LIMIT 10
    `, params);

    // My tasks (assigned to me)
    const [myTasks] = await pool.query(`
      SELECT t.*, p.name as project_name
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE t.assigned_to = ? AND t.status != 'Done'
      ORDER BY t.due_date ASC
      LIMIT 10
    `, [userId]);

    // Project count
    let projectCount;
    if (isAdmin) {
      const [count] = await pool.query('SELECT COUNT(*) as count FROM projects');
      projectCount = count[0].count;
    } else {
      const [count] = await pool.query(
        'SELECT COUNT(*) as count FROM project_members WHERE user_id = ?',
        [userId]
      );
      projectCount = count[0].count;
    }

    // Total team members
    const [memberCount] = await pool.query('SELECT COUNT(*) as count FROM users');

    res.json({
      stats: {
        totalProjects: projectCount,
        totalMembers: memberCount[0].count,
        tasksByStatus: statusCounts,
        totalTasks: statusCounts.reduce((sum, s) => sum + s.count, 0)
      },
      overdueTasks,
      myTasks
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getDashboard };
