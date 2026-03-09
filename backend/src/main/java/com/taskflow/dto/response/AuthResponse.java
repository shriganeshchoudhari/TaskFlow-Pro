package com.taskflow.dto.response;

import lombok.*;

/**
 * Response DTO returned on login and token refresh.
 * Must be a separate public class (not nested in Responses.java)
 * so it is accessible across packages (service, controller).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    private String tokenType;
    private Long expiresIn;
    private UserResponse user;
}
