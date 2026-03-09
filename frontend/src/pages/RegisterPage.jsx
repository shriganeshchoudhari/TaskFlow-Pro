import { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Button, TextField, Typography, Link, Alert, Paper,
  InputAdornment, IconButton, CircularProgress, Checkbox,
  FormControlLabel, LinearProgress
} from '@mui/material';
import { Visibility, VisibilityOff, TaskAlt } from '@mui/icons-material';
import { registerUser, loginUser, selectAuthLoading, selectAuthError, clearError }
  from '../store/slices/authSlice';

// Simple password strength scorer (0-4)
function getPasswordStrength(pw) {
  let score = 0;
  if (pw.length >= 8)                        score++;
  if (/[A-Z]/.test(pw))                      score++;
  if (/[0-9]/.test(pw))                      score++;
  if (/[@$!%*?&#^()_\-+=]/.test(pw))         score++;
  return score;
}

const STRENGTH_LABEL = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLOR = ['', 'error', 'warning', 'info', 'success'];

export default function RegisterPage() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const loading   = useSelector(selectAuthLoading);
  const error     = useSelector(selectAuthError);

  const [formData, setFormData] = useState({
    fullName: '', email: '', password: '', confirmPassword: '',
  });
  const [showPassword, setShowPassword]     = useState(false);
  const [showConfirm, setShowConfirm]       = useState(false);
  const [agreedTerms, setAgreedTerms]       = useState(false);
  const [fieldErrors, setFieldErrors]       = useState({});
  const [successMsg, setSuccessMsg]         = useState('');

  const strength = getPasswordStrength(formData.password);

  useEffect(() => { dispatch(clearError()); }, [dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    dispatch(clearError());
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.fullName.trim() || formData.fullName.trim().length < 2)
      errs.fullName = 'Full name must be at least 2 characters';
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      errs.email = 'Enter a valid email address';
    if (strength < 2)
      errs.password = 'Password must be at least 8 chars with uppercase, number and special char';
    if (formData.password !== formData.confirmPassword)
      errs.confirmPassword = 'Passwords do not match';
    if (!agreedTerms)
      errs.terms = 'You must accept the terms to continue';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }

    const result = await dispatch(registerUser({
      fullName: formData.fullName.trim(),
      email:    formData.email.trim(),
      password: formData.password,
    }));

    if (registerUser.fulfilled.match(result)) {
      // Auto-login after successful registration
      const loginResult = await dispatch(loginUser({
        email: formData.email.trim(), password: formData.password,
      }));
      if (loginUser.fulfilled.match(loginResult)) {
        navigate('/dashboard');
      } else {
        setSuccessMsg('Account created! Please sign in.');
        navigate('/login');
      }
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.50',
      }}
    >
      <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 480 }}>
        {/* Logo */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <TaskAlt sx={{ fontSize: 48, color: 'primary.main' }} />
          <Typography variant="h5" fontWeight={700} color="primary">TaskFlow Pro</Typography>
        </Box>

        <Typography variant="h5" fontWeight={600} mb={0.5}>Create an account</Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Start managing your projects today
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {successMsg && <Alert severity="success" sx={{ mb: 2 }}>{successMsg}</Alert>}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            fullWidth label="Full Name" name="fullName" autoFocus
            value={formData.fullName} onChange={handleChange} margin="normal"
            required autoComplete="name"
            error={!!fieldErrors.fullName} helperText={fieldErrors.fullName}
            inputProps={{ 'data-testid': 'fullname-input' }}
          />

          <TextField
            fullWidth label="Email address" name="email" type="email"
            value={formData.email} onChange={handleChange} margin="normal"
            required autoComplete="email"
            error={!!fieldErrors.email} helperText={fieldErrors.email}
            inputProps={{ 'data-testid': 'email-input' }}
          />

          <TextField
            fullWidth label="Password" name="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password} onChange={handleChange} margin="normal"
            required autoComplete="new-password"
            error={!!fieldErrors.password} helperText={fieldErrors.password}
            inputProps={{ 'data-testid': 'password-input' }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end"
                    aria-label="toggle password visibility">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* Password strength indicator */}
          {formData.password && (
            <Box sx={{ mt: 0.5, mb: 1 }}>
              <LinearProgress
                variant="determinate"
                value={(strength / 4) * 100}
                color={STRENGTH_COLOR[strength]}
                sx={{ borderRadius: 1, height: 6 }}
              />
              <Typography variant="caption" color={`${STRENGTH_COLOR[strength]}.main`}>
                {STRENGTH_LABEL[strength]}
              </Typography>
            </Box>
          )}

          <TextField
            fullWidth label="Confirm Password" name="confirmPassword"
            type={showConfirm ? 'text' : 'password'}
            value={formData.confirmPassword} onChange={handleChange} margin="normal"
            required autoComplete="new-password"
            error={!!fieldErrors.confirmPassword} helperText={fieldErrors.confirmPassword}
            inputProps={{ 'data-testid': 'confirm-password-input' }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowConfirm(!showConfirm)} edge="end"
                    aria-label="toggle confirm password visibility">
                    {showConfirm ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <FormControlLabel
            sx={{ mt: 1 }}
            control={
              <Checkbox
                checked={agreedTerms}
                onChange={(e) => {
                  setAgreedTerms(e.target.checked);
                  setFieldErrors((p) => ({ ...p, terms: '' }));
                }}
                data-testid="terms-checkbox"
              />
            }
            label={
              <Typography variant="body2">
                I agree to the{' '}
                <Link href="#" underline="hover">Terms of Service</Link>{' '}
                and{' '}
                <Link href="#" underline="hover">Privacy Policy</Link>
              </Typography>
            }
          />
          {fieldErrors.terms && (
            <Typography variant="caption" color="error">{fieldErrors.terms}</Typography>
          )}

          <Button
            type="submit" fullWidth variant="contained" size="large"
            disabled={loading} data-testid="register-button"
            sx={{ mt: 2, py: 1.5 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
          </Button>

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Already have an account?{' '}
              <Link component={RouterLink} to="/login" fontWeight={600}>Sign in</Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
