const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { rows } = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [decoded.userId]);

    if (!rows[0]) return res.status(401).json({ error: 'User not found' });
    req.user = rows[0];
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const requireProjectRole = (roles) => async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.params.id;
    const { rows } = await pool.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, req.user.id]
    );

    // Also allow project owner
    const { rows: ownerRows } = await pool.query(
      'SELECT id FROM projects WHERE id = $1 AND owner_id = $2',
      [projectId, req.user.id]
    );

    if (!rows[0] && !ownerRows[0]) {
      return res.status(403).json({ error: 'Not a member of this project' });
    }

    const userRole = ownerRows[0] ? 'admin' : rows[0].role;
    if (roles && !roles.includes(userRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    req.projectRole = userRole;
    next();
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { authenticate, requireProjectRole };
