package com.goctrithuc.backend.dtos;

import java.util.List;

public record QuestionResultItem(
    Long questionId,
    String statement,
    List<String> choices,
    List<Integer> correctChoices,
    List<Integer> studentAnswer,
    boolean isCorrect,
    Double point) {}
