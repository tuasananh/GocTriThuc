package com.goctrithuc.backend.controllers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oauth2Login;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.goctrithuc.backend.BaseIntegrationTest;
import com.goctrithuc.backend.dtos.AddQuestionToTestRequest;
import com.goctrithuc.backend.dtos.CreateQuestionRequest;
import com.goctrithuc.backend.dtos.UpdateQuestionRequest;
import com.goctrithuc.backend.entities.*;
import com.goctrithuc.backend.repositories.*;
import java.util.List;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@AutoConfigureMockMvc
public class QuestionControllerIntegrationTest extends BaseIntegrationTest {

  private final MockMvc mockMvc;
  private final UserRepository userRepository;
  private final UserRoleRepository userRoleRepository;
  private final RoleRepository roleRepository;
  private final CourseRepository courseRepository;
  private final ModuleRepository moduleRepository;
  private final LessonRepository lessonRepository;
  private final LessonTestRepository lessonTestRepository;
  private final QuestionRepository questionRepository;
  private final McQuestionRepository mcQuestionRepository;
  private final TestQuestionRepository testQuestionRepository;
  private final EnrollmentRepository enrollmentRepository;
  private final ObjectMapper objectMapper = new ObjectMapper();

  private User adminUser;
  private User teacherA;
  private User teacherB;
  private User studentUser;

  @Autowired
  public QuestionControllerIntegrationTest(
      @SuppressWarnings("SpringJavaInjectionPointsAutowiringInspection") MockMvc mockMvc,
      UserRepository userRepository,
      UserRoleRepository userRoleRepository,
      RoleRepository roleRepository,
      CourseRepository courseRepository,
      ModuleRepository moduleRepository,
      LessonRepository lessonRepository,
      LessonTestRepository lessonTestRepository,
      QuestionRepository questionRepository,
      McQuestionRepository mcQuestionRepository,
      TestQuestionRepository testQuestionRepository,
      EnrollmentRepository enrollmentRepository) {
    this.mockMvc = mockMvc;
    this.userRepository = userRepository;
    this.userRoleRepository = userRoleRepository;
    this.roleRepository = roleRepository;
    this.courseRepository = courseRepository;
    this.moduleRepository = moduleRepository;
    this.lessonRepository = lessonRepository;
    this.lessonTestRepository = lessonTestRepository;
    this.questionRepository = questionRepository;
    this.mcQuestionRepository = mcQuestionRepository;
    this.testQuestionRepository = testQuestionRepository;
    this.enrollmentRepository = enrollmentRepository;
  }

  @BeforeEach
  void setUp() {
    testQuestionRepository.deleteAll();
    mcQuestionRepository.deleteAll();
    questionRepository.deleteAll();
    lessonTestRepository.deleteAll();
    lessonRepository.deleteAll();
    moduleRepository.deleteAll();
    enrollmentRepository.deleteAll();
    courseRepository.deleteAll();
    userRoleRepository.deleteAll();
    userRepository.deleteAll();

    adminUser = userRepository.save(new User("admin@hust.edu.vn", "Admin", "admin", null));
    userRoleRepository.save(
        new UserRole(adminUser, roleRepository.findByName("admin").orElseThrow()));

    teacherA = userRepository.save(new User("teachera@hust.edu.vn", "Teacher A", "teachera", null));
    userRoleRepository.save(
        new UserRole(teacherA, roleRepository.findByName("teacher").orElseThrow()));

    teacherB = userRepository.save(new User("teacherb@hust.edu.vn", "Teacher B", "teacherb", null));
    userRoleRepository.save(
        new UserRole(teacherB, roleRepository.findByName("teacher").orElseThrow()));

    studentUser = userRepository.save(new User("student@hust.edu.vn", "Student", "student", null));
    userRoleRepository.save(
        new UserRole(studentUser, roleRepository.findByName("student").orElseThrow()));
  }

