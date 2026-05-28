package com.goctrithuc.backend.dtos;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateUserRequest(
    @Size(min = 2, max = 100) String displayName,
    @Size(min = 3, max = 30)
        @Pattern(
            regexp = "^[a-zA-Z0-9_]+$",
            message = "Username may only contain letters, numbers, and underscores")
        String username,
    String avatarUrl) {}
