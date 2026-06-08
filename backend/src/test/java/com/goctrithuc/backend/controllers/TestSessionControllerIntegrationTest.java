package com.goctrithuc.backend.controllers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oauth2Login;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.goctrithuc.backend.BaseIntegrationTest;
import com.goctrithuc.backend.dtos.SaveAnswerRequest;
import com.goctrithuc.backend.entities.*;
import com.goctrithuc.backend.repositories.*;
import java.time.ZonedDateTime;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@AutoConfigureMockMvc
public class TestSessionControllerIntegrationTest extends BaseIntegrationTest {

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
  private final TestSessionRepository testSessionRepository;
  private final TestSessionAnswerRepository testSessionAnswerRepository;
  private final ObjectMapper objectMapper = new ObjectMapper();

  private User teacherA;
  private User studentUser;
  private User studentUser2;

  private Course course;
  private LessonTestEntity testEntity;
  private QuestionEntity q1;
  private QuestionEntity q2;
  private TestQuestionEntity tq1;
  private TestQuestionEntity tq2;

  @Autowired
  public TestSessionControllerIntegrationTest(
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
      EnrollmentRepository enrollmentRepository,
      TestSessionRepository testSessionRepository,
      TestSessionAnswerRepository testSessionAnswerRepository) {
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
    this.testSessionRepository = testSessionRepository;
    this.testSessionAnswerRepository = testSessionAnswerRepository;
  }

  @BeforeEach
  void setUp() {
    cleanDatabase();

    User adminUser = userRepository.save(new User("admin@hust.edu.vn", "Admin", "admin", null));
    userRoleRepository.save(
        new UserRole(adminUser, roleRepository.findByName("admin").orElseThrow()));

    teacherA = userRepository.save(new User("teachera@hust.edu.vn", "Teacher A", "teachera", null));
    userRoleRepository.save(
        new UserRole(teacherA, roleRepository.findByName("teacher").orElseThrow()));

    User teacherB =
        userRepository.save(new User("teacherb@hust.edu.vn", "Teacher B", "teacherb", null));
    userRoleRepository.save(
        new UserRole(teacherB, roleRepository.findByName("teacher").orElseThrow()));

    studentUser = userRepository.save(new User("student@hust.edu.vn", "Student", "student", null));
    userRoleRepository.save(
        new UserRole(studentUser, roleRepository.findByName("student").orElseThrow()));

    studentUser2 =
        userRepository.save(new User("student2@hust.edu.vn", "Student 2", "student2", null));
    userRoleRepository.save(
        new UserRole(studentUser2, roleRepository.findByName("student").orElseThrow()));

    // Create course, module, lesson test
    course =
        courseRepository.save(
            new Course(
                "Java Core",
                "Java Core Course",
                null,
                true,
                CourseVisibility.PUBLIC,
                teacherA,
                null));
    ModuleEntity module = moduleRepository.save(new ModuleEntity(course, "Module 1", 0));
    LessonEntity lesson =
        lessonRepository.save(new LessonEntity(module, "Lesson Test 1", LessonType.TEST, 0));
    testEntity =
        lessonTestRepository.save(new LessonTestEntity(lesson, "Test Statement", 60, null));

    // Create questions
    q1 =
        questionRepository.save(
            new QuestionEntity(
                teacherA.getId(), "Is Java object-oriented?", QuestionType.MULTIPLE_CHOICE));
    mcQuestionRepository.save(
        new McQuestionEntity(q1, new String[] {"Yes", "No"}, new int[] {0}, true));

    q2 =
        questionRepository.save(
            new QuestionEntity(
                teacherA.getId(), "Select Java keywords", QuestionType.MULTIPLE_CHOICE));
    mcQuestionRepository.save(
        new McQuestionEntity(
            q2, new String[] {"class", "goto", "interface"}, new int[] {0, 2}, false));

    // Link questions to test
    tq1 = testQuestionRepository.save(new TestQuestionEntity(testEntity, q1, 0, 4.0));
    tq2 = testQuestionRepository.save(new TestQuestionEntity(testEntity, q2, 1, 6.0));

    // Enroll studentUser by default
    enrollmentRepository.save(new EnrollmentEntity(studentUser, course));
  }

