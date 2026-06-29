const express = require('express');
const router = express.Router();
const NotificationController = require('./notification.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');

router.get('/stream', NotificationController.sseStream);
router.get('/', verifyToken, NotificationController.getRecent);
router.get('/all', verifyToken, NotificationController.getAll);
router.put('/read-all', verifyToken, NotificationController.markAllAsRead);
router.put('/:id/read', verifyToken, NotificationController.markAsRead);

module.exports = router;
