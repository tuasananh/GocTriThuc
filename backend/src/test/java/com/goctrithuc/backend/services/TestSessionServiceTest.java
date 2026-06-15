package com.goctrithuc.backend.services;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.goctrithuc.backend.dtos.SaveAnswerRequest;
import com.goctrithuc.backend.dtos.TestResultResponse;
import com.goctrithuc.backend.entities.*;
import com.goctrithuc.backend.repositories.*;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/**
 * Unit tests for TestSessionService orchestration logic. Scoring and lifecycle behaviour are
 * covered by QuizScoringServiceTest and SessionLifecycleServiceTest respectively.
 */
public class TestSessionServiceTest {

  private TestSessionRepository testSessionRepo;
  private TestSessionAnswerRepository testSessionAnswerRepository;
  private LessonTestRepository lessonTestRepo;
  private EnrollmentRepository enrollmentRepo;
  private UserRepository userRepository;
  private PermissionService permissionService;
  private SessionLifecycleService lifecycleService;
  private QuizScoringService quizScoringService;
  private LessonCompletionService lessonCompletionService;

  private TestSessionService testSessionService;

  @BeforeEach
  void setUp() {
    testSessionRepo = mock(TestSessionRepository.class);
    testSessionAnswerRepository = mock(TestSessionAnswerRepository.class);
    lessonTestRepo = mock(LessonTestRepository.class);
    enrollmentRepo = mock(EnrollmentRepository.class);
    userRepository = mock(UserRepository.class);
    permissionService = mock(PermissionService.class);
    lifecycleService = mock(SessionLifecycleService.class);
    quizScoringService = mock(QuizScoringService.class);
    lessonCompletionService = mock(LessonCompletionService.class);

    testSessionService =
        new TestSessionService(
            testSessionRepo,
            testSessionAnswerRepository,
            lessonTestRepo,
            enrollmentRepo,
            userRepository,
            permissionService,
            lifecycleService,
            quizScoringService,
            lessonCompletionService);
  }

  @Test
  void saveAnswer_sessionNotFound_throws404() {
    when(testSessionRepo.findById(99L)).thenReturn(java.util.Optional.empty());

    assertThatThrownBy(() -> testSessionService.saveAnswer(99L, null, 1L))
        .isInstanceOf(ResponseStatusException.class)
        .satisfies(
            ex ->
                assertThat(((ResponseStatusException) ex).getStatusCode().value()).isEqualTo(404));
  }

  @Test
  void submitSession_sessionNotFound_throws404() {
    when(testSessionRepo.findById(99L)).thenReturn(java.util.Optional.empty());

    assertThatThrownBy(() -> testSessionService.submitSession(99L, 1L))
        .isInstanceOf(ResponseStatusException.class)
        .satisfies(
            ex ->
                assertThat(((ResponseStatusException) ex).getStatusCode().value()).isEqualTo(404));
  }

  @Test
  void saveAnswer_notOwner_throws403() {
    User owner = mock(User.class);
    when(owner.getId()).thenReturn(1L);

    TestSessionEntity session = mock(TestSessionEntity.class);
    when(session.getUser()).thenReturn(owner);
    when(testSessionRepo.findById(10L)).thenReturn(Optional.of(session));

    assertThatThrownBy(
            () -> testSessionService.saveAnswer(10L, new SaveAnswerRequest(5L, List.of(0)), 99L))
        .isInstanceOf(ResponseStatusException.class)
        .satisfies(
            ex ->
                assertThat(((ResponseStatusException) ex).getStatusCode())
                    .isEqualTo(HttpStatus.FORBIDDEN));
  }

  @Test
  void startSession_concurrentRequest_returns409() {
    // Setup: test found, user enrolled, no existing session, but save() throws due to
    // partial unique index hit from a concurrent request — service must return 409, not 500.
    LessonTestEntity test = mock(LessonTestEntity.class);
    LessonEntity lesson = mock(LessonEntity.class);
    ModuleEntity module = mock(ModuleEntity.class);
    Course course = mock(Course.class);
    User author = mock(User.class);
    User user = mock(User.class);

    when(author.getId()).thenReturn(99L);
    when(course.getAuthor()).thenReturn(author);
    when(course.getId()).thenReturn(10L);
    when(module.getCourse()).thenReturn(course);
    when(lesson.getModule()).thenReturn(module);
    when(test.getLesson()).thenReturn(lesson);
    when(test.getTimeLimit()).thenReturn(60);
    when(user.getId()).thenReturn(1L);

    when(lessonTestRepo.findById(42L)).thenReturn(Optional.of(test));
    when(permissionService.isAdmin(1L)).thenReturn(false);
    when(enrollmentRepo.existsById(any())).thenReturn(true);
    when(testSessionRepo.existsByUserIdAndTestIdAndIsDoneTrue(1L, 42L)).thenReturn(false);
    when(testSessionRepo.findByUserIdAndTestIdAndIsDoneFalse(1L, 42L)).thenReturn(Optional.empty());
    when(userRepository.findById(1L)).thenReturn(Optional.of(user));
    // Simulate race: DB partial unique index rejects the second concurrent insert
    when(testSessionRepo.save(any())).thenThrow(new DataIntegrityViolationException("unique"));

    assertThatThrownBy(() -> testSessionService.startSession(42L, 1L))
        .isInstanceOf(ResponseStatusException.class)
        .satisfies(
            ex ->
                assertThat(((ResponseStatusException) ex).getStatusCode())
                    .isEqualTo(HttpStatus.CONFLICT));
  }

