import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Typography, TextField, Button, Avatar, Paper,
  Divider, Alert, CircularProgress, Grid
} from '@mui/material';
import { AccountCircle, Lock } from '@mui/icons-material';
import { selectCurrentUser, setCredentials } from '../store/slices/authSlice';
import authService from '../services/authService';
import { useSnackbar } from 'notistack';

export default function ProfilePage() {
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const user = useSelector(selectCurrentUser);

  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || '',
    avatarUrl: user?.avatarUrl || '',
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');

  const [pwForm, setPwForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');

  const handleProfileChange = (e) => {
    setProfileForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setProfileError('');
  };

  const handleProfileSave = async () => {
    if (!profileForm.fullName.trim() || profileForm.fullName.trim().length < 2) {
      setProfileError('Full name must be at least 2 characters.');
      return;
    }
    setProfileLoading(true);
    try {
      const updated = await authService.updateProfile({
        fullName: profileForm.fullName.trim(),
        avatarUrl: profileForm.avatarUrl || null,
      });
      dispatch(setCredentials({ user: updated, accessToken: null, refreshToken: null }));
      enqueueSnackbar('Profile updated!', { variant: 'success' });
    } catch (e) {
      setProfileError(e.response?.data?.message || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePwChange = (e) => {
    setPwForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setPwError('');
  };

  const handlePwSave = async () => {
    if (!pwForm.currentPassword || !pwForm.newPassword) {
      setPwError('All fields are required.');
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('New passwords do not match.');
      return;
    }
    if (pwForm.newPassword.length < 8) {
      setPwError('New password must be at least 8 characters.');
      return;
    }
    setPwLoading(true);
    try {
      await authService.changePassword(pwForm);
      enqueueSnackbar('Password changed successfully!', { variant: 'success' });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e) {
      setPwError(e.response?.data?.message || 'Failed to change password.');
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <Box maxWidth={720} mx="auto">
      <Typography variant="h4" fontWeight={700} mb={3}>Profile Settings</Typography>

      {/* Personal Info */}
      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
          <AccountCircle color="primary" />
          <Typography variant="subtitle1" fontWeight={700}>Personal Information</Typography>
        </Box>

        {/* Avatar */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 }}>
          <Avatar
            src={profileForm.avatarUrl || user?.avatarUrl}
            sx={{ width: 64, height: 64, fontSize: '1.5rem' }}
          >
            {user?.fullName?.[0]?.toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={600}>{user?.email}</Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.role} · Member since {user?.createdAt ? new Date(user.createdAt).getFullYear() : '—'}
            </Typography>
          </Box>
        </Box>

        {profileError && <Alert severity="error" sx={{ mb: 2 }}>{profileError}</Alert>}

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Full Name"
              name="fullName"
              value={profileForm.fullName}
              onChange={handleProfileChange}
              inputProps={{ minLength: 2, maxLength: 100 }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Email"
              value={user?.email || ''}
              disabled
              helperText="Email cannot be changed"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Avatar URL (optional)"
              name="avatarUrl"
              value={profileForm.avatarUrl}
              onChange={handleProfileChange}
              placeholder="https://example.com/avatar.jpg"
              inputProps={{ maxLength: 500 }}
            />
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button
            variant="contained"
            onClick={handleProfileSave}
            disabled={profileLoading}
            startIcon={profileLoading ? <CircularProgress size={16} color="inherit" /> : null}
          >
            Save Changes
          </Button>
        </Box>
      </Paper>

      {/* Change Password */}
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
          <Lock color="primary" />
          <Typography variant="subtitle1" fontWeight={700}>Change Password</Typography>
        </Box>

        {pwError && <Alert severity="error" sx={{ mb: 2 }}>{pwError}</Alert>}

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Current Password"
              name="currentPassword"
              type="password"
              value={pwForm.currentPassword}
              onChange={handlePwChange}
              autoComplete="current-password"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="New Password"
              name="newPassword"
              type="password"
              value={pwForm.newPassword}
              onChange={handlePwChange}
              autoComplete="new-password"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Confirm New Password"
              name="confirmPassword"
              type="password"
              value={pwForm.confirmPassword}
              onChange={handlePwChange}
              autoComplete="new-password"
              error={pwForm.newPassword !== pwForm.confirmPassword && pwForm.confirmPassword.length > 0}
              helperText={
                pwForm.newPassword !== pwForm.confirmPassword && pwForm.confirmPassword.length > 0
                  ? "Passwords don't match"
                  : ''
              }
            />
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button
            variant="contained"
            onClick={handlePwSave}
            disabled={pwLoading}
            startIcon={pwLoading ? <CircularProgress size={16} color="inherit" /> : null}
          >
            Change Password
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
