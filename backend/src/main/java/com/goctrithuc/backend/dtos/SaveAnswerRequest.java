package com.goctrithuc.backend.dtos;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record SaveAnswerRequest(
    @NotNull Long questionId, @NotNull @Size(min = 1) List<@NotNull Integer> selectedChoices) {}