  @Test
  void submitSession_alreadyDone_throws409() {
    User owner = mock(User.class);
    when(owner.getId()).thenReturn(1L);

    TestSessionEntity session = mock(TestSessionEntity.class);
    when(session.getUser()).thenReturn(owner);
    when(session.isDone()).thenReturn(true);
    when(testSessionRepo.findById(20L)).thenReturn(Optional.of(session));

    assertThatThrownBy(() -> testSessionService.submitSession(20L, 1L))
        .isInstanceOf(ResponseStatusException.class)
        .satisfies(
            ex ->
                assertThat(((ResponseStatusException) ex).getStatusCode())
                    .isEqualTo(HttpStatus.CONFLICT));
  }

  @Test
  void submitSession_success_marksLessonAsCompleted() {
    User owner = mock(User.class);
    when(owner.getId()).thenReturn(1L);

    LessonTestEntity test = mock(LessonTestEntity.class);
    when(test.getId()).thenReturn(42L);

    TestSessionEntity session = mock(TestSessionEntity.class);
    when(session.getUser()).thenReturn(owner);
    when(session.isDone()).thenReturn(false);
    when(session.getTest()).thenReturn(test);
    when(testSessionRepo.findById(20L)).thenReturn(Optional.of(session));
    when(testSessionRepo.save(any())).thenReturn(session);

    testSessionService.submitSession(20L, 1L);

    verify(lessonCompletionService).markComplete(1L, 42L);
  }

  @Test
  void getMySessionsForTest_notEnrolled_throws403() {
    LessonTestEntity test = mock(LessonTestEntity.class);
    LessonEntity lesson = mock(LessonEntity.class);
    ModuleEntity module = mock(ModuleEntity.class);
    Course course = mock(Course.class);
    User author = mock(User.class);

    when(author.getId()).thenReturn(99L);
    when(course.getAuthor()).thenReturn(author);
    when(course.getId()).thenReturn(10L);
    when(module.getCourse()).thenReturn(course);
    when(lesson.getModule()).thenReturn(module);
    when(test.getLesson()).thenReturn(lesson);

    when(lessonTestRepo.findById(42L)).thenReturn(Optional.of(test));
    when(permissionService.isAdmin(1L)).thenReturn(false);
    when(enrollmentRepo.existsById(any())).thenReturn(false);

    assertThatThrownBy(() -> testSessionService.getMySessionsForTest(42L, 1L))
        .isInstanceOf(ResponseStatusException.class)
        .satisfies(
            ex ->
                assertThat(((ResponseStatusException) ex).getStatusCode())
                    .isEqualTo(HttpStatus.FORBIDDEN));
  }

  @Test
  void getMySessionsForTest_success() {
    LessonTestEntity test = mock(LessonTestEntity.class);
    LessonEntity lesson = mock(LessonEntity.class);
    ModuleEntity module = mock(ModuleEntity.class);
    Course course = mock(Course.class);
    User author = mock(User.class);

    when(author.getId()).thenReturn(99L);
    when(course.getAuthor()).thenReturn(author);
    when(course.getId()).thenReturn(10L);
    when(course.getTitle()).thenReturn("Java course");
    when(module.getCourse()).thenReturn(course);
    when(lesson.getModule()).thenReturn(module);
    when(lesson.getTitle()).thenReturn("Test Title");
    when(test.getLesson()).thenReturn(lesson);
    when(test.getId()).thenReturn(42L);

    when(lessonTestRepo.findById(42L)).thenReturn(Optional.of(test));
    when(permissionService.isAdmin(1L)).thenReturn(false);
    when(enrollmentRepo.existsById(any())).thenReturn(true);

    TestSessionEntity session = mock(TestSessionEntity.class);
    when(session.getId()).thenReturn(100L);
    when(session.getTest()).thenReturn(test);
    when(testSessionRepo.findCompletedByUserIdAndTestId(1L, 42L)).thenReturn(List.of(session));

    TestResultResponse scoreRes = mock(TestResultResponse.class);
    when(scoreRes.score()).thenReturn(95.0);
    when(scoreRes.correctCount()).thenReturn(19);
    when(scoreRes.totalQuestions()).thenReturn(20);
    when(quizScoringService.calculateResults(any())).thenReturn(Map.of(100L, scoreRes));

    var results = testSessionService.getMySessionsForTest(42L, 1L);
    assertThat(results).hasSize(1);
    assertThat(results.get(0).score()).isEqualTo(95.0);
    assertThat(results.get(0).testTitle()).isEqualTo("Test Title");
  }
}
