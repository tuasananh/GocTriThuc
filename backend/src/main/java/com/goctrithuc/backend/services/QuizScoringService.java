package com.goctrithuc.backend.services;

import com.goctrithuc.backend.dtos.QuestionResultItem;
import com.goctrithuc.backend.dtos.TestResultResponse;
import com.goctrithuc.backend.entities.*;
import com.goctrithuc.backend.repositories.*;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class QuizScoringService {

  private final TestQuestionRepository testQuestionRepo;
  private final TestSessionAnswerRepository testSessionAnswerRepository;
  private final McQuestionRepository mcQuestionRepo;
  private final ScoreService scoreService;

  public QuizScoringService(
      TestQuestionRepository testQuestionRepo,
      TestSessionAnswerRepository testSessionAnswerRepository,
      McQuestionRepository mcQuestionRepo,
      ScoreService scoreService) {
    this.testQuestionRepo = testQuestionRepo;
    this.testSessionAnswerRepository = testSessionAnswerRepository;
    this.mcQuestionRepo = mcQuestionRepo;
    this.scoreService = scoreService;
  }

  /**
   * Returns true if the question belongs to the test, false otherwise. Used to guard answer saves.
   */
  @Transactional(readOnly = true)
  public boolean questionBelongsToTest(Long testId, Long questionId) {
    return testQuestionRepo.existsByTestIdAndQuestionId(testId, questionId);
  }

  /**
   * Validates that all submitted choice indices are within bounds for the question, and that
   * single-choice questions receive exactly one selection.
   *
   * <p>Empty {@code selectedChoices} is explicitly allowed — it represents the student clearing a
   * previously saved answer (de-select all). Single-choice validation is intentionally skipped for
   * empty lists.
   *
   * @throws ResponseStatusException 400 if any index is out of bounds, if choices is null, or if a
   *     single-choice question receives more than one selection.
   */
  public void validateAnswerBounds(Long questionId, List<Integer> selectedChoices) {
    if (selectedChoices == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choices selection cannot be null");
    }

    // Empty list = clear saved answer. Single-choice enforcement skipped intentionally.
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

  /**
   * Calculates the full result for a completed session, including per-question correctness, score,
   * and time taken.
   */
  @Transactional(readOnly = true)
  public TestResultResponse calculateResult(TestSessionEntity session) {
    Long testId = session.getTest().getId();
    Long sessionId = session.getId();

    List<Object[]> details = testQuestionRepo.findWithDetailsByTestId(testId);
    List<TestSessionAnswerEntity> studentAnswers =
        testSessionAnswerRepository.findBySessionId(sessionId);
    return calculateResult(session, details, studentAnswers);
  }

  @Transactional(readOnly = true)
  public Map<Long, TestResultResponse> calculateResults(List<TestSessionEntity> sessions) {
    if (sessions.isEmpty()) {
      return Map.of();
    }

    List<Long> testIds =
        sessions.stream().map(session -> session.getTest().getId()).distinct().toList();
    List<Long> sessionIds = sessions.stream().map(TestSessionEntity::getId).toList();

    Map<Long, List<Object[]>> detailsByTestId =
        testQuestionRepo.findWithDetailsByTestIds(testIds).stream()
            .collect(
                java.util.stream.Collectors.groupingBy(
                    row -> ((TestQuestionEntity) row[0]).getTest().getId()));
    Map<Long, List<TestSessionAnswerEntity>> answersBySessionId =
        testSessionAnswerRepository.findBySessionIds(sessionIds).stream()
            .collect(java.util.stream.Collectors.groupingBy(answer -> answer.getSession().getId()));

    Map<Long, TestResultResponse> results = new HashMap<>();
    for (TestSessionEntity session : sessions) {
      results.put(
          session.getId(),
          calculateResult(
              session,
              detailsByTestId.getOrDefault(session.getTest().getId(), List.of()),
              answersBySessionId.getOrDefault(session.getId(), List.of())));
    }
    return results;
  }

  private TestResultResponse calculateResult(
      TestSessionEntity session,
      List<Object[]> details,
      List<TestSessionAnswerEntity> studentAnswers) {
    Long testId = session.getTest().getId();
    Long sessionId = session.getId();
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
