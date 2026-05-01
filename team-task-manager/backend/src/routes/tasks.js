const router = require('express').Router({ mergeParams: true });
const { body } = require('express-validator');
const { authenticate, requireProjectRole } = require('../middleware/auth');
const { getTasks, createTask, getTask, updateTask, deleteTask } = require('../controllers/taskController');

router.use(authenticate);
router.use(requireProjectRole());

router.get('/', getTasks);
router.post('/', [body('title').trim().notEmpty()], createTask);
router.get('/:taskId', getTask);
router.put('/:taskId', updateTask);
router.delete('/:taskId', requireProjectRole(['admin']), deleteTask);

module.exports = router;
