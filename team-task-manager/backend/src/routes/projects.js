const router = require('express').Router();
const { body } = require('express-validator');
const { authenticate, requireProjectRole } = require('../middleware/auth');
const {
  getProjects, createProject, getProject, updateProject, deleteProject,
  getMembers, addMember, removeMember
} = require('../controllers/projectController');

router.use(authenticate);

router.get('/', getProjects);
router.post('/', [body('name').trim().notEmpty()], createProject);
router.get('/:id', requireProjectRole(), getProject);
router.put('/:id', requireProjectRole(['admin']), updateProject);
router.delete('/:id', deleteProject);

router.get('/:id/members', requireProjectRole(), getMembers);
router.post('/:id/members', requireProjectRole(['admin']), addMember);
router.delete('/:id/members/:userId', requireProjectRole(['admin']), removeMember);

module.exports = router;