  @AfterEach
  void cleanUp() {
    testQuestionRepository.deleteAll();
    mcQuestionRepository.deleteAll();
    questionRepository.deleteAll();
    lessonTestRepository.deleteAll();
    lessonRepository.deleteAll();
    moduleRepository.deleteAll();
    enrollmentRepository.deleteAll();
    courseRepository.deleteAll();
    userRoleRepository.deleteAll();
    userRepository.deleteAll();
  }

  @Test
  void testCreateQuestionAsInstructor() throws Exception {
    CreateQuestionRequest req =
        new CreateQuestionRequest(
            "What is the capital of Vietnam?",
            List.of("Hanoi", "Saigon", "Da Nang", "Hue"),
            List.of(0),
            true);

    mockMvc
        .perform(
            post("/api/questions")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", teacherA.getEmail())))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.id").exists())
        .andExpect(jsonPath("$.statement").value("What is the capital of Vietnam?"))
        .andExpect(jsonPath("$.choices.length()").value(4))
        .andExpect(jsonPath("$.correctChoices.length()").value(1))
        .andExpect(jsonPath("$.correctChoices[0]").value(0))
        .andExpect(jsonPath("$.isSingleChoice").value(true))
        .andDo(print());
  }

  @Test
  void testCreateQuestionAsStudentForbidden() throws Exception {
    CreateQuestionRequest req =
        new CreateQuestionRequest("Is Java fun?", List.of("Yes", "No"), List.of(0), true);

    mockMvc
        .perform(
            post("/api/questions")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail())))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
        .andExpect(status().isForbidden())
        .andDo(print());
  }

  @Test
  void testCreateQuestionInvalidChoicesCount() throws Exception {
    CreateQuestionRequest req =
        new CreateQuestionRequest("Too few choices?", List.of("Only One"), List.of(0), true);

    mockMvc
        .perform(
            post("/api/questions")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", teacherA.getEmail())))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
        .andExpect(status().isBadRequest())
        .andDo(print());
  }

  @Test
  void testCreateQuestionOutOfBoundsCorrectChoices() throws Exception {
    CreateQuestionRequest req =
        new CreateQuestionRequest(
            "Correct choice out of bounds?",
            List.of("Choice A", "Choice B"),
            List.of(2), // 2 is invalid for 2 choices (0 and 1 are valid)
            true);

    mockMvc
        .perform(
            post("/api/questions")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", teacherA.getEmail())))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
        .andExpect(status().isBadRequest())
        .andDo(print());
  }

  @Test
  void testListQuestionsOnlySeeOwn() throws Exception {
    // Teacher A creates one question
    QuestionEntity qA =
        questionRepository.save(
            new QuestionEntity(teacherA.getId(), "Question A", QuestionType.MULTIPLE_CHOICE));
    mcQuestionRepository.save(
        new McQuestionEntity(qA, new String[] {"1", "2"}, new int[] {0}, true));

    // Teacher B creates one question
    QuestionEntity qB =
        questionRepository.save(
            new QuestionEntity(teacherB.getId(), "Question B", QuestionType.MULTIPLE_CHOICE));
    mcQuestionRepository.save(
        new McQuestionEntity(qB, new String[] {"3", "4"}, new int[] {1}, true));

    // Teacher A lists questions -> should see only Question A
    mockMvc
        .perform(
            get("/api/questions")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", teacherA.getEmail()))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content.length()").value(1))
        .andExpect(jsonPath("$.content[0].statement").value("Question A"))
        .andDo(print());

    // Admin lists questions -> should see both Question A and Question B
    mockMvc
        .perform(
            get("/api/questions")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", adminUser.getEmail()))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content.length()").value(2))
        .andDo(print());
  }

  @Test
  void testListQuestionsReturnsChoicesForAllResults() throws Exception {
    // Regression test for N+1: all 3 questions must have choices populated,
    // proving the JOIN FETCH (not a per-item fallback) is working.
    for (int i = 1; i <= 3; i++) {
      QuestionEntity q =
          questionRepository.save(
              new QuestionEntity(teacherA.getId(), "Question " + i, QuestionType.MULTIPLE_CHOICE));
      mcQuestionRepository.save(
          new McQuestionEntity(q, new String[] {"A", "B"}, new int[] {0}, true));
    }

    mockMvc
        .perform(
            get("/api/questions")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", teacherA.getEmail()))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content.length()").value(3))
        .andExpect(jsonPath("$.content[0].choices.length()").value(2))
        .andExpect(jsonPath("$.content[1].choices.length()").value(2))
        .andExpect(jsonPath("$.content[2].choices.length()").value(2))
        .andDo(print());
  }

  @Test
  void testUpdateQuestion() throws Exception {
    QuestionEntity q =
        questionRepository.save(
            new QuestionEntity(teacherA.getId(), "Old Statement", QuestionType.MULTIPLE_CHOICE));
    mcQuestionRepository.save(
        new McQuestionEntity(q, new String[] {"Choice 1", "Choice 2"}, new int[] {0}, true));

    UpdateQuestionRequest updateReq =
        new UpdateQuestionRequest(
            "New Statement", List.of("Choice 1", "Choice 2", "Choice 3"), List.of(1, 2), false);

    mockMvc
        .perform(
            put("/api/questions/" + q.getId())
                .with(oauth2Login().attributes(attrs -> attrs.put("email", teacherA.getEmail())))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateReq)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.statement").value("New Statement"))
        .andExpect(jsonPath("$.choices.length()").value(3))
        .andExpect(jsonPath("$.correctChoices.length()").value(2))
        .andExpect(jsonPath("$.isSingleChoice").value(false))
        .andDo(print());
  }

  @Test
  void testUpdateOtherQuestionForbidden() throws Exception {
    QuestionEntity q =
        questionRepository.save(
            new QuestionEntity(teacherA.getId(), "Old Statement", QuestionType.MULTIPLE_CHOICE));
    mcQuestionRepository.save(
        new McQuestionEntity(q, new String[] {"Choice 1", "Choice 2"}, new int[] {0}, true));

    UpdateQuestionRequest updateReq =
        new UpdateQuestionRequest(
            "New Statement", List.of("Choice 1", "Choice 2"), List.of(1), true);

    mockMvc
        .perform(
            put("/api/questions/" + q.getId())
                .with(oauth2Login().attributes(attrs -> attrs.put("email", teacherB.getEmail())))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateReq)))
        .andExpect(status().isForbidden())
        .andDo(print());
  }

  @Test
  void testDeleteQuestionCascades() throws Exception {
    Course course =
        courseRepository.save(
            new Course("Course 1", "Desc", null, true, CourseVisibility.PUBLIC, teacherA, null));
    ModuleEntity module = moduleRepository.save(new ModuleEntity(course, "Module 1", 0));
    LessonEntity lesson =
        lessonRepository.save(new LessonEntity(module, "Test Lesson", LessonType.TEST, 0));
    LessonTestEntity test =
        lessonTestRepository.save(new LessonTestEntity(lesson, "Test Statement", 60, null));

    QuestionEntity q =
        questionRepository.save(
            new QuestionEntity(
                teacherA.getId(), "Question Statement", QuestionType.MULTIPLE_CHOICE));
    mcQuestionRepository.save(
        new McQuestionEntity(q, new String[] {"A", "B"}, new int[] {0}, true));

    testQuestionRepository.save(new TestQuestionEntity(test, q, 0, 5.0));

    // Verify link exists
    assertThat(testQuestionRepository.existsById(new TestQuestionId(test.getId(), q.getId())))
        .isTrue();

    mockMvc
        .perform(
            delete("/api/questions/" + q.getId())
                .with(oauth2Login().attributes(attrs -> attrs.put("email", teacherA.getEmail())))
                .with(csrf()))
        .andExpect(status().isNoContent())
        .andDo(print());

    // Verify question is deleted
    assertThat(questionRepository.findById(q.getId())).isEmpty();
    assertThat(mcQuestionRepository.findById(q.getId())).isEmpty();

    // Verify test_question link is cascade deleted
    assertThat(testQuestionRepository.existsById(new TestQuestionId(test.getId(), q.getId())))
        .isFalse();
  }

  @Test
  void testAddQuestionToTest() throws Exception {
    Course course =
        courseRepository.save(
            new Course("Course 1", "Desc", null, true, CourseVisibility.PUBLIC, teacherA, null));
    ModuleEntity module = moduleRepository.save(new ModuleEntity(course, "Module 1", 0));
    LessonEntity lesson =
        lessonRepository.save(new LessonEntity(module, "Test Lesson", LessonType.TEST, 0));
    LessonTestEntity test =
        lessonTestRepository.save(new LessonTestEntity(lesson, "Test Statement", 60, null));

    QuestionEntity q =
        questionRepository.save(
            new QuestionEntity(
                teacherA.getId(), "Question Statement", QuestionType.MULTIPLE_CHOICE));
    mcQuestionRepository.save(
        new McQuestionEntity(q, new String[] {"A", "B"}, new int[] {0}, true));

    AddQuestionToTestRequest addReq = new AddQuestionToTestRequest(q.getId(), 0, 10.0);

    mockMvc
        .perform(
            post("/api/tests/" + test.getId() + "/questions")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", teacherA.getEmail())))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(addReq)))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.id").value(q.getId()))
        .andExpect(jsonPath("$.order").value(0))
        .andExpect(jsonPath("$.point").value(10.0))
        .andDo(print());

    assertThat(testQuestionRepository.existsById(new TestQuestionId(test.getId(), q.getId())))
        .isTrue();
  }

  @Test
  void testGetTestQuestionsInstructorVsStudent() throws Exception {
    Course course =
        courseRepository.save(
            new Course("Course 1", "Desc", null, true, CourseVisibility.PUBLIC, teacherA, null));
    ModuleEntity module = moduleRepository.save(new ModuleEntity(course, "Module 1", 0));
    LessonEntity lesson =
        lessonRepository.save(new LessonEntity(module, "Test Lesson", LessonType.TEST, 0));
    LessonTestEntity test =
        lessonTestRepository.save(new LessonTestEntity(lesson, "Test Statement", 60, null));

    QuestionEntity q =
        questionRepository.save(
            new QuestionEntity(
                teacherA.getId(), "Question Statement", QuestionType.MULTIPLE_CHOICE));
    mcQuestionRepository.save(
        new McQuestionEntity(q, new String[] {"A", "B"}, new int[] {0}, true));

    testQuestionRepository.save(new TestQuestionEntity(test, q, 0, 5.0));

    // Get test questions as instructor -> should show correctChoices
    mockMvc
        .perform(
            get("/api/tests/" + test.getId() + "/questions")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", teacherA.getEmail()))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(1))
        .andExpect(jsonPath("$[0].correctChoices.length()").value(1))
        .andExpect(jsonPath("$[0].correctChoices[0]").value(0))
        .andDo(print());

    // Enroll student
    enrollmentRepository.save(new EnrollmentEntity(studentUser, course));

    // Get test questions as student -> correctChoices should be null (hidden)
    mockMvc
        .perform(
            get("/api/tests/" + test.getId() + "/questions")
                .with(
                    oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail()))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(1))
        .andExpect(jsonPath("$[0].correctChoices").value(Matchers.nullValue())) // is null
        .andDo(print());
  }

  // Regression tests for: lessonRepo was queried with a LessonTest PK in
  // getTestQuestions and validateCourseOwnership, always causing 404.

  @Test
  void testGetTestQuestionsResolvesVialessonTestId() throws Exception {
    Course course =
        courseRepository.save(
            new Course("Course 1", "Desc", null, true, CourseVisibility.PUBLIC, teacherA, null));
    ModuleEntity module = moduleRepository.save(new ModuleEntity(course, "Module 1", 0));
    LessonEntity lesson =
        lessonRepository.save(new LessonEntity(module, "Test Lesson", LessonType.TEST, 0));
    LessonTestEntity test =
        lessonTestRepository.save(new LessonTestEntity(lesson, "Test Statement", 60, null));

    // No questions — just verify the endpoint resolves the test correctly (200, not
    // 404)
    mockMvc
        .perform(
            get("/api/tests/" + test.getId() + "/questions")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", teacherA.getEmail()))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(0))
        .andDo(print());
  }

  @Test
  void testAddQuestionToTestResolvesOwnershipVialessonTestId() throws Exception {
    Course course =
        courseRepository.save(
            new Course("Course 1", "Desc", null, true, CourseVisibility.PUBLIC, teacherA, null));
    ModuleEntity module = moduleRepository.save(new ModuleEntity(course, "Module 1", 0));
    LessonEntity lesson =
        lessonRepository.save(new LessonEntity(module, "Test Lesson", LessonType.TEST, 0));
    LessonTestEntity test =
        lessonTestRepository.save(new LessonTestEntity(lesson, "Test Statement", 60, null));

    QuestionEntity q =
        questionRepository.save(
            new QuestionEntity(
                teacherA.getId(), "Question Statement", QuestionType.MULTIPLE_CHOICE));
    mcQuestionRepository.save(
        new McQuestionEntity(q, new String[] {"A", "B"}, new int[] {0}, true));

    AddQuestionToTestRequest addReq = new AddQuestionToTestRequest(q.getId(), 0, 5.0);

    // Ownership check uses the LessonTest ID to resolve the course — must not 404
    mockMvc
        .perform(
            post("/api/tests/" + test.getId() + "/questions")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", teacherA.getEmail())))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(addReq)))
        .andExpect(status().isCreated())
        .andDo(print());
  }

  @Test
  void testRemoveQuestionFromTest() throws Exception {
    Course course =
        courseRepository.save(
            new Course("Course 1", "Desc", null, true, CourseVisibility.PUBLIC, teacherA, null));
    ModuleEntity module = moduleRepository.save(new ModuleEntity(course, "Module 1", 0));
    LessonEntity lesson =
        lessonRepository.save(new LessonEntity(module, "Test Lesson", LessonType.TEST, 0));
    LessonTestEntity test =
        lessonTestRepository.save(new LessonTestEntity(lesson, "Test Statement", 60, null));

    QuestionEntity q =
        questionRepository.save(
            new QuestionEntity(
                teacherA.getId(), "Question Statement", QuestionType.MULTIPLE_CHOICE));
    mcQuestionRepository.save(
        new McQuestionEntity(q, new String[] {"A", "B"}, new int[] {0}, true));

    testQuestionRepository.save(new TestQuestionEntity(test, q, 0, 5.0));

    mockMvc
        .perform(
            delete("/api/tests/" + test.getId() + "/questions/" + q.getId())
                .with(oauth2Login().attributes(attrs -> attrs.put("email", teacherA.getEmail())))
                .with(csrf()))
        .andExpect(status().isNoContent())
        .andDo(print());

    assertThat(testQuestionRepository.existsById(new TestQuestionId(test.getId(), q.getId())))
        .isFalse();
  }

  @Test
  void testGetTestQuestionsWithoutAccessTestsPermissionForbidden() throws Exception {
    Course course =
        courseRepository.save(
            new Course("Course 1", "Desc", null, true, CourseVisibility.PUBLIC, teacherA, null));
    ModuleEntity module = moduleRepository.save(new ModuleEntity(course, "Module 1", 0));
    LessonEntity lesson =
        lessonRepository.save(new LessonEntity(module, "Test Lesson", LessonType.TEST, 0));
    LessonTestEntity test =
        lessonTestRepository.save(new LessonTestEntity(lesson, "Test Statement", 60, null));

    QuestionEntity q =
        questionRepository.save(
            new QuestionEntity(
                teacherA.getId(), "Question Statement", QuestionType.MULTIPLE_CHOICE));
    mcQuestionRepository.save(
        new McQuestionEntity(q, new String[] {"A", "B"}, new int[] {0}, true));

    testQuestionRepository.save(new TestQuestionEntity(test, q, 0, 5.0));

    User unauthorizedUser =
        userRepository.save(
            new User("unauthorized@hust.edu.vn", "Unauthorized User", "unauthorized", null));

    enrollmentRepository.save(new EnrollmentEntity(unauthorizedUser, course));

    mockMvc
        .perform(
            get("/api/tests/" + test.getId() + "/questions")
                .with(
                    oauth2Login()
                        .attributes(attrs -> attrs.put("email", unauthorizedUser.getEmail()))))
        .andExpect(status().isForbidden())
        .andDo(print());
  }

  @Test
  void testGetTestQuestionsUnauthenticatedUnauthorized() throws Exception {
    Course course =
        courseRepository.save(
            new Course("Course 1", "Desc", null, true, CourseVisibility.PUBLIC, teacherA, null));
    ModuleEntity module = moduleRepository.save(new ModuleEntity(course, "Module 1", 0));
    LessonEntity lesson =
        lessonRepository.save(new LessonEntity(module, "Test Lesson", LessonType.TEST, 0));
    LessonTestEntity test =
        lessonTestRepository.save(new LessonTestEntity(lesson, "Test Statement", 60, null));

    mockMvc
        .perform(get("/api/tests/" + test.getId() + "/questions"))
        .andExpect(status().isUnauthorized())
        .andDo(print());
  }

  @Test
  void testAddQuestionToTestNegativeOrderBadRequest() throws Exception {
    Course course =
        courseRepository.save(
            new Course("Course 1", "Desc", null, true, CourseVisibility.PUBLIC, teacherA, null));
    ModuleEntity module = moduleRepository.save(new ModuleEntity(course, "Module 1", 0));
    LessonEntity lesson =
        lessonRepository.save(new LessonEntity(module, "Test Lesson", LessonType.TEST, 0));
    LessonTestEntity test =
        lessonTestRepository.save(new LessonTestEntity(lesson, "Test Statement", 60, null));

    QuestionEntity q =
        questionRepository.save(
            new QuestionEntity(
                teacherA.getId(), "Question Statement", QuestionType.MULTIPLE_CHOICE));
    mcQuestionRepository.save(
        new McQuestionEntity(q, new String[] {"A", "B"}, new int[] {0}, true));

    AddQuestionToTestRequest addReq = new AddQuestionToTestRequest(q.getId(), -1, 10.0);

    mockMvc
        .perform(
            post("/api/tests/" + test.getId() + "/questions")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", teacherA.getEmail())))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(addReq)))
        .andExpect(status().isBadRequest())
        .andDo(print());
  }

  @Test
  void testAddQuestionToTestNegativePointBadRequest() throws Exception {
    Course course =
        courseRepository.save(
            new Course("Course 1", "Desc", null, true, CourseVisibility.PUBLIC, teacherA, null));
    ModuleEntity module = moduleRepository.save(new ModuleEntity(course, "Module 1", 0));
    LessonEntity lesson =
        lessonRepository.save(new LessonEntity(module, "Test Lesson", LessonType.TEST, 0));
    LessonTestEntity test =
        lessonTestRepository.save(new LessonTestEntity(lesson, "Test Statement", 60, null));

    QuestionEntity q =
        questionRepository.save(
            new QuestionEntity(
                teacherA.getId(), "Question Statement", QuestionType.MULTIPLE_CHOICE));
    mcQuestionRepository.save(
        new McQuestionEntity(q, new String[] {"A", "B"}, new int[] {0}, true));

    AddQuestionToTestRequest addReq = new AddQuestionToTestRequest(q.getId(), 0, -5.0);

    mockMvc
        .perform(
            post("/api/tests/" + test.getId() + "/questions")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", teacherA.getEmail())))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(addReq)))
        .andExpect(status().isBadRequest())
        .andDo(print());
  }

  @Test
  void testCreateQuestionSingleChoiceWithMultipleCorrectChoicesBadRequest() throws Exception {
    CreateQuestionRequest req =
        new CreateQuestionRequest(
            "Which of these are correct?",
            List.of("Choice A", "Choice B", "Choice C"),
            List.of(0, 1),
            true); // isSingleChoice = true

    mockMvc
        .perform(
            post("/api/questions")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", teacherA.getEmail())))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
        .andExpect(status().isBadRequest())
        .andDo(print());
  }

  @Test
  void testCreateQuestionDuplicateCorrectChoicesBadRequest() throws Exception {
    CreateQuestionRequest req =
        new CreateQuestionRequest(
            "Unique choices?",
            List.of("Choice A", "Choice B"),
            List.of(0, 0),
            false); // isSingleChoice = false

    mockMvc
        .perform(
            post("/api/questions")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", teacherA.getEmail())))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
        .andExpect(status().isBadRequest())
        .andDo(print());
  }

  @Test
  void testUpdateQuestionSingleChoiceWithMultipleCorrectChoicesBadRequest() throws Exception {
    QuestionEntity q =
        questionRepository.save(
            new QuestionEntity(teacherA.getId(), "Old Statement", QuestionType.MULTIPLE_CHOICE));
    mcQuestionRepository.save(
        new McQuestionEntity(q, new String[] {"Choice 1", "Choice 2"}, new int[] {0}, true));

    UpdateQuestionRequest updateReq =
        new UpdateQuestionRequest(
            "New Statement", List.of("Choice 1", "Choice 2"), List.of(0, 1), true);

    mockMvc
        .perform(
            put("/api/questions/" + q.getId())
                .with(oauth2Login().attributes(attrs -> attrs.put("email", teacherA.getEmail())))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateReq)))
        .andExpect(status().isBadRequest())
        .andDo(print());
  }

  @Test
  void testUpdateQuestionDuplicateCorrectChoicesBadRequest() throws Exception {
    QuestionEntity q =
        questionRepository.save(
            new QuestionEntity(teacherA.getId(), "Old Statement", QuestionType.MULTIPLE_CHOICE));
    mcQuestionRepository.save(
        new McQuestionEntity(q, new String[] {"Choice 1", "Choice 2"}, new int[] {0}, true));

    UpdateQuestionRequest updateReq =
        new UpdateQuestionRequest(
            "New Statement", List.of("Choice 1", "Choice 2"), List.of(0, 0), false);

    mockMvc
        .perform(
            put("/api/questions/" + q.getId())
                .with(oauth2Login().attributes(attrs -> attrs.put("email", teacherA.getEmail())))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateReq)))
        .andExpect(status().isBadRequest())
        .andDo(print());
  }

  @Test
  void testAddQuestionToTestDuplicateOrderConflict() throws Exception {
    Course course =
        courseRepository.save(
            new Course("Course 1", "Desc", null, true, CourseVisibility.PUBLIC, teacherA, null));
    ModuleEntity module = moduleRepository.save(new ModuleEntity(course, "Module 1", 0));
    LessonEntity lesson =
        lessonRepository.save(new LessonEntity(module, "Test Lesson", LessonType.TEST, 0));
    LessonTestEntity test =
        lessonTestRepository.save(new LessonTestEntity(lesson, "Test Statement", 60, null));

    QuestionEntity q1 =
        questionRepository.save(
            new QuestionEntity(teacherA.getId(), "Question 1", QuestionType.MULTIPLE_CHOICE));
    mcQuestionRepository.save(
        new McQuestionEntity(q1, new String[] {"A", "B"}, new int[] {0}, true));

    QuestionEntity q2 =
        questionRepository.save(
            new QuestionEntity(teacherA.getId(), "Question 2", QuestionType.MULTIPLE_CHOICE));
    mcQuestionRepository.save(
        new McQuestionEntity(q2, new String[] {"C", "D"}, new int[] {1}, true));

    testQuestionRepository.save(new TestQuestionEntity(test, q1, 0, 5.0));

    AddQuestionToTestRequest addReq = new AddQuestionToTestRequest(q2.getId(), 0, 10.0);

    mockMvc
        .perform(
            post("/api/tests/" + test.getId() + "/questions")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", teacherA.getEmail())))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(addReq)))
        .andExpect(status().isConflict())
        .andDo(print());
  }
}
