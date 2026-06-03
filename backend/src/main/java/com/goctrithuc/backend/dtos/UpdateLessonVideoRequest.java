package com.goctrithuc.backend.dtos;

import com.goctrithuc.backend.entities.VideoProvider;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UpdateLessonVideoRequest(
    @NotNull(message = "Provider is required") VideoProvider provider,
    @NotBlank(message = "Video value is required") String providerValue) {}
