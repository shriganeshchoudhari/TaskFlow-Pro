import { useState, useEffect, useRef } from 'react';
import {
  Box, TextField, Button, Avatar, Typography, IconButton,
  CircularProgress, Divider
} from '@mui/material';
import { Send, Edit, Delete } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { commentService } from '../../services/taskService';
import { useSnackbar } from 'notistack';
import { formatDistanceToNow } from 'date-fns';

export default function CommentSection({ taskId }) {
  const { enqueueSnackbar } = useSnackbar();
  const currentUser = useSelector(selectCurrentUser);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const intervalRef = useRef(null);

  const loadComments = async () => {
    try {
      const data = await commentService.getComments(taskId);
      setComments(Array.isArray(data) ? data : data.content ?? []);
    } catch (e) {
      // Silent fail on poll
    }
  };

  useEffect(() => {
    setLoading(true);
    loadComments().finally(() => setLoading(false));
    // Poll every 30 seconds
    intervalRef.current = setInterval(loadComments, 30000);
    return () => clearInterval(intervalRef.current);
  }, [taskId]);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      const newComment = await commentService.createComment(taskId, content.trim());
      setComments((prev) => [...prev, newComment]);
      setContent('');
    } catch (e) {
      enqueueSnackbar('Failed to post comment.', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await commentService.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      enqueueSnackbar('Comment deleted.', { variant: 'info' });
    } catch (e) {
      enqueueSnackbar('Failed to delete comment.', { variant: 'error' });
    }
  };

  const startEdit = (comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const handleSaveEdit = async (commentId) => {
    if (!editContent.trim()) return;
    try {
      const updated = await commentService.updateComment(commentId, editContent.trim());
      setComments((prev) => prev.map((c) => (c.id === commentId ? updated : c)));
      setEditingId(null);
    } catch (e) {
      enqueueSnackbar('Failed to update comment.', { variant: 'error' });
    }
  };

  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
        Comments ({comments.length})
      </Typography>

      {loading ? (
        <CircularProgress size={24} />
      ) : (
        <Box sx={{ mb: 2 }}>
          {comments.map((comment, idx) => (
            <Box key={comment.id}>
              <Box sx={{ display: 'flex', gap: 1.5, py: 1.5 }}>
                <Avatar src={comment.author?.avatarUrl} sx={{ width: 32, height: 32, fontSize: '0.8rem' }}>
                  {comment.author?.fullName?.[0]?.toUpperCase()}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="body2" fontWeight={600}>
                      {comment.author?.fullName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {comment.createdAt
                        ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })
                        : ''}
                    </Typography>
                    {comment.isEdited && (
                      <Typography variant="caption" color="text.disabled">(edited)</Typography>
                    )}
                  </Box>

                  {editingId === comment.id ? (
                    <Box>
                      <TextField
                        fullWidth
                        size="small"
                        multiline
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        sx={{ mb: 1 }}
                      />
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button size="small" variant="contained" onClick={() => handleSaveEdit(comment.id)}>
                          Save
                        </Button>
                        <Button size="small" onClick={() => setEditingId(null)}>Cancel</Button>
                      </Box>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {comment.content}
                      </Typography>
                      {comment.author?.email === currentUser?.email && (
                        <Box sx={{ display: 'flex', ml: 1 }}>
                          <IconButton size="small" onClick={() => startEdit(comment)} aria-label="edit comment">
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleDelete(comment.id)} aria-label="delete comment">
                            <Delete fontSize="small" />
                          </IconButton>
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>
              </Box>
              {idx < comments.length - 1 && <Divider />}
            </Box>
          ))}
        </Box>
      )}

      {/* New comment input */}
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
        <Avatar src={currentUser?.avatarUrl} sx={{ width: 32, height: 32, fontSize: '0.8rem' }}>
          {currentUser?.fullName?.[0]?.toUpperCase()}
        </Avatar>
        <Box sx={{ flexGrow: 1 }}>
          <TextField
            fullWidth
            multiline
            minRows={2}
            placeholder="Write a comment…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) handleSubmit();
            }}
            size="small"
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
            <Button
              size="small"
              variant="contained"
              endIcon={submitting ? <CircularProgress size={14} color="inherit" /> : <Send />}
              onClick={handleSubmit}
              disabled={submitting || !content.trim()}
            >
              Comment
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
