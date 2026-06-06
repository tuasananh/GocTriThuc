package com.goctrithuc.backend.dtos;

import com.goctrithuc.backend.entities.McQuestionEntity;
import com.goctrithuc.backend.entities.QuestionEntity;
import java.time.ZonedDateTime;
import java.util.Arrays;
import java.util.List;

public record QuestionResponse(
    Long id,
    String statement,
    String questionType,
    List<String> choices,
    List<Integer> correctChoices,
    boolean isSingleChoice,
    ZonedDateTime createdAt,
    ZonedDateTime updatedAt) {

  public static QuestionResponse fromInstructor(QuestionEntity q, McQuestionEntity mc) {
    List<String> choicesList = mc.getChoices() != null ? Arrays.asList(mc.getChoices()) : List.of();
    List<Integer> correctChoicesList =
        mc.getCorrectChoices() != null
            ? Arrays.stream(mc.getCorrectChoices()).boxed().toList()
            : List.of();

    return new QuestionResponse(
        q.getId(),
        q.getStatement(),
        q.getQuestionType().toJson(),
        choicesList,
        correctChoicesList,
        mc.isSingleChoice(),
        q.getCreatedAt(),
        q.getUpdatedAt());
  }

  public static QuestionResponse fromStudent(QuestionEntity q, McQuestionEntity mc) {
    List<String> choicesList = mc.getChoices() != null ? Arrays.asList(mc.getChoices()) : List.of();

    return new QuestionResponse(
        q.getId(),
        q.getStatement(),
        q.getQuestionType().toJson(),
        choicesList,
        null, // Hidden for students
        mc.isSingleChoice(),
        q.getCreatedAt(),
        q.getUpdatedAt());
  }
}
