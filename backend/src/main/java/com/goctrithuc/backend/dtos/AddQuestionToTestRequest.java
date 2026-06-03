package com.goctrithuc.backend.dtos;

import jakarta.validation.constraints.NotNull;

public record AddQuestionToTestRequest(
    @NotNull(message = "Question ID is required") Long questionId,
    @NotNull(message = "Order is required") Integer order,
    Double point) {}
