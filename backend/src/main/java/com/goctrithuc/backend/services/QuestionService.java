package com.goctrithuc.backend.services;

import com.goctrithuc.backend.dtos.*;
import com.goctrithuc.backend.entities.*;
import com.goctrithuc.backend.repositories.*;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class QuestionService {

  private final QuestionRepository questionRepo;
  private final McQuestionRepository mcQuestionRepo;
  private final TestQuestionRepository testQuestionRepo;
  private final LessonTestRepository lessonTestRepo;
  private final EnrollmentRepository enrollmentRepo;
  private final PermissionService permissionService;

  public QuestionService(
      QuestionRepository questionRepo,
      McQuestionRepository mcQuestionRepo,
      TestQuestionRepository testQuestionRepo,
      LessonTestRepository lessonTestRepo,
      LessonRepository lessonRepo,
      EnrollmentRepository enrollmentRepo,
      PermissionService permissionService) {
    this.questionRepo = questionRepo;
    this.mcQuestionRepo = mcQuestionRepo;
    this.testQuestionRepo = testQuestionRepo;
    this.lessonTestRepo = lessonTestRepo;
    this.enrollmentRepo = enrollmentRepo;
    this.permissionService = permissionService;
  }

  private void validateQuestionChoices(
      List<String> choices, List<Integer> correctChoices, boolean isSingleChoice) {
    if (correctChoices == null || correctChoices.isEmpty()) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "Correct choices list cannot be empty");
    }

    long uniqueCount = correctChoices.stream().distinct().count();
    if (uniqueCount < correctChoices.size()) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "correctChoices must contain unique indices");
    }

    if (isSingleChoice && uniqueCount != 1) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "Single-choice question must have exactly one correct choice");
    }

    for (int idx : correctChoices) {
      if (idx < 0 || idx >= choices.size()) {
        throw new ResponseStatusException(
            HttpStatus.BAD_REQUEST,
            "correctChoices index " + idx + " out of bounds [0, " + (choices.size() - 1) + "]");
      }
    }
  }

  @Transactional
  public QuestionResponse createQuestion(CreateQuestionRequest req, Long userId) {
    validateQuestionChoices(req.choices(), req.correctChoices(), req.isSingleChoice());

    QuestionEntity question =
        new QuestionEntity(userId, req.statement(), QuestionType.MULTIPLE_CHOICE);
    question = questionRepo.save(question);

    String[] choicesArr = req.choices().toArray(new String[0]);
    int[] correctChoicesArr = req.correctChoices().stream().mapToInt(Integer::intValue).toArray();

    McQuestionEntity mcQuestion =
        new McQuestionEntity(question, choicesArr, correctChoicesArr, req.isSingleChoice());
    mcQuestion = mcQuestionRepo.save(mcQuestion);

    return QuestionResponse.fromInstructor(question, mcQuestion);
  }

  @Transactional
  public QuestionResponse updateQuestion(Long id, UpdateQuestionRequest req, Long userId) {
    QuestionEntity question =
        questionRepo
            .findById(id)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Question not found"));

    if (!question.getAuthorId().equals(userId) && !permissionService.isAdmin(userId)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not own this question");
    }

    validateQuestionChoices(req.choices(), req.correctChoices(), req.isSingleChoice());

    question.setStatement(req.statement());
    question = questionRepo.save(question);

    McQuestionEntity mcQuestion =
        mcQuestionRepo
            .findById(id)
            .orElseThrow(
                () ->
                    new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "McQuestion details not found"));

    String[] choicesArr = req.choices().toArray(new String[0]);
    int[] correctChoicesArr = req.correctChoices().stream().mapToInt(Integer::intValue).toArray();

    mcQuestion.setChoices(choicesArr);
    mcQuestion.setCorrectChoices(correctChoicesArr);
    mcQuestion.setSingleChoice(req.isSingleChoice());
    mcQuestion = mcQuestionRepo.save(mcQuestion);

    return QuestionResponse.fromInstructor(question, mcQuestion);
  }

  @Transactional
  public void deleteQuestion(Long id, Long userId) {
    QuestionEntity question =
        questionRepo
            .findById(id)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Question not found"));

    if (!question.getAuthorId().equals(userId) && !permissionService.isAdmin(userId)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not own this question");
    }

    questionRepo.delete(question);
  }

  @Transactional(readOnly = true)
  public Page<QuestionResponse> listQuestions(
      String search, Pageable pageable, Long currentUserId) {
    boolean isAdmin = permissionService.isAdmin(currentUserId);
    Page<QuestionEntity> page;

    if (isAdmin) {
      if (search != null && !search.isBlank()) {
        page = questionRepo.findBySearch(search, pageable);
      } else {
        page = questionRepo.findAllWithMc(pageable);
      }
    } else {
      if (search != null && !search.isBlank()) {
        page = questionRepo.findByAuthorIdAndSearch(currentUserId, search, pageable);
      } else {
        page = questionRepo.findByAuthorId(currentUserId, pageable);
      }
    }

    return page.map(q -> QuestionResponse.fromInstructor(q, q.getMcQuestion()));
  }

  @Transactional(readOnly = true)
  public QuestionResponse getQuestion(Long id, Long userId) {
    QuestionEntity question =
        questionRepo
            .findById(id)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Question not found"));

    if (!question.getAuthorId().equals(userId) && !permissionService.isAdmin(userId)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not own this question");
    }

    McQuestionEntity mc =
        mcQuestionRepo
            .findById(id)
            .orElseThrow(
                () ->
                    new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "McQuestion details not found"));

    return QuestionResponse.fromInstructor(question, mc);
  }

  @Transactional
  public TestQuestionResponse addQuestionToTest(
      Long testId, AddQuestionToTestRequest req, Long userId) {
    LessonTestEntity test =
        lessonTestRepo
            .findById(testId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Test not found"));
    QuestionEntity question =
        questionRepo
            .findById(req.questionId())
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Question not found"));

    // Check course ownership for the test
    validateCourseOwnership(testId, userId);

    // Check if user owns the question (or admin)
    if (!question.getAuthorId().equals(userId) && !permissionService.isAdmin(userId)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not own this question");
    }

    if (testQuestionRepo.existsByTestIdAndQuestionId(testId, req.questionId())) {
      throw new ResponseStatusException(
          HttpStatus.CONFLICT, "Question is already added to this test");
    }

    TestQuestionEntity testQuestion =
        new TestQuestionEntity(test, question, req.order(), req.point());
    testQuestion = testQuestionRepo.save(testQuestion);

    McQuestionEntity mcQuestion =
        mcQuestionRepo
            .findById(req.questionId())
            .orElseThrow(
                () ->
                    new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "McQuestion details not found"));

    return TestQuestionResponse.fromInstructor(testQuestion, question, mcQuestion);
  }

  @Transactional
  public void removeQuestionFromTest(Long testId, Long questionId, Long userId) {
    validateCourseOwnership(testId, userId);

    TestQuestionId tqId = new TestQuestionId(testId, questionId);
    if (!testQuestionRepo.existsById(tqId)) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Question link to test not found");
    }

    testQuestionRepo.deleteById(tqId);
  }

  @Transactional(readOnly = true)
  public List<TestQuestionResponse> getTestQuestions(Long testId, Long userId) {
    LessonTestEntity lessonTest =
        lessonTestRepo
            .findById(testId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Test not found"));
    LessonEntity lesson = lessonTest.getLesson();
    Long courseId = lesson.getModule().getCourse().getId();

    boolean isCourseAuthor = lesson.getModule().getCourse().getAuthor().getId().equals(userId);
    boolean isAdmin = permissionService.isAdmin(userId);
    boolean isEnrolled = enrollmentRepo.existsById(new EnrollmentId(userId, courseId));

    if (!isCourseAuthor && !isAdmin && !isEnrolled) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied to this test");
    }

    List<Object[]> details = testQuestionRepo.findWithDetailsByTestId(testId);
    boolean showCorrect = isCourseAuthor || isAdmin;

    return details.stream()
        .map(
            row -> {
              TestQuestionEntity tq = (TestQuestionEntity) row[0];
              QuestionEntity q = (QuestionEntity) row[1];
              McQuestionEntity mc = (McQuestionEntity) row[2];

              if (showCorrect) {
                return TestQuestionResponse.fromInstructor(tq, q, mc);
              } else {
                return TestQuestionResponse.fromStudent(tq, q, mc);
              }
            })
        .toList();
  }

  private void validateCourseOwnership(Long testId, Long userId) {
    if (permissionService.isAdmin(userId)) {
      return;
    }
    LessonTestEntity lessonTest =
        lessonTestRepo
            .findById(testId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Test not found"));
    Course course = lessonTest.getLesson().getModule().getCourse();
    if (!course.getAuthor().getId().equals(userId)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not own this course");
    }
  }
}
