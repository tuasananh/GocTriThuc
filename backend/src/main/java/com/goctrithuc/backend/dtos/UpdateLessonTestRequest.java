package com.goctrithuc.backend.dtos;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.Map;

public record UpdateLessonTestRequest(
    @NotBlank(message = "Statement is required") String statement,
    @NotNull(message = "Time limit is required")
        @Min(value = 1, message = "Time limit must be at least 1 second")
        Integer timeLimit,
    Map<String, Object> settings) {}
