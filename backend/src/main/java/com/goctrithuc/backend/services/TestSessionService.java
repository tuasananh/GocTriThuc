package com.goctrithuc.backend.services;

import com.goctrithuc.backend.dtos.*;
import com.goctrithuc.backend.entities.*;
import com.goctrithuc.backend.repositories.*;
import java.time.ZonedDateTime;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class TestSessionService {

  private final TestSessionRepository testSessionRepo;
  private final TestSessionAnswerRepository testSessionAnswerRepository;
  private final LessonRepository lessonRepo;
  private final LessonTestRepository lessonTestRepo;
  private final EnrollmentRepository enrollmentRepo;
  private final UserRepository userRepository;
  private final McQuestionRepository mcQuestionRepo;
  private final TestQuestionRepository testQuestionRepo;
  private final PermissionService permissionService;
  private final ScoreService scoreService;

  public TestSessionService(
      TestSessionRepository testSessionRepo,
      TestSessionAnswerRepository testSessionAnswerRepository,
      LessonRepository lessonRepo,
      LessonTestRepository lessonTestRepo,
      EnrollmentRepository enrollmentRepo,
      UserRepository userRepository,
      McQuestionRepository mcQuestionRepo,
      TestQuestionRepository testQuestionRepo,
      PermissionService permissionService,
      ScoreService scoreService) {
    this.testSessionRepo = testSessionRepo;
    this.testSessionAnswerRepository = testSessionAnswerRepository;
    this.lessonRepo = lessonRepo;
    this.lessonTestRepo = lessonTestRepo;
    this.enrollmentRepo = enrollmentRepo;
    this.userRepository = userRepository;
    this.mcQuestionRepo = mcQuestionRepo;
    this.testQuestionRepo = testQuestionRepo;
    this.permissionService = permissionService;
    this.scoreService = scoreService;
  }

  @Transactional(noRollbackFor = ResponseStatusException.class)
  public TestSessionResponse startSession(Long testId, Long userId) {
    LessonEntity lesson =
        lessonRepo
            .findById(testId)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found"));
    LessonTestEntity test =
        lessonTestRepo
            .findById(testId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Test not found"));

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
      lazyAutoSubmitIfExpired(activeSession);
      if (!activeSession.isDone()) {
        long remainingTime = calculateRemainingTime(activeSession, test.getTimeLimit());
        return TestSessionResponse.from(activeSession, remainingTime);
      } else {
        throw new ResponseStatusException(
            HttpStatus.CONFLICT, "You have already completed this test");
      }
    }

    User user =
        userRepository
            .findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

    TestSessionEntity newSession = new TestSessionEntity(user, test, ZonedDateTime.now());
    newSession = testSessionRepo.save(newSession);

    return TestSessionResponse.from(newSession, test.getTimeLimit());
  }

  @Transactional(noRollbackFor = ResponseStatusException.class)
  public TestSessionResponse getActiveSession(Long testId, Long userId) {
    TestSessionEntity activeSession =
        testSessionRepo
            .findByUserIdAndTestIdAndIsDoneFalse(userId, testId)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No active session found"));

    lazyAutoSubmitIfExpired(activeSession);
    if (activeSession.isDone()) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No active session found");
    }

    long remainingTime =
        calculateRemainingTime(activeSession, activeSession.getTest().getTimeLimit());
    return TestSessionResponse.from(activeSession, remainingTime);
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

    lazyAutoSubmitIfExpired(session);
    if (session.isDone()) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Session is already completed");
    }

    boolean belongs =
        testQuestionRepo.existsByTestIdAndQuestionId(session.getTest().getId(), req.questionId());
    if (!belongs) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "Question does not belong to this test");
    }

    validateAnswerBounds(req.questionId(), req.selectedChoices());

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

    lazyAutoSubmitIfExpired(session);
    if (session.isDone()) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Session is already completed");
    }

    session.setDone(true);
    session.setSubmittedAt(ZonedDateTime.now());
    session = testSessionRepo.save(session);

    return calculateResult(session);
  }

  @Transactional(noRollbackFor = ResponseStatusException.class)
  public TestResultResponse getResult(Long sessionId, Long userId) {
    TestSessionEntity session =
        testSessionRepo
            .findByIdWithTest(sessionId)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found"));

    boolean isOwner = session.getUser().getId().equals(userId);
    LessonEntity lesson =
        lessonRepo
            .findById(session.getTest().getId())
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found"));
    boolean isCourseAuthor = lesson.getModule().getCourse().getAuthor().getId().equals(userId);
    boolean isAdmin = permissionService.isAdmin(userId);

    if (!isOwner && !isCourseAuthor && !isAdmin) {
      throw new ResponseStatusException(
          HttpStatus.FORBIDDEN, "Access denied to this session result");
    }

    lazyAutoSubmitIfExpired(session);
    if (!session.isDone()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Session is not completed yet");
    }

    return calculateResult(session);
  }

  @Transactional(readOnly = true)
  public List<TestSessionSummaryResponse> listTestSessions(Long testId, Long userId) {
    LessonEntity lesson =
        lessonRepo
            .findById(testId)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found"));

    boolean isCourseAuthor = lesson.getModule().getCourse().getAuthor().getId().equals(userId);
    boolean isAdmin = permissionService.isAdmin(userId);

    if (!isCourseAuthor && !isAdmin) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied to session list");
    }

    List<TestSessionEntity> sessions = testSessionRepo.findWithUserByTestId(testId);
    return sessions.stream().map(TestSessionSummaryResponse::from).toList();
  }

  public void lazyAutoSubmitIfExpired(TestSessionEntity session) {
    if (session.isDone()) {
      return;
    }
    LessonTestEntity test = session.getTest();
    if (test.getTimeLimit() == null || test.getTimeLimit() <= 0) {
      return;
    }
    ZonedDateTime deadline = session.getStartedAt().plusSeconds(test.getTimeLimit());
    if (ZonedDateTime.now().isAfter(deadline)) {
      session.setDone(true);
      session.setSubmittedAt(deadline);
      testSessionRepo.save(session);
    }
  }

  public long calculateRemainingTime(TestSessionEntity session, Integer timeLimit) {
    if (session.isDone() || timeLimit == null || timeLimit <= 0) {
      return 0;
    }
    ZonedDateTime deadline = session.getStartedAt().plusSeconds(timeLimit);
    long remaining = deadline.toEpochSecond() - ZonedDateTime.now().toEpochSecond();
    return Math.max(0, remaining);
  }

  public void validateAnswerBounds(Long questionId, List<Integer> selectedChoices) {
    if (selectedChoices == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choices selection cannot be null");
    }

    if (selectedChoices.isEmpty()) {
      return;
    }

    McQuestionEntity mc =
        mcQuestionRepo
            .findById(questionId)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Question not found"));

    for (int idx : selectedChoices) {
      if (idx < 0 || idx >= mc.getChoices().length) {
        throw new ResponseStatusException(
            HttpStatus.BAD_REQUEST,
            "Choice index " + idx + " out of bounds [0, " + (mc.getChoices().length - 1) + "]");
      }
    }

    if (mc.isSingleChoice() && selectedChoices.size() != 1) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "Single-choice question requires exactly 1 selection");
    }
  }

  private TestResultResponse calculateResult(TestSessionEntity session) {
    Long testId = session.getTest().getId();
    Long sessionId = session.getId();

    List<Object[]> details = testQuestionRepo.findWithDetailsByTestId(testId);
    List<TestSessionAnswerEntity> studentAnswers =
        testSessionAnswerRepository.findBySessionId(sessionId);

    Map<Long, int[]> answerMap = new HashMap<>();
    for (TestSessionAnswerEntity ans : studentAnswers) {
      answerMap.put(ans.getQuestionId(), ans.getQuestionAnswer());
    }

    List<McQuestionEntity> mcList = new ArrayList<>();
    List<int[]> answerList = new ArrayList<>();
    List<Double> pointsList = new ArrayList<>();
    List<QuestionResultItem> questionResultItems = new ArrayList<>();

    for (Object[] row : details) {
      TestQuestionEntity tq = (TestQuestionEntity) row[0];
      QuestionEntity q = (QuestionEntity) row[1];
      McQuestionEntity mc = (McQuestionEntity) row[2];

      int[] ans = answerMap.get(q.getId());
      Double pt = tq.getPoint();

      mcList.add(mc);
      answerList.add(ans);
      pointsList.add(pt);

      boolean isCorrect =
          ans != null
              && Arrays.equals(
                  Arrays.stream(ans).sorted().toArray(),
                  Arrays.stream(mc.getCorrectChoices()).sorted().toArray());

      List<String> choicesList =
          mc.getChoices() != null ? Arrays.asList(mc.getChoices()) : List.of();
      List<Integer> correctChoicesList =
          mc.getCorrectChoices() != null
              ? Arrays.stream(mc.getCorrectChoices()).boxed().toList()
              : List.of();
      List<Integer> studentAnswerList =
          ans != null ? Arrays.stream(ans).boxed().toList() : List.of();

      questionResultItems.add(
          new QuestionResultItem(
              q.getId(),
              q.getStatement(),
              choicesList,
              correctChoicesList,
              studentAnswerList,
              isCorrect,
              pt));
    }

    double totalScore = scoreService.calculateTotalScore(mcList, answerList, pointsList);

    int correctCount = 0;
    for (QuestionResultItem item : questionResultItems) {
      if (item.isCorrect()) {
        correctCount++;
      }
    }

    long timeTakenSeconds = 0;
    if (session.getSubmittedAt() != null) {
      timeTakenSeconds =
          session.getSubmittedAt().toEpochSecond() - session.getStartedAt().toEpochSecond();
      if (timeTakenSeconds < 0) {
        timeTakenSeconds = 0;
      }
    }

    return new TestResultResponse(
        sessionId,
        testId,
        totalScore,
        correctCount,
        questionResultItems.size(),
        session.getStartedAt(),
        session.getSubmittedAt(),
        timeTakenSeconds,
        questionResultItems);
  }
}