  @AfterEach
  void cleanUp() {
    cleanDatabase();
  }

  private void cleanDatabase() {
    testSessionAnswerRepository.deleteAll();
    testSessionRepository.deleteAll();
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
  void startNewSession() throws Exception {
    mockMvc
        .perform(
            post("/api/tests/" + testEntity.getId() + "/sessions")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail())))
                .with(csrf()))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.id").exists())
        .andExpect(jsonPath("$.testId").value(testEntity.getId()))
        .andExpect(jsonPath("$.userId").value(studentUser.getId()))
        .andExpect(jsonPath("$.isNew").value(true))
        .andExpect(jsonPath("$.remainingTime").value(60))
        .andDo(print());
  }

  @Test
  void resumeExistingSession() throws Exception {
    // Start session once
    mockMvc
        .perform(
            post("/api/tests/" + testEntity.getId() + "/sessions")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail())))
                .with(csrf()))
        .andExpect(status().isCreated());

    // Backdate session startedAt by 5 seconds to ensure resume returns 200 OK
    TestSessionEntity session =
        testSessionRepository
            .findByUserIdAndTestIdAndIsDoneFalse(studentUser.getId(), testEntity.getId())
            .orElseThrow();
    session.setStartedAt(ZonedDateTime.now().minusSeconds(5));
    testSessionRepository.saveAndFlush(session);

    // Start session again (resume flow)
    mockMvc
        .perform(
            post("/api/tests/" + testEntity.getId() + "/sessions")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail())))
                .with(csrf()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").exists())
        .andExpect(jsonPath("$.isNew").value(false))
        .andDo(print());
  }

  @Test
  void startSession_alreadySubmitted_returns409() throws Exception {
    // Start session
    mockMvc
        .perform(
            post("/api/tests/" + testEntity.getId() + "/sessions")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail())))
                .with(csrf()))
        .andExpect(status().isCreated());

    // Find session and submit it
    TestSessionEntity session =
        testSessionRepository
            .findByUserIdAndTestIdAndIsDoneFalse(studentUser.getId(), testEntity.getId())
            .orElseThrow();
    session.setDone(true);
    session.setSubmittedAt(ZonedDateTime.now());
    testSessionRepository.save(session);

    // Try starting a new session -> 409 Conflict
    mockMvc
        .perform(
            post("/api/tests/" + testEntity.getId() + "/sessions")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail())))
                .with(csrf()))
        .andExpect(status().isConflict())
        .andDo(print());
  }

  @Test
  void startSession_notEnrolled_returns403() throws Exception {
    // studentUser2 is not enrolled in the course
    mockMvc
        .perform(
            post("/api/tests/" + testEntity.getId() + "/sessions")
                .with(
                    oauth2Login().attributes(attrs -> attrs.put("email", studentUser2.getEmail())))
                .with(csrf()))
        .andExpect(status().isForbidden())
        .andDo(print());
  }

  @Test
  void startSession_unauthenticated_returns401() throws Exception {
    mockMvc
        .perform(post("/api/tests/" + testEntity.getId() + "/sessions").with(csrf()))
        .andExpect(status().isUnauthorized())
        .andDo(print());
  }

  @Test
  void getActiveSession_returnsRemainingTime() throws Exception {
    // Start session
    mockMvc
        .perform(
            post("/api/tests/" + testEntity.getId() + "/sessions")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail())))
                .with(csrf()))
        .andExpect(status().isCreated());

    mockMvc
        .perform(
            get("/api/tests/" + testEntity.getId() + "/sessions/active")
                .with(
                    oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail()))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.remainingTime").value(60))
        .andDo(print());
  }

  @Test
  void getActiveSession_noSession_returns404() throws Exception {
    mockMvc
        .perform(
            get("/api/tests/" + testEntity.getId() + "/sessions/active")
                .with(
                    oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail()))))
        .andExpect(status().isNotFound())
        .andDo(print());
  }

  @Test
  void saveAnswer_upsertsCorrectly() throws Exception {
    // Start session
    mockMvc
        .perform(
            post("/api/tests/" + testEntity.getId() + "/sessions")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail())))
                .with(csrf()))
        .andExpect(status().isCreated());

    TestSessionEntity session =
        testSessionRepository
            .findByUserIdAndTestIdAndIsDoneFalse(studentUser.getId(), testEntity.getId())
            .orElseThrow();

    SaveAnswerRequest req = new SaveAnswerRequest(q1.getId(), List.of(0));

    // Save answer
    mockMvc
        .perform(
            put("/api/sessions/" + session.getId() + "/answers")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail())))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
        .andExpect(status().isOk())
        .andDo(print());

    // Verify it is saved
    TestSessionAnswerEntity answer =
        testSessionAnswerRepository
            .findBySessionIdAndQuestionId(session.getId(), q1.getId())
            .orElseThrow();
    assertThat(answer.getQuestionAnswer()).containsExactly(0);

    // Save again to verify overwrite
    SaveAnswerRequest req2 = new SaveAnswerRequest(q1.getId(), List.of(1));
    mockMvc
        .perform(
            put("/api/sessions/" + session.getId() + "/answers")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail())))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req2)))
        .andExpect(status().isOk());

    answer =
        testSessionAnswerRepository
            .findBySessionIdAndQuestionId(session.getId(), q1.getId())
            .orElseThrow();
    assertThat(answer.getQuestionAnswer()).containsExactly(1);
  }

  @Test
  void saveAnswer_notOwner_returns403() throws Exception {
    mockMvc
        .perform(
            post("/api/tests/" + testEntity.getId() + "/sessions")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail())))
                .with(csrf()))
        .andExpect(status().isCreated());

    TestSessionEntity session =
        testSessionRepository
            .findByUserIdAndTestIdAndIsDoneFalse(studentUser.getId(), testEntity.getId())
            .orElseThrow();

    // studentUser2 tries to save answer for studentUser's session
    SaveAnswerRequest req = new SaveAnswerRequest(q1.getId(), List.of(0));
    mockMvc
        .perform(
            put("/api/sessions/" + session.getId() + "/answers")
                .with(
                    oauth2Login().attributes(attrs -> attrs.put("email", studentUser2.getEmail())))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
        .andExpect(status().isForbidden())
        .andDo(print());
  }

  @Test
  void saveAnswer_outOfBoundsIndex_returns400() throws Exception {
    mockMvc
        .perform(
            post("/api/tests/" + testEntity.getId() + "/sessions")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail())))
                .with(csrf()))
        .andExpect(status().isCreated());

    TestSessionEntity session =
        testSessionRepository
            .findByUserIdAndTestIdAndIsDoneFalse(studentUser.getId(), testEntity.getId())
            .orElseThrow();

    // Choices size is 2 (indexes 0 and 1). index 2 is out of bounds
    SaveAnswerRequest req = new SaveAnswerRequest(q1.getId(), List.of(2));
    mockMvc
        .perform(
            put("/api/sessions/" + session.getId() + "/answers")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail())))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
        .andExpect(status().isBadRequest())
        .andDo(print());
  }

  @Test
  void saveAnswer_singleChoiceMultipleSelections_returns400() throws Exception {
    mockMvc
        .perform(
            post("/api/tests/" + testEntity.getId() + "/sessions")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail())))
                .with(csrf()))
        .andExpect(status().isCreated());

    TestSessionEntity session =
        testSessionRepository
            .findByUserIdAndTestIdAndIsDoneFalse(studentUser.getId(), testEntity.getId())
            .orElseThrow();

    // q1 is single choice, sending multiple selections
    SaveAnswerRequest req = new SaveAnswerRequest(q1.getId(), List.of(0, 1));
    mockMvc
        .perform(
            put("/api/sessions/" + session.getId() + "/answers")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail())))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
        .andExpect(status().isBadRequest())
        .andDo(print());
  }

  @Test
  void submitSession_setsIsDone() throws Exception {
    mockMvc
        .perform(
            post("/api/tests/" + testEntity.getId() + "/sessions")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail())))
                .with(csrf()))
        .andExpect(status().isCreated());

    TestSessionEntity session =
        testSessionRepository
            .findByUserIdAndTestIdAndIsDoneFalse(studentUser.getId(), testEntity.getId())
            .orElseThrow();

    mockMvc
        .perform(
            post("/api/sessions/" + session.getId() + "/submit")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail())))
                .with(csrf()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.sessionId").value(session.getId()))
        .andExpect(jsonPath("$.score").exists())
        .andDo(print());

    TestSessionEntity submittedSession =
        testSessionRepository.findById(session.getId()).orElseThrow();
    assertThat(submittedSession.isDone()).isTrue();
    assertThat(submittedSession.getSubmittedAt()).isNotNull();
  }

  @Test
  void submitSession_alreadyDone_returns409() throws Exception {
    mockMvc
        .perform(
            post("/api/tests/" + testEntity.getId() + "/sessions")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail())))
                .with(csrf()))
        .andExpect(status().isCreated());

    TestSessionEntity session =
        testSessionRepository
            .findByUserIdAndTestIdAndIsDoneFalse(studentUser.getId(), testEntity.getId())
            .orElseThrow();

    // Submit once
    mockMvc
        .perform(
            post("/api/sessions/" + session.getId() + "/submit")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail())))
                .with(csrf()))
        .andExpect(status().isOk());

    // Submit second time
    mockMvc
        .perform(
            post("/api/sessions/" + session.getId() + "/submit")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail())))
                .with(csrf()))
        .andExpect(status().isConflict())
        .andDo(print());
  }

  @Test
  void getResult_dynamicScore_unweighted() throws Exception {
    // Unweighted score should be correct/total * 100
    // Temporarily clear question points to make it unweighted
    tq1.setPoint(null);
    tq2.setPoint(null);
    testQuestionRepository.saveAll(List.of(tq1, tq2));

    mockMvc
        .perform(
            post("/api/tests/" + testEntity.getId() + "/sessions")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail())))
                .with(csrf()))
        .andExpect(status().isCreated());

    TestSessionEntity session =
        testSessionRepository
            .findByUserIdAndTestIdAndIsDoneFalse(studentUser.getId(), testEntity.getId())
            .orElseThrow();

    // Answer q1 correctly (correct: [0])
    SaveAnswerRequest req1 = new SaveAnswerRequest(q1.getId(), List.of(0));
    mockMvc
        .perform(
            put("/api/sessions/" + session.getId() + "/answers")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail())))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req1)))
        .andExpect(status().isOk());

    // Answer q2 incorrectly (correct: [0, 2], student answer: [0])
    SaveAnswerRequest req2 = new SaveAnswerRequest(q2.getId(), List.of(0));
    mockMvc
        .perform(
            put("/api/sessions/" + session.getId() + "/answers")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail())))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req2)))
        .andExpect(status().isOk());

    // Submit
    mockMvc
        .perform(
            post("/api/sessions/" + session.getId() + "/submit")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail())))
                .with(csrf()))
        .andExpect(status().isOk());

    // Get Result
    mockMvc
        .perform(
            get("/api/sessions/" + session.getId() + "/result")
                .with(
                    oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail()))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.score").value(50.0)) // 1/2 correct
        .andExpect(jsonPath("$.correctCount").value(1))
        .andExpect(jsonPath("$.totalQuestions").value(2))
        .andExpect(jsonPath("$.questions[0].isCorrect").value(true))
        .andExpect(jsonPath("$.questions[1].isCorrect").value(false))
        .andDo(print());
  }

  @Test
  void getResult_dynamicScore_weighted() throws Exception {
    // Weighted points: tq1 point = 4.0, tq2 point = 6.0 (total = 10.0)
    mockMvc
        .perform(
            post("/api/tests/" + testEntity.getId() + "/sessions")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail())))
                .with(csrf()))
        .andExpect(status().isCreated());

    TestSessionEntity session =
        testSessionRepository
            .findByUserIdAndTestIdAndIsDoneFalse(studentUser.getId(), testEntity.getId())
            .orElseThrow();

    // Answer q1 correctly (correct: [0]) -> earns 4.0 points
    SaveAnswerRequest req1 = new SaveAnswerRequest(q1.getId(), List.of(0));
    mockMvc
        .perform(
            put("/api/sessions/" + session.getId() + "/answers")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail())))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req1)))
        .andExpect(status().isOk());

    // Answer q2 incorrectly (correct: [0, 2], student answer: [0]) -> earns 0.0 points
    SaveAnswerRequest req2 = new SaveAnswerRequest(q2.getId(), List.of(0));
    mockMvc
        .perform(
            put("/api/sessions/" + session.getId() + "/answers")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail())))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req2)))
        .andExpect(status().isOk());

    // Submit
    mockMvc
        .perform(
            post("/api/sessions/" + session.getId() + "/submit")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail())))
                .with(csrf()))
        .andExpect(status().isOk());

    // Get Result -> Earned: 4.0 / 10.0 * 100 = 40%
    mockMvc
        .perform(
            get("/api/sessions/" + session.getId() + "/result")
                .with(
                    oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail()))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.score").value(40.0))
        .andExpect(jsonPath("$.correctCount").value(1))
        .andExpect(jsonPath("$.totalQuestions").value(2))
        .andDo(print());
  }

  @Test
  void getResult_afterQuestionDeleted() throws Exception {
    mockMvc
        .perform(
            post("/api/tests/" + testEntity.getId() + "/sessions")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail())))
                .with(csrf()))
        .andExpect(status().isCreated());

    TestSessionEntity session =
        testSessionRepository
            .findByUserIdAndTestIdAndIsDoneFalse(studentUser.getId(), testEntity.getId())
            .orElseThrow();

    // Answer both correctly
    SaveAnswerRequest req1 = new SaveAnswerRequest(q1.getId(), List.of(0));
    mockMvc
        .perform(
            put("/api/sessions/" + session.getId() + "/answers")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail())))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req1)))
        .andExpect(status().isOk());

    SaveAnswerRequest req2 = new SaveAnswerRequest(q2.getId(), List.of(0, 2));
    mockMvc
        .perform(
            put("/api/sessions/" + session.getId() + "/answers")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail())))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req2)))
        .andExpect(status().isOk());

    // Submit
    mockMvc
        .perform(
            post("/api/sessions/" + session.getId() + "/submit")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail())))
                .with(csrf()))
        .andExpect(status().isOk());

    // Delete q2 using primary key ID to avoid transaction requirements of custom query
    testQuestionRepository.deleteById(new TestQuestionId(testEntity.getId(), q2.getId()));

    // Get Result -> Should now only recalculate based on q1 (1/1 correct -> 100%)
    mockMvc
        .perform(
            get("/api/sessions/" + session.getId() + "/result")
                .with(
                    oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail()))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.score").value(100.0))
        .andExpect(jsonPath("$.correctCount").value(1))
        .andExpect(jsonPath("$.totalQuestions").value(1))
        .andDo(print());
  }

  @Test
  void getResult_instructorCanViewStudentResult() throws Exception {
    mockMvc
        .perform(
            post("/api/tests/" + testEntity.getId() + "/sessions")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail())))
                .with(csrf()))
        .andExpect(status().isCreated());

    TestSessionEntity session =
        testSessionRepository
            .findByUserIdAndTestIdAndIsDoneFalse(studentUser.getId(), testEntity.getId())
            .orElseThrow();
    session.setDone(true);
    session.setSubmittedAt(ZonedDateTime.now());
    testSessionRepository.save(session);

    // Instructor A (course author) gets the student's result -> should succeed
    mockMvc
        .perform(
            get("/api/sessions/" + session.getId() + "/result")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", teacherA.getEmail()))))
        .andExpect(status().isOk())
        .andDo(print());

    // studentUser2 gets studentUser's result -> forbidden
    mockMvc
        .perform(
            get("/api/sessions/" + session.getId() + "/result")
                .with(
                    oauth2Login().attributes(attrs -> attrs.put("email", studentUser2.getEmail()))))
        .andExpect(status().isForbidden());
  }

  @Test
  void listTestSessions_instructorOnly() throws Exception {
    mockMvc
        .perform(
            post("/api/tests/" + testEntity.getId() + "/sessions")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail())))
                .with(csrf()))
        .andExpect(status().isCreated());

    // Instructor A gets list -> 200
    mockMvc
        .perform(
            get("/api/tests/" + testEntity.getId() + "/sessions")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", teacherA.getEmail()))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(1))
        .andExpect(jsonPath("$[0].displayName").value("Student"))
        .andDo(print());

    // studentUser gets list -> 403
    mockMvc
        .perform(
            get("/api/tests/" + testEntity.getId() + "/sessions")
                .with(
                    oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail()))))
        .andExpect(status().isForbidden());
  }

  @Test
  void lazyAutoSubmit_expiredSession() throws Exception {
    // Start session
    mockMvc
        .perform(
            post("/api/tests/" + testEntity.getId() + "/sessions")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail())))
                .with(csrf()))
        .andExpect(status().isCreated());

    TestSessionEntity session =
        testSessionRepository
            .findByUserIdAndTestIdAndIsDoneFalse(studentUser.getId(), testEntity.getId())
            .orElseThrow();

    // Manually backdate startedAt to 10 minutes ago
    session.setStartedAt(ZonedDateTime.now().minusMinutes(10));
    testSessionRepository.saveAndFlush(session);

    // Call active endpoint -> should lazy auto-submit, return 404 because no active session exists
    // anymore
    mockMvc
        .perform(
            get("/api/tests/" + testEntity.getId() + "/sessions/active")
                .with(
                    oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail()))))
        .andExpect(status().isNotFound())
        .andDo(print());

    // Verify session is now completed
    TestSessionEntity updatedSession =
        testSessionRepository.findById(session.getId()).orElseThrow();
    assertThat(updatedSession.isDone()).isTrue();
    assertThat(updatedSession.getSubmittedAt()).isNotNull();
  }

  @Test
  void unenrolledStudent_canStillSubmitActiveSession() throws Exception {
    mockMvc
        .perform(
            post("/api/tests/" + testEntity.getId() + "/sessions")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail())))
                .with(csrf()))
        .andExpect(status().isCreated());

    TestSessionEntity session =
        testSessionRepository
            .findByUserIdAndTestIdAndIsDoneFalse(studentUser.getId(), testEntity.getId())
            .orElseThrow();

    // Unenroll student
    enrollmentRepository.deleteAll();

    // Answer & Submit should still work
    SaveAnswerRequest req = new SaveAnswerRequest(q1.getId(), List.of(0));
    mockMvc
        .perform(
            put("/api/sessions/" + session.getId() + "/answers")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail())))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
        .andExpect(status().isOk());

    mockMvc
        .perform(
            post("/api/sessions/" + session.getId() + "/submit")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail())))
                .with(csrf()))
        .andExpect(status().isOk())
        .andDo(print());
  }

  @Test
  void unenrolledStudent_cannotStartNewSession() throws Exception {
    // Unenroll student
    enrollmentRepository.deleteAll();

    // Cannot start session
    mockMvc
        .perform(
            post("/api/tests/" + testEntity.getId() + "/sessions")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail())))
                .with(csrf()))
        .andExpect(status().isForbidden())
        .andDo(print());
  }

  @Test
  void concurrentSessionPrevention_partialUniqueIndex() {
    // Create an active session manually
    TestSessionEntity activeSession1 =
        new TestSessionEntity(studentUser, testEntity, ZonedDateTime.now());
    testSessionRepository.save(activeSession1);

    // Save a second active session for the same user and test -> should trigger unique constraint
    // violation
    TestSessionEntity activeSession2 =
        new TestSessionEntity(studentUser, testEntity, ZonedDateTime.now());
    assertThatThrownBy(() -> testSessionRepository.saveAndFlush(activeSession2))
        .isInstanceOf(DataIntegrityViolationException.class);
  }

  @Test
  void saveAnswer_emptyChoices_allowed() throws Exception {
    // Empty selectedChoices = "clear answer" UX — intentionally allowed.
    // Single-choice validation is skipped for empty lists so a student can de-select.
    mockMvc
        .perform(
            post("/api/tests/" + testEntity.getId() + "/sessions")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail())))
                .with(csrf()))
        .andExpect(status().isCreated());

    TestSessionEntity session =
        testSessionRepository
            .findByUserIdAndTestIdAndIsDoneFalse(studentUser.getId(), testEntity.getId())
            .orElseThrow();

    // Save non-empty answer first
    SaveAnswerRequest req1 = new SaveAnswerRequest(q1.getId(), List.of(0));
    mockMvc
        .perform(
            put("/api/sessions/" + session.getId() + "/answers")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail())))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req1)))
        .andExpect(status().isOk());

    // Save empty answer to clear it
    SaveAnswerRequest req2 = new SaveAnswerRequest(q1.getId(), List.of());
    mockMvc
        .perform(
            put("/api/sessions/" + session.getId() + "/answers")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail())))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req2)))
        .andExpect(status().isOk());

    TestSessionAnswerEntity answer =
        testSessionAnswerRepository
            .findBySessionIdAndQuestionId(session.getId(), q1.getId())
            .orElseThrow();
    assertThat(answer.getQuestionAnswer()).isEmpty();
  }

  @Test
  void startSession_expiredSessionExist_returns409() throws Exception {
    mockMvc
        .perform(
            post("/api/tests/" + testEntity.getId() + "/sessions")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail())))
                .with(csrf()))
        .andExpect(status().isCreated());

    TestSessionEntity session =
        testSessionRepository
            .findByUserIdAndTestIdAndIsDoneFalse(studentUser.getId(), testEntity.getId())
            .orElseThrow();

    // Manually backdate startedAt to 10 minutes ago to expire it
    session.setStartedAt(ZonedDateTime.now().minusMinutes(10));
    testSessionRepository.saveAndFlush(session);

    // Call startSession again -> should lazy auto-submit and return 409 Conflict
    mockMvc
        .perform(
            post("/api/tests/" + testEntity.getId() + "/sessions")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail())))
                .with(csrf()))
        .andExpect(status().isConflict())
        .andDo(print());
  }

  @Test
  void getMyTestSessions_returnsCompletedSessions() throws Exception {
    // 1. Initially empty
    mockMvc
        .perform(
            get("/api/tests/sessions/my")
                .with(
                    oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail()))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(0));

    // 2. Start a session
    mockMvc
        .perform(
            post("/api/tests/" + testEntity.getId() + "/sessions")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail())))
                .with(csrf()))
        .andExpect(status().isCreated());

    // 3. Answer questions (q1 correct, q2 incorrect)
    SaveAnswerRequest req1 = new SaveAnswerRequest(q1.getId(), List.of(0));
    mockMvc
        .perform(
            put("/api/sessions/"
                    + testSessionRepository
                        .findByUserIdAndTestIdAndIsDoneFalse(
                            studentUser.getId(), testEntity.getId())
                        .orElseThrow()
                        .getId()
                    + "/answers")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail())))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req1)))
        .andExpect(status().isOk());

    // Submit session
    TestSessionEntity session =
        testSessionRepository
            .findByUserIdAndTestIdAndIsDoneFalse(studentUser.getId(), testEntity.getId())
            .orElseThrow();
    mockMvc
        .perform(
            post("/api/sessions/" + session.getId() + "/submit")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail())))
                .with(csrf()))
        .andExpect(status().isOk());

    // 4. Query my test sessions -> should return 1 session
    mockMvc
        .perform(
            get("/api/tests/sessions/my")
                .with(
                    oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail()))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(1))
        .andExpect(jsonPath("$[0].testTitle").value("Lesson Test 1"))
        .andExpect(jsonPath("$[0].courseTitle").value("Java Core"))
        .andExpect(jsonPath("$[0].score").value(40.0)) // 4.0 / 10.0 * 100 = 40%
        .andExpect(jsonPath("$[0].correctCount").value(1))
        .andExpect(jsonPath("$[0].totalQuestions").value(2))
        .andDo(print());
  }
}
