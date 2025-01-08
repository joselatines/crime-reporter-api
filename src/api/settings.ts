import express from 'express';
import  User  from '../lib/db/models/user.model';
import { getNotifications } from '../controllers/notifications.controller';

const router = express.Router();

/**
 * GET /notifications - Basic settings information
 */
router.get<{}>('/', (req, res) => {
  res.send('Settings');
});

router.get('/notifications', (req, res) => {
  res.send('Notifications');
});

router.get('/notifications/:userId', getNotifications);
/**
 * PUT /notifications - Update wanted keywords and notification email
 */
router.put('/notifications', async (req, res) => {
  try {
    const { userId, newsWantedWords, notificationEmail } = req.body;

    // Validate request body
    if (!userId || (!newsWantedWords && !notificationEmail)) {
      return res.status(400).json({ error: 'Invalid request. Missing required fields.' });
    }

    // Build the update object dynamically
    const updateData: Partial<{ newsWantedWords: string[]; notificationEmail: string }> = {};
    if (newsWantedWords) updateData.newsWantedWords = newsWantedWords;
    if (notificationEmail) updateData.notificationEmail = notificationEmail;

    // Update the user in the database
    const updatedUser = await User.findOneAndUpdate(
      { _id: userId },
      { $set: updateData },
      { new: true } // Return the updated document
    );

    // If no user found, return a 404 error
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Return the updated user data
    res.status(200).json({
      message: 'Settings updated successfully.',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating notifications:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
