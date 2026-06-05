package com.goctrithuc.backend.dtos;

import jakarta.validation.constraints.NotNull;
import java.util.List;

public record SaveAnswerRequest(
    @NotNull Long questionId, @NotNull List<@NotNull Integer> selectedChoices) {}
