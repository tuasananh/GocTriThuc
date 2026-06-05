package com.goctrithuc.backend.services;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

import com.goctrithuc.backend.entities.*;
import com.goctrithuc.backend.repositories.*;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

public class TestSessionServiceTest {

  private TestSessionRepository testSessionRepo;
  private TestSessionAnswerRepository testSessionAnswerRepository;
  private LessonRepository lessonRepo;
  private LessonTestRepository lessonTestRepo;
  private EnrollmentRepository enrollmentRepo;
  private UserRepository userRepository;
  private McQuestionRepository mcQuestionRepo;
  private TestQuestionRepository testQuestionRepo;
  private PermissionService permissionService;
  private ScoreService scoreService;

  private TestSessionService testSessionService;

  @BeforeEach
  void setUp() {
    testSessionRepo = mock(TestSessionRepository.class);
    testSessionAnswerRepository = mock(TestSessionAnswerRepository.class);
    lessonRepo = mock(LessonRepository.class);
    lessonTestRepo = mock(LessonTestRepository.class);
    enrollmentRepo = mock(EnrollmentRepository.class);
    userRepository = mock(UserRepository.class);
    mcQuestionRepo = mock(McQuestionRepository.class);
    testQuestionRepo = mock(TestQuestionRepository.class);
    permissionService = mock(PermissionService.class);
    scoreService = mock(ScoreService.class);

    testSessionService =
        new TestSessionService(
            testSessionRepo,
            testSessionAnswerRepository,
            lessonRepo,
            lessonTestRepo,
            enrollmentRepo,
            userRepository,
            mcQuestionRepo,
            testQuestionRepo,
            permissionService,
            scoreService);
  }

  @Test
  void lazyAutoSubmitIfExpired_setsIsDoneAndSubmittedAt() {
    LessonTestEntity test = mock(LessonTestEntity.class);
    when(test.getTimeLimit()).thenReturn(60);

    ZonedDateTime startedAt = ZonedDateTime.now().minusSeconds(61);
    TestSessionEntity session = spy(new TestSessionEntity(null, test, startedAt));

    testSessionService.lazyAutoSubmitIfExpired(session);

    assertThat(session.isDone()).isTrue();
    assertThat(session.getSubmittedAt()).isEqualTo(startedAt.plusSeconds(60));
    verify(testSessionRepo).save(session);
  }

  @Test
  void lazyAutoSubmitIfExpired_doesNothingIfNotExpired() {
    LessonTestEntity test = mock(LessonTestEntity.class);
    when(test.getTimeLimit()).thenReturn(60);

    ZonedDateTime startedAt = ZonedDateTime.now().minusSeconds(30);
    TestSessionEntity session = spy(new TestSessionEntity(null, test, startedAt));

    testSessionService.lazyAutoSubmitIfExpired(session);

    assertThat(session.isDone()).isFalse();
    assertThat(session.getSubmittedAt()).isNull();
    verify(testSessionRepo, never()).save(any());
  }

  @Test
  void remainingTime_calculation_is_correct() {
    LessonTestEntity test = mock(LessonTestEntity.class);
    ZonedDateTime startedAt = ZonedDateTime.now().minusSeconds(20);
    TestSessionEntity session = new TestSessionEntity(null, test, startedAt);

    long remaining = testSessionService.calculateRemainingTime(session, 60);
    assertThat(remaining).isBetween(35L, 45L);
  }

  @Test
  void remainingTime_clamps_to_zero_when_negative() {
    LessonTestEntity test = mock(LessonTestEntity.class);
    ZonedDateTime startedAt = ZonedDateTime.now().minusSeconds(100);
    TestSessionEntity session = new TestSessionEntity(null, test, startedAt);

    long remaining = testSessionService.calculateRemainingTime(session, 60);
    assertThat(remaining).isEqualTo(0);
  }

  @Test
  void validateAnswerBounds_rejectsNegativeIndex() {
    McQuestionEntity mc = mock(McQuestionEntity.class);
    when(mc.getChoices()).thenReturn(new String[] {"A", "B"});
    when(mcQuestionRepo.findById(1L)).thenReturn(Optional.of(mc));

    assertThatThrownBy(() -> testSessionService.validateAnswerBounds(1L, List.of(-1)))
        .isInstanceOf(ResponseStatusException.class)
        .hasMessageContaining("Choice index -1 out of bounds");
  }

  @Test
  void validateAnswerBounds_rejectsIndexEqualToChoicesLength() {
    McQuestionEntity mc = mock(McQuestionEntity.class);
    when(mc.getChoices()).thenReturn(new String[] {"A", "B"});
    when(mcQuestionRepo.findById(1L)).thenReturn(Optional.of(mc));

    assertThatThrownBy(() -> testSessionService.validateAnswerBounds(1L, List.of(2)))
        .isInstanceOf(ResponseStatusException.class)
        .hasMessageContaining("Choice index 2 out of bounds");
  }

  @Test
  void validateAnswerBounds_singleChoice_rejectsMultipleSelections() {
    McQuestionEntity mc = mock(McQuestionEntity.class);
    when(mc.getChoices()).thenReturn(new String[] {"A", "B"});
    when(mc.isSingleChoice()).thenReturn(true);
    when(mcQuestionRepo.findById(1L)).thenReturn(Optional.of(mc));

    assertThatThrownBy(() -> testSessionService.validateAnswerBounds(1L, List.of(0, 1)))
        .isInstanceOf(ResponseStatusException.class)
        .hasMessageContaining("Single-choice question requires exactly 1 selection");
  }
}
