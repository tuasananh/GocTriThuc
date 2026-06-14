package com.goctrithuc.backend.services;

import com.goctrithuc.backend.dtos.*;
import com.goctrithuc.backend.entities.*;
import com.goctrithuc.backend.repositories.*;
import java.time.ZonedDateTime;
import java.util.*;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class TestSessionService {

  private final TestSessionRepository testSessionRepo;
  private final TestSessionAnswerRepository testSessionAnswerRepository;
  private final LessonTestRepository lessonTestRepo;
  private final EnrollmentRepository enrollmentRepo;
  private final UserRepository userRepository;
  private final PermissionService permissionService;
  private final SessionLifecycleService lifecycleService;
  private final QuizScoringService quizScoringService;

  public TestSessionService(
      TestSessionRepository testSessionRepo,
      TestSessionAnswerRepository testSessionAnswerRepository,
      LessonTestRepository lessonTestRepo,
      EnrollmentRepository enrollmentRepo,
      UserRepository userRepository,
      PermissionService permissionService,
      SessionLifecycleService lifecycleService,
      QuizScoringService quizScoringService) {
    this.testSessionRepo = testSessionRepo;
    this.testSessionAnswerRepository = testSessionAnswerRepository;
    this.lessonTestRepo = lessonTestRepo;
    this.enrollmentRepo = enrollmentRepo;
    this.userRepository = userRepository;
    this.permissionService = permissionService;
    this.lifecycleService = lifecycleService;
    this.quizScoringService = quizScoringService;
  }

  @Transactional(noRollbackFor = ResponseStatusException.class)
  public TestSessionResponse startSession(Long testId, Long userId) {
    LessonTestEntity test =
        lessonTestRepo
            .findById(testId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Test not found"));

    // Navigate via FK — test.getLesson() is correct; testId ≠ lessonId
    LessonEntity lesson = test.getLesson();

    Long courseId = lesson.getModule().getCourse().getId();
    boolean isCourseAuthor = lesson.getModule().getCourse().getAuthor().getId().equals(userId);
    boolean isAdmin = permissionService.isAdmin(userId);
    boolean isEnrolled = enrollmentRepo.existsById(new EnrollmentId(userId, courseId));

    if (!isCourseAuthor && !isAdmin && !isEnrolled) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied to this test");
    }

    if (testSessionRepo.existsByUserIdAndTestIdAndIsDoneTrue(userId, testId)) {
      throw new ResponseStatusException(
          HttpStatus.CONFLICT, "You have already completed this test");
    }

    Optional<TestSessionEntity> activeSessionOpt =
        testSessionRepo.findByUserIdAndTestIdAndIsDoneFalse(userId, testId);
    if (activeSessionOpt.isPresent()) {
      TestSessionEntity activeSession = activeSessionOpt.get();
      lifecycleService.lazyAutoSubmitIfExpired(activeSession);
      if (!activeSession.isDone()) {
        long remainingTime =
            lifecycleService.calculateRemainingTime(activeSession, test.getTimeLimit());
        return TestSessionResponse.from(activeSession, remainingTime, false);
      } else {
        throw new ResponseStatusException(
            HttpStatus.CONFLICT, "Session expired — test already submitted");
      }
    }

    User user =
        userRepository
            .findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

    TestSessionEntity newSession = new TestSessionEntity(user, test, ZonedDateTime.now());
    try {
      newSession = testSessionRepo.save(newSession);
    } catch (DataIntegrityViolationException e) {
      // Concurrent startSession request hit the partial unique index (user_id, test_id) WHERE
      // is_done = FALSE. Treat as a conflict rather than leaking a 500.
      throw new ResponseStatusException(
          HttpStatus.CONFLICT, "Session already started (concurrent request)");
    }

    return TestSessionResponse.from(newSession, test.getTimeLimit(), true);
  }

  @Transactional(noRollbackFor = ResponseStatusException.class)
  public TestSessionResponse getActiveSession(Long testId, Long userId) {
    TestSessionEntity activeSession =
        testSessionRepo
            .findByUserIdAndTestIdAndIsDoneFalse(userId, testId)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No active session found"));

    lifecycleService.lazyAutoSubmitIfExpired(activeSession);
    if (activeSession.isDone()) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No active session found");
    }

    long remainingTime =
        lifecycleService.calculateRemainingTime(
            activeSession, activeSession.getTest().getTimeLimit());
    return TestSessionResponse.from(activeSession, remainingTime, false);
  }

  @Transactional(readOnly = true)
  public SessionAnswersResponse getSessionAnswers(Long sessionId, Long userId) {
    TestSessionEntity session =
        testSessionRepo
            .findById(sessionId)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found"));

    if (!session.getUser().getId().equals(userId)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not own this session");
    }

    List<TestSessionAnswerEntity> answers = testSessionAnswerRepository.findBySessionId(sessionId);
    Map<Long, List<Integer>> result = new HashMap<>();
    for (TestSessionAnswerEntity ans : answers) {
      if (ans.getQuestionAnswer() != null) {
        List<Integer> choices = new ArrayList<>();
        for (int c : ans.getQuestionAnswer()) {
          choices.add(c);
        }
        result.put(ans.getQuestionId(), choices);
      }
    }
    return new SessionAnswersResponse(result);
  }

  @Transactional(noRollbackFor = ResponseStatusException.class)
  public void saveAnswer(Long sessionId, SaveAnswerRequest req, Long userId) {
    TestSessionEntity session =
        testSessionRepo
            .findById(sessionId)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found"));

    if (!session.getUser().getId().equals(userId)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not own this session");
    }

    lifecycleService.lazyAutoSubmitIfExpired(session);
    if (session.isDone()) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Session is already completed");
    }

    if (!quizScoringService.questionBelongsToTest(session.getTest().getId(), req.questionId())) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "Question does not belong to this test");
    }

    quizScoringService.validateAnswerBounds(req.questionId(), req.selectedChoices());

    int[] selectedChoicesArray =
        req.selectedChoices().stream().mapToInt(Integer::intValue).toArray();

    Optional<TestSessionAnswerEntity> answerOpt =
        testSessionAnswerRepository.findBySessionIdAndQuestionId(sessionId, req.questionId());
    if (answerOpt.isPresent()) {
      TestSessionAnswerEntity answer = answerOpt.get();
      answer.setQuestionAnswer(selectedChoicesArray);
      testSessionAnswerRepository.save(answer);
    } else {
      TestSessionAnswerEntity newAnswer =
          new TestSessionAnswerEntity(session, req.questionId(), selectedChoicesArray);
      testSessionAnswerRepository.save(newAnswer);
    }
  }

  @Transactional(noRollbackFor = ResponseStatusException.class)
  public TestResultResponse submitSession(Long sessionId, Long userId) {
    TestSessionEntity session =
        testSessionRepo
            .findById(sessionId)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found"));

    if (!session.getUser().getId().equals(userId)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not own this session");
    }

    lifecycleService.lazyAutoSubmitIfExpired(session);
    if (session.isDone()) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Session is already completed");
    }

    session.setDone(true);
    session.setSubmittedAt(ZonedDateTime.now());
    session = testSessionRepo.save(session);

    return quizScoringService.calculateResult(session);
  }

  @Transactional(noRollbackFor = ResponseStatusException.class)
  public TestResultResponse getResult(Long sessionId, Long userId) {
    TestSessionEntity session =
        testSessionRepo
            .findByIdWithTest(sessionId)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found"));

    boolean isOwner = session.getUser().getId().equals(userId);
    // Navigate via FK — session.getTest().getLesson() is correct; test ID ≠ lesson ID
    LessonEntity lesson = session.getTest().getLesson();
    boolean isCourseAuthor = lesson.getModule().getCourse().getAuthor().getId().equals(userId);
    boolean isAdmin = permissionService.isAdmin(userId);

    if (!isOwner && !isCourseAuthor && !isAdmin) {
      throw new ResponseStatusException(
          HttpStatus.FORBIDDEN, "Access denied to this session result");
    }

    lifecycleService.lazyAutoSubmitIfExpired(session);
    if (!session.isDone()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Session is not completed yet");
    }

    return quizScoringService.calculateResult(session);
  }

  @Transactional(readOnly = true)
  public List<TestSessionSummaryResponse> listTestSessions(Long testId, Long userId) {
    LessonTestEntity test =
        lessonTestRepo
            .findById(testId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Test not found"));

    // Navigate via FK — test.getLesson() is correct; testId ≠ lessonId
    LessonEntity lesson = test.getLesson();
    boolean isCourseAuthor = lesson.getModule().getCourse().getAuthor().getId().equals(userId);
    boolean isAdmin = permissionService.isAdmin(userId);

    if (!isCourseAuthor && !isAdmin) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied to session list");
    }

    List<TestSessionEntity> sessions = testSessionRepo.findWithUserByTestId(testId);
    return sessions.stream().map(TestSessionSummaryResponse::from).toList();
  }

  @Transactional(readOnly = true)
  public Page<MyTestSessionResponse> getMyTestSessions(Long userId, Pageable pageable) {
    Page<TestSessionEntity> sessions =
        testSessionRepo.findCompletedWithTestAndCourseByUserId(userId, pageable);
    Map<Long, TestResultResponse> results =
        quizScoringService.calculateResults(sessions.getContent());

    return sessions.map(
        session -> {
          TestResultResponse result = results.get(session.getId());
          LessonEntity lesson = session.getTest().getLesson();
          Course course = lesson.getModule().getCourse();
          return new MyTestSessionResponse(
              session.getId(),
              session.getTest().getId(),
              lesson.getTitle(),
              course.getTitle(),
              course.getId(),
              result.score(),
              result.correctCount(),
              result.totalQuestions(),
              session.getSubmittedAt());
        });
  }
}
