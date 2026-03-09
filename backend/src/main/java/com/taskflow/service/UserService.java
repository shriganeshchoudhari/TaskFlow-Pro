package com.taskflow.service;

import com.taskflow.dto.request.UpdatePasswordRequest;
import com.taskflow.dto.request.UpdateProfileRequest;
import com.taskflow.dto.response.UserResponse;
import com.taskflow.exception.ConflictException;
import com.taskflow.exception.UnauthorizedException;
import com.taskflow.model.User;
import com.taskflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(UserDetails currentUser) {
        return UserResponse.fromEntity(resolveUser(currentUser));
    }

    @Transactional
    public UserResponse updateProfile(UpdateProfileRequest req, UserDetails currentUser) {
        User user = resolveUser(currentUser);
        if (req.getFullName() != null) user.setFullName(req.getFullName().trim());
        if (req.getAvatarUrl() != null) user.setAvatarUrl(req.getAvatarUrl());
        return UserResponse.fromEntity(userRepository.save(user));
    }

    @Transactional
    public void updatePassword(UpdatePasswordRequest req, UserDetails currentUser) {
        User user = resolveUser(currentUser);
        if (!passwordEncoder.matches(req.getCurrentPassword(), user.getPassword())) {
            throw new UnauthorizedException("Current password is incorrect");
        }
        if (!req.getNewPassword().equals(req.getConfirmPassword())) {
            throw new ConflictException("New password and confirmation do not match");
        }
        user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(user);
    }

    private User resolveUser(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
            .orElseThrow(() -> new UnauthorizedException("User not found"));
    }
}
