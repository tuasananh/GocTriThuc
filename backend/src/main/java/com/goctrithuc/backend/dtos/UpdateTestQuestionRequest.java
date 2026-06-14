package com.goctrithuc.backend.dtos;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record UpdateTestQuestionRequest(
    @NotNull(message = "Point is required") @PositiveOrZero(message = "Point must be >= 0")
        Double point) {}
