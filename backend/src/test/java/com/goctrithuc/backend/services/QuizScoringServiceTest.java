package com.goctrithuc.backend.services;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

import com.goctrithuc.backend.entities.*;
import com.goctrithuc.backend.repositories.*;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

public class QuizScoringServiceTest {

  private McQuestionRepository mcQuestionRepo;
  private TestQuestionRepository testQuestionRepo;
  private TestSessionAnswerRepository testSessionAnswerRepository;
  private ScoreService scoreService;

  private QuizScoringService service;

  @BeforeEach
  void setUp() {
    mcQuestionRepo = mock(McQuestionRepository.class);
    testQuestionRepo = mock(TestQuestionRepository.class);
    testSessionAnswerRepository = mock(TestSessionAnswerRepository.class);
    scoreService = mock(ScoreService.class);

    service =
        new QuizScoringService(
            testQuestionRepo, testSessionAnswerRepository, mcQuestionRepo, scoreService);
  }

  @Test
  void validateAnswerBounds_rejectsNegativeIndex() {
    McQuestionEntity mc = mock(McQuestionEntity.class);
    when(mc.getChoices()).thenReturn(new String[] {"A", "B"});
    when(mcQuestionRepo.findById(1L)).thenReturn(Optional.of(mc));

    assertThatThrownBy(() -> service.validateAnswerBounds(1L, List.of(-1)))
        .isInstanceOf(ResponseStatusException.class)
        .hasMessageContaining("Choice index -1 out of bounds");
  }

  @Test
  void validateAnswerBounds_rejectsIndexEqualToChoicesLength() {
    McQuestionEntity mc = mock(McQuestionEntity.class);
    when(mc.getChoices()).thenReturn(new String[] {"A", "B"});
    when(mcQuestionRepo.findById(1L)).thenReturn(Optional.of(mc));

    assertThatThrownBy(() -> service.validateAnswerBounds(1L, List.of(2)))
        .isInstanceOf(ResponseStatusException.class)
        .hasMessageContaining("Choice index 2 out of bounds");
  }

  @Test
  void validateAnswerBounds_singleChoice_rejectsMultipleSelections() {
    McQuestionEntity mc = mock(McQuestionEntity.class);
    when(mc.getChoices()).thenReturn(new String[] {"A", "B"});
    when(mc.isSingleChoice()).thenReturn(true);
    when(mcQuestionRepo.findById(1L)).thenReturn(Optional.of(mc));

    assertThatThrownBy(() -> service.validateAnswerBounds(1L, List.of(0, 1)))
        .isInstanceOf(ResponseStatusException.class)
        .hasMessageContaining("Single-choice question requires exactly 1 selection");
  }

  @Test
  void validateAnswerBounds_emptyList_isAllowed_forSingleChoice() {
    // Empty list = "clear answer" — single-choice validation intentionally skipped.
    // No mock needed: mcQuestionRepo should NOT be called for empty lists.
    service.validateAnswerBounds(1L, List.of());
    verifyNoInteractions(mcQuestionRepo);
  }

  @Test
  void validateAnswerBounds_nullChoices_throws400() {
    assertThatThrownBy(() -> service.validateAnswerBounds(1L, null))
        .isInstanceOf(ResponseStatusException.class)
        .hasMessageContaining("Choices selection cannot be null");
  }
}
