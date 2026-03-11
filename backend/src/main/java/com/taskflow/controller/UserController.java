package com.taskflow.controller;

import com.taskflow.dto.request.UpdatePasswordRequest;
import com.taskflow.dto.request.UpdateProfileRequest;
import com.taskflow.dto.response.UserResponse;
import com.taskflow.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "User profile and password management")
public class UserController {

    private final UserService userService;

    @Operation(summary = "Get current user", description = "Retrieve the authenticated user's profile")
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(
            @AuthenticationPrincipal UserDetails currentUser) {
        return ResponseEntity.ok(userService.getCurrentUser(currentUser));
    }

    @Operation(summary = "Update profile", description = "Update the current user's full name or avatar")
    @PutMapping("/me")
    public ResponseEntity<UserResponse> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        return ResponseEntity.ok(userService.updateProfile(request, currentUser));
    }

    @Operation(summary = "Change password", description = "Change the current user's password")
    @PutMapping("/me/password")
    public ResponseEntity<Void> changePassword(
            @Valid @RequestBody UpdatePasswordRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        userService.updatePassword(request, currentUser);
        return ResponseEntity.noContent().build();
    }
}
