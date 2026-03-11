import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Typography, List, ListItem, ListItemAvatar, ListItemText,
  Avatar, Chip, IconButton, TextField, Button, Divider,
  Select, MenuItem, FormControl, Alert, CircularProgress, Tooltip
} from '@mui/material';
import { PersonRemove, PersonAdd } from '@mui/icons-material';
import {
  fetchMembers, addMember, removeMember, selectProjectMembers
} from '../../store/slices/projectsSlice';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { useSnackbar } from 'notistack';

const ROLE_COLOR = { MANAGER: 'primary', MEMBER: 'default', VIEWER: 'default', ADMIN: 'error' };

export default function ProjectMembersPanel({ projectId }) {
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const members = useSelector(selectProjectMembers(projectId));
  const currentUser = useSelector(selectCurrentUser);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [addError, setAddError] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    dispatch(fetchMembers(projectId));
  }, [dispatch, projectId]);

  const isManager = members.some(
    (m) => m.email === currentUser?.email && (m.role === 'MANAGER' || m.role === 'ADMIN')
  );

  const handleAddMember = async () => {
    if (!email.trim()) { setAddError('Email is required'); return; }
    setAdding(true);
    const result = await dispatch(addMember({ projectId, data: { email: email.trim(), role } }));
    setAdding(false);
    if (addMember.fulfilled.match(result)) {
      enqueueSnackbar('Member added successfully!', { variant: 'success' });
      setEmail('');
      setRole('MEMBER');
      setAddError('');
    } else {
      setAddError(result.payload || 'Failed to add member');
    }
  };

  const handleRemove = async (userId, memberEmail) => {
    if (memberEmail === currentUser?.email) return;
    const result = await dispatch(removeMember({ projectId, userId }));
    if (removeMember.fulfilled.match(result)) {
      enqueueSnackbar('Member removed.', { variant: 'info' });
    }
  };

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={700} mb={2}>
        Members ({members.length})
      </Typography>

      {/* Invite form (managers only) */}
      {isManager && (
        <Box sx={{ mb: 2 }}>
          {addError && <Alert severity="error" sx={{ mb: 1 }}>{addError}</Alert>}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <TextField
              size="small"
              label="Email address"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setAddError(''); }}
              sx={{ flexGrow: 1, minWidth: 200 }}
              onKeyDown={(e) => e.key === 'Enter' && handleAddMember()}
            />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select value={role} onChange={(e) => setRole(e.target.value)}>
                <MenuItem value="MEMBER">Member</MenuItem>
                <MenuItem value="MANAGER">Manager</MenuItem>
                <MenuItem value="VIEWER">Viewer</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="contained"
              size="small"
              onClick={handleAddMember}
              disabled={adding}
              startIcon={adding ? <CircularProgress size={14} color="inherit" /> : <PersonAdd />}
            >
              Invite
            </Button>
          </Box>
          <Divider sx={{ mt: 2 }} />
        </Box>
      )}

      {/* Member list */}
      <List disablePadding>
        {members.map((member, idx) => (
          <ListItem
            key={member.userId}
            disablePadding
            sx={{ py: 0.5 }}
            secondaryAction={
              isManager && member.email !== currentUser?.email ? (
                <Tooltip title="Remove member">
                  <IconButton
                    size="small"
                    onClick={() => handleRemove(member.userId, member.email)}
                    aria-label={`remove ${member.fullName}`}
                  >
                    <PersonRemove fontSize="small" />
                  </IconButton>
                </Tooltip>
              ) : null
            }
          >
            <ListItemAvatar>
              <Avatar src={member.avatarUrl} sx={{ width: 36, height: 36 }}>
                {member.fullName?.[0]?.toUpperCase()}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" fontWeight={600}>
                    {member.fullName}
                    {member.email === currentUser?.email && ' (you)'}
                  </Typography>
                  <Chip
                    label={member.role}
                    size="small"
                    color={ROLE_COLOR[member.role] || 'default'}
                    sx={{ fontSize: '0.65rem', height: 18 }}
                  />
                </Box>
              }
              secondary={member.email}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
