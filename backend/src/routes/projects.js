const express = require('express');
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const { isProjectMember, isProjectAdmin } = require('../middleware/role');
const {
  getProjects, createProject, getProject, updateProject, deleteProject, addMember, removeMember
} = require('../controllers/projectController');

const router = express.Router();

// All routes require authentication
router.use(auth);

router.get('/', getProjects);

router.post('/', [
  body('name').trim().notEmpty().withMessage('Project name is required')
], createProject);

router.get('/:id', isProjectMember, getProject);

router.put('/:id', isProjectAdmin, [
  body('name').trim().notEmpty().withMessage('Project name is required')
], updateProject);

router.delete('/:id', isProjectAdmin, deleteProject);

// Member management
router.post('/:id/members', isProjectAdmin, [
  body('email').isEmail().withMessage('Valid email is required')
], addMember);

router.delete('/:id/members/:userId', isProjectAdmin, removeMember);

module.exports = router;
