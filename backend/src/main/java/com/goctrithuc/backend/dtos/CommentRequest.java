package com.goctrithuc.backend.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CommentRequest(
    @NotBlank(message = "Comment content cannot be blank")
        @Size(max = 5000, message = "Comment content cannot exceed 5000 characters")
        String content,
    Long parentId) {}
