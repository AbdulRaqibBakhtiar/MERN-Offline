const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/Users');
const socketManager = require('../config/socket');

const passwordIsStrong = password => typeof password === 'string' && password.length >= 8 &&
  /[A-Z]/.test(password) && /[0-9]/.test(password) && /[!@#$%^&*(),.?":{}|<>_]/.test(password);

exports.requestPasswordReset = async (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Enter the email address linked to your account.' });
  }
  if (!process.env.RESEND_API_KEY || !process.env.AUTH_EMAIL_FROM || !process.env.CLIENT_APP_URL) {
    return res.status(503).json({ error: 'Account recovery email is not configured yet. Contact the site administrator.' });
  }
  try {
    const user = await User.findOne({ email }).select('_id email');
    if (!user) return res.status(202).json({ message: 'If an account matches that address, a recovery link will be sent.' });

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await User.updateOne({ _id: user._id }, { $set: { passwordResetTokenHash: tokenHash, passwordResetExpiresAt: expiresAt } });
    const resetUrl = new URL('/reset-password', process.env.CLIENT_APP_URL);
    resetUrl.searchParams.set('token', rawToken);
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.AUTH_EMAIL_FROM,
        to: [user.email],
        subject: 'Reset your Bazzar password',
        text: `Use this one-time link to reset your Bazzar password. It expires in 30 minutes: ${resetUrl.toString()}\n\nIf you did not request this, ignore this email.`,
        html: `<p>Use this one-time link to reset your Bazzar password. It expires in 30 minutes.</p><p><a href="${resetUrl.toString()}">Reset password</a></p><p>If you did not request this, ignore this email.</p>`
      })
    });
    if (!response.ok) {
      await User.updateOne({ _id: user._id, passwordResetTokenHash: tokenHash }, { $unset: { passwordResetTokenHash: 1, passwordResetExpiresAt: 1 } });
      console.error('Password recovery email delivery failed with status:', response.status);
      return res.status(503).json({ error: 'Could not send a recovery email right now. Please try again later.' });
    }
    return res.status(202).json({ message: 'If an account matches that address, a recovery link will be sent.' });
  } catch (error) {
    console.error('Password recovery request failed:', error.message);
    return res.status(503).json({ error: 'Could not process account recovery right now.' });
  }
};

exports.resetPassword = async (req, res) => {
  const { token, password } = req.body || {};
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) return res.status(400).json({ error: 'This recovery link is invalid or expired.' });
  if (!passwordIsStrong(password)) return res.status(400).json({ error: 'Password must be 8+ characters and include an uppercase letter, a number, and a symbol.' });
  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const passwordHash = await bcrypt.hash(password, 12);
    const updatedUser = await User.findOneAndUpdate(
      { passwordResetTokenHash: tokenHash, passwordResetExpiresAt: { $gt: new Date() } },
      { $set: { password: passwordHash }, $inc: { tokenVersion: 1 }, $unset: { passwordResetTokenHash: 1, passwordResetExpiresAt: 1 } },
      { new: true }
    ).select('_id').lean();
    if (!updatedUser) return res.status(400).json({ error: 'This recovery link is invalid or expired.' });
    try { socketManager.getIO().in(`user:${updatedUser._id}`).disconnectSockets(true); } catch (_) { /* Socket service may be unavailable during startup. */ }
    return res.json({ message: 'Password updated. You can now sign in with your new password.' });
  } catch (error) {
    console.error('Password reset failed:', error.message);
    return res.status(500).json({ error: 'Could not reset your password right now.' });
  }
};
