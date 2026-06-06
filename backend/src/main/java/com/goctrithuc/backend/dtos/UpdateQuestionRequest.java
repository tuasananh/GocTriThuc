package com.goctrithuc.backend.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;

public record UpdateQuestionRequest(
    @NotBlank(message = "Statement is required") String statement,
    @NotEmpty(message = "Choices list cannot be empty")
        @Size(min = 2, max = 6, message = "Choices count must be between 2 and 6")
        List<@NotBlank(message = "Choice value cannot be blank") String> choices,
    @NotEmpty(message = "Correct choices list cannot be empty") List<Integer> correctChoices,
    boolean isSingleChoice) {}
