import { useState, useEffect } from 'react';
import {
  Box, Avatar, Typography, CircularProgress, Button, Divider
} from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import { taskService } from '../../services/taskService';
import { projectService } from '../../services/taskService';

const ACTION_LABEL = {
  TASK_CREATED:     'created task',
  TASK_UPDATED:     'updated task',
  TASK_STATUS_CHANGED: 'changed status of',
  COMMENT_ADDED:    'commented on',
  MEMBER_ADDED:     'added member to',
  MEMBER_REMOVED:   'removed member from',
  PROJECT_CREATED:  'created project',
  PROJECT_UPDATED:  'updated project',
  PROJECT_ARCHIVED: 'archived project',
};

export default function ActivityFeed({ entityType, entityId }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchActivities = async (pageNum = 0) => {
    setLoading(true);
    try {
      let data;
      if (entityType === 'project') {
        data = await projectService.getProjectActivities(entityId, { page: pageNum, size: 10 });
      } else {
        data = await taskService.getTaskActivities(entityId, { page: pageNum, size: 10 });
      }
      const items = data.content ?? data;
      if (pageNum === 0) {
        setActivities(items);
      } else {
        setActivities((prev) => [...prev, ...items]);
      }
      setHasMore(!data.last);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(0);
    fetchActivities(0);
  }, [entityType, entityId]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchActivities(next);
  };

  if (loading && activities.length === 0) {
    return <CircularProgress size={24} />;
  }

  return (
    <Box>
      {activities.length === 0 && !loading && (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
          No activity yet.
        </Typography>
      )}
      {activities.map((activity, idx) => (
        <Box key={activity.id}>
          <Box sx={{ display: 'flex', gap: 1.5, py: 1.5, alignItems: 'flex-start' }}>
            <Avatar src={activity.actor?.avatarUrl} sx={{ width: 30, height: 30, fontSize: '0.75rem' }}>
              {activity.actor?.fullName?.[0]?.toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="body2">
                <strong>{activity.actor?.fullName}</strong>{' '}
                {ACTION_LABEL[activity.action] || activity.action}
                {activity.taskTitle && <> "<em>{activity.taskTitle}</em>"</>}
                {activity.action === 'TASK_STATUS_CHANGED' && activity.oldValue && activity.newValue && (
                  <> from <strong>{activity.oldValue}</strong> to <strong>{activity.newValue}</strong></>
                )}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {activity.createdAt
                  ? formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })
                  : ''}
              </Typography>
            </Box>
          </Box>
          {idx < activities.length - 1 && <Divider />}
        </Box>
      ))}
      {hasMore && (
        <Box sx={{ textAlign: 'center', mt: 1 }}>
          <Button size="small" onClick={loadMore} disabled={loading}>
            {loading ? <CircularProgress size={16} /> : 'Load more'}
          </Button>
        </Box>
      )}
    </Box>
  );
}
