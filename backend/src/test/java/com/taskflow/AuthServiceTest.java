package com.taskflow;

import com.taskflow.dto.request.LoginRequest;
import com.taskflow.dto.request.RegisterRequest;
import com.taskflow.dto.response.AuthResponse;
import com.taskflow.dto.response.UserResponse;
import com.taskflow.exception.ConflictException;
import com.taskflow.exception.UnauthorizedException;
import com.taskflow.model.User;
import com.taskflow.repository.RefreshTokenRepository;
import com.taskflow.repository.UserRepository;
import com.taskflow.security.JwtTokenProvider;
import com.taskflow.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService Unit Tests")
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtTokenProvider jwtTokenProvider;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private RefreshTokenRepository refreshTokenRepository;

    @InjectMocks private AuthService authService;

    private User testUser;
    private final String TEST_EMAIL = "test@example.com";
    private final String TEST_PASSWORD = "TestPass123!";

    @BeforeEach
    void setUp() {
        testUser = User.builder()
            .id(UUID.randomUUID())
            .email(TEST_EMAIL)
            .fullName("Test User")
            .password("$2a$12$encoded")
            .role(User.Role.MEMBER)
            .isActive(true)
            .build();
    }

    // ── Register Tests ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("Register: should create new user successfully")
    void register_ValidRequest_ReturnsUserResponse() {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("Test User");
        request.setEmail(TEST_EMAIL);
        request.setPassword(TEST_PASSWORD);

        when(userRepository.existsByEmail(TEST_EMAIL)).thenReturn(false);
        when(passwordEncoder.encode(TEST_PASSWORD)).thenReturn("$2a$12$encoded");
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        UserResponse response = authService.register(request);

        assertThat(response).isNotNull();
        assertThat(response.getEmail()).isEqualTo(TEST_EMAIL);
        assertThat(response.getRole()).isEqualTo("MEMBER");
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("Register: should throw when email already exists")
    void register_DuplicateEmail_ThrowsException() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail(TEST_EMAIL);
        request.setPassword(TEST_PASSWORD);
        request.setFullName("Test User");

        when(userRepository.existsByEmail(TEST_EMAIL)).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("already registered");

        verify(userRepository, never()).save(any());
    }

    // ── Login Tests ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Login: should return tokens for valid credentials")
    void login_ValidCredentials_ReturnsAuthResponse() {
        LoginRequest request = new LoginRequest();
        request.setEmail(TEST_EMAIL);
        request.setPassword(TEST_PASSWORD);

        when(authenticationManager.authenticate(any()))
            .thenReturn(new UsernamePasswordAuthenticationToken(TEST_EMAIL, TEST_PASSWORD));
        when(userRepository.findByEmail(TEST_EMAIL)).thenReturn(Optional.of(testUser));
        when(jwtTokenProvider.generateAccessToken(testUser)).thenReturn("access.token.here");
        when(jwtTokenProvider.generateRefreshToken(testUser)).thenReturn("refresh.token.here");

        AuthResponse response = authService.login(request);

        assertThat(response.getAccessToken()).isEqualTo("access.token.here");
        assertThat(response.getRefreshToken()).isEqualTo("refresh.token.here");
        assertThat(response.getTokenType()).isEqualTo("Bearer");
        assertThat(response.getExpiresIn()).isEqualTo(900L);
        assertThat(response.getUser().getEmail()).isEqualTo(TEST_EMAIL);
    }

    @Test
    @DisplayName("Login: should throw for invalid credentials")
    void login_InvalidCredentials_ThrowsUnauthorized() {
        LoginRequest request = new LoginRequest();
        request.setEmail(TEST_EMAIL);
        request.setPassword("wrongpassword");

        when(authenticationManager.authenticate(any()))
            .thenThrow(new BadCredentialsException("Bad credentials"));

        assertThatThrownBy(() -> authService.login(request))
            .isInstanceOf(UnauthorizedException.class)
            .hasMessage("Invalid email or password");
    }

    @Test
    @DisplayName("Login: should throw for inactive account")
    void login_InactiveAccount_ThrowsUnauthorized() {
        testUser.setActive(false);

        LoginRequest request = new LoginRequest();
        request.setEmail(TEST_EMAIL);
        request.setPassword(TEST_PASSWORD);

        when(authenticationManager.authenticate(any())).thenReturn(null);
        when(userRepository.findByEmail(TEST_EMAIL)).thenReturn(Optional.of(testUser));

        assertThatThrownBy(() -> authService.login(request))
            .isInstanceOf(UnauthorizedException.class)
            .hasMessage("Account is deactivated");
    }

    // ── Refresh Token Tests ────────────────────────────────────────────────────

    @Test
    @DisplayName("RefreshToken: should return new tokens for valid refresh token")
    void refreshToken_ValidToken_ReturnsNewTokens() {
        var request = new com.taskflow.dto.request.RefreshTokenRequest();
        request.setRefreshToken("valid.refresh.token");

        when(jwtTokenProvider.isTokenValid("valid.refresh.token")).thenReturn(true);
        when(jwtTokenProvider.extractUserId("valid.refresh.token"))
            .thenReturn(testUser.getId());
        when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));
        when(jwtTokenProvider.generateAccessToken(testUser)).thenReturn("new.access.token");
        when(jwtTokenProvider.generateRefreshToken(testUser)).thenReturn("new.refresh.token");

        AuthResponse response = authService.refreshToken(request);

        assertThat(response.getAccessToken()).isEqualTo("new.access.token");
        assertThat(response.getRefreshToken()).isEqualTo("new.refresh.token");
    }

    @Test
    @DisplayName("RefreshToken: should throw for expired refresh token")
    void refreshToken_ExpiredToken_ThrowsUnauthorized() {
        var request = new com.taskflow.dto.request.RefreshTokenRequest();
        request.setRefreshToken("expired.refresh.token");

        when(jwtTokenProvider.isTokenValid("expired.refresh.token")).thenReturn(false);

        assertThatThrownBy(() -> authService.refreshToken(request))
            .isInstanceOf(UnauthorizedException.class)
            .hasMessageContaining("invalid or expired");
    }
}
