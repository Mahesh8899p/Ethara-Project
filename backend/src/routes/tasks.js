const express = require('express');
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const { isProjectMember, isProjectAdmin } = require('../middleware/role');
const { getTasks, createTask, getTask, updateTask, deleteTask } = require('../controllers/taskController');

const router = express.Router();

// All routes require authentication
router.use(auth);

// Project-scoped task routes
router.get('/project/:projectId', isProjectMember, getTasks);

router.post('/project/:projectId', isProjectAdmin, [
  body('title').trim().notEmpty().withMessage('Task title is required')
], createTask);

// Individual task routes
router.get('/:id', getTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

module.exports = router;
