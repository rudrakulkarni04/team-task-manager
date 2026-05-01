const { pool } = require('../config/database');
const { validationResult } = require('express-validator');

const getTasks = async (req, res) => {
  const { status, assignee, priority } = req.query;
  const projectId = req.params.projectId;

  let query = `
    SELECT t.*, 
      u.name as assignee_name, u.email as assignee_email,
      c.name as created_by_name
    FROM tasks t
    LEFT JOIN users u ON u.id = t.assignee_id
    LEFT JOIN users c ON c.id = t.created_by
    WHERE t.project_id = $1
  `;
  const params = [projectId];

  if (status) { params.push(status); query += ` AND t.status = $${params.length}`; }
  if (assignee) { params.push(assignee); query += ` AND t.assignee_id = $${params.length}`; }
  if (priority) { params.push(priority); query += ` AND t.priority = $${params.length}`; }

  query += ' ORDER BY t.created_at DESC';

  try {
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

const createTask = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { title, description, status, priority, due_date, assignee_id } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO tasks (title, description, status, priority, due_date, project_id, assignee_id, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [title, description, status || 'todo', priority || 'medium', due_date, req.params.projectId, assignee_id, req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

const getTask = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT t.*, u.name as assignee_name, c.name as created_by_name
      FROM tasks t
      LEFT JOIN users u ON u.id = t.assignee_id
      LEFT JOIN users c ON c.id = t.created_by
      WHERE t.id = $1 AND t.project_id = $2
    `, [req.params.taskId, req.params.projectId]);
    if (!rows[0]) return res.status(404).json({ error: 'Task not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

const updateTask = async (req, res) => {
  const { title, description, status, priority, due_date, assignee_id } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE tasks SET 
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        status = COALESCE($3, status),
        priority = COALESCE($4, priority),
        due_date = COALESCE($5, due_date),
        assignee_id = COALESCE($6, assignee_id),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 AND project_id = $8 RETURNING *`,
      [title, description, status, priority, due_date, assignee_id, req.params.taskId, req.params.projectId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Task not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteTask = async (req, res) => {
  try {
    await pool.query('DELETE FROM tasks WHERE id = $1 AND project_id = $2', [req.params.taskId, req.params.projectId]);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

const getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    const [myTasks, overdue, stats] = await Promise.all([
      pool.query(`
        SELECT t.*, p.name as project_name
        FROM tasks t
        JOIN projects p ON p.id = t.project_id
        WHERE t.assignee_id = $1 AND t.status != 'done'
        ORDER BY t.due_date ASC NULLS LAST
        LIMIT 10
      `, [userId]),
      pool.query(`
        SELECT COUNT(*) as count FROM tasks t
        JOIN (
          SELECT p.id FROM projects p
          LEFT JOIN project_members pm ON pm.project_id = p.id
          WHERE p.owner_id = $1 OR pm.user_id = $1
        ) my_projects ON my_projects.id = t.project_id
        WHERE t.due_date < CURRENT_DATE AND t.status != 'done'
      `, [userId]),
      pool.query(`
        SELECT 
          COUNT(CASE WHEN t.status = 'todo' THEN 1 END) as todo,
          COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) as in_progress,
          COUNT(CASE WHEN t.status = 'done' THEN 1 END) as done,
          COUNT(*) as total
        FROM tasks t
        JOIN (
          SELECT p.id FROM projects p
          LEFT JOIN project_members pm ON pm.project_id = p.id
          WHERE p.owner_id = $1 OR pm.user_id = $1
        ) my_projects ON my_projects.id = t.project_id
      `, [userId])
    ]);

    res.json({
      myTasks: myTasks.rows,
      overdueTasks: parseInt(overdue.rows[0].count),
      stats: stats.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getTasks, createTask, getTask, updateTask, deleteTask, getDashboard };
