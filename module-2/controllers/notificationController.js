import mongoose from 'mongoose';

const getModel = (name) => { try { return mongoose.model(name); } catch { return null; } };

// GET /api/notifications/:employeeId
export const getNotifications = async (req, res) => {
  try {
    const Notification = getModel("Notification");
    if (!Notification) return res.status(500).json({ message: "Notification model not loaded." });

    const { read, limit = 30 } = req.query;
    const filter = { recipientId: req.params.employeeId };
    if (read !== undefined) filter.read = read === 'true';

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 }).limit(Number(limit)).lean();

    const unreadCount = await Notification.countDocuments({ recipientId: req.params.employeeId, read: false });
    res.json({ unreadCount, count: notifications.length, data: notifications });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// PATCH /api/notifications/:notificationId/read
export const markAsRead = async (req, res) => {
  try {
    const Notification = getModel("Notification");
    if (!Notification) return res.status(500).json({ message: "Notification model not loaded." });

    await Notification.findByIdAndUpdate(req.params.notificationId, { read: true, readAt: new Date() });
    res.json({ message: "Notification marked as read." });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// PATCH /api/notifications/:employeeId/read-all
export const markAllAsRead = async (req, res) => {
  try {
    const Notification = getModel("Notification");
    if (!Notification) return res.status(500).json({ message: "Notification model not loaded." });

    await Notification.updateMany({ recipientId: req.params.employeeId, read: false }, { read: true, readAt: new Date() });
    res.json({ message: "All notifications marked as read." });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
