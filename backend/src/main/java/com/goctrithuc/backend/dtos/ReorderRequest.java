package com.goctrithuc.backend.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ReorderRequest(
    @NotBlank(message = "Direction is required")
        @Pattern(regexp = "^(?i)(up|down)$", message = "Direction must be 'up' or 'down'")
        String direction) {}
