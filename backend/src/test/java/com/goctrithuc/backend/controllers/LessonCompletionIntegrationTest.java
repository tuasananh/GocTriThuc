package com.goctrithuc.backend.controllers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oauth2Login;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.goctrithuc.backend.BaseIntegrationTest;
import com.goctrithuc.backend.entities.*;
import com.goctrithuc.backend.repositories.*;
import com.goctrithuc.backend.services.LessonCompletionService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

@AutoConfigureMockMvc
public class LessonCompletionIntegrationTest extends BaseIntegrationTest {

  private final MockMvc mockMvc;
  private final UserRepository userRepository;
  private final UserRoleRepository userRoleRepository;
  private final RoleRepository roleRepository;
  private final CourseRepository courseRepository;
  private final ModuleRepository moduleRepository;
  private final LessonRepository lessonRepository;
  private final EnrollmentRepository enrollmentRepository;
  private final LessonCompletionRepository lessonCompletionRepository;
  private final LessonCompletionService lessonCompletionService;

  private User adminUser;
  private User teacherA;
  private User studentUser;

  @Autowired
  public LessonCompletionIntegrationTest(
      @SuppressWarnings("SpringJavaInjectionPointsAutowiringInspection") MockMvc mockMvc,
      UserRepository userRepository,
      UserRoleRepository userRoleRepository,
      RoleRepository roleRepository,
      CourseRepository courseRepository,
      ModuleRepository moduleRepository,
      LessonRepository lessonRepository,
      EnrollmentRepository enrollmentRepository,
      LessonCompletionRepository lessonCompletionRepository,
      LessonCompletionService lessonCompletionService) {
    this.mockMvc = mockMvc;
    this.userRepository = userRepository;
    this.userRoleRepository = userRoleRepository;
    this.roleRepository = roleRepository;
    this.courseRepository = courseRepository;
    this.moduleRepository = moduleRepository;
    this.lessonRepository = lessonRepository;
    this.enrollmentRepository = enrollmentRepository;
    this.lessonCompletionRepository = lessonCompletionRepository;
    this.lessonCompletionService = lessonCompletionService;
  }

  @BeforeEach
  void setUp() {
    lessonCompletionRepository.deleteAll();
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

    studentUser = userRepository.save(new User("student@hust.edu.vn", "Student", "student", null));
    userRoleRepository.save(
        new UserRole(studentUser, roleRepository.findByName("student").orElseThrow()));
  }

  @AfterEach
  void cleanUp() {
    lessonCompletionRepository.deleteAll();
    lessonRepository.deleteAll();
    moduleRepository.deleteAll();
    enrollmentRepository.deleteAll();
    courseRepository.deleteAll();
    userRoleRepository.deleteAll();
    userRepository.deleteAll();
  }

  @Test
  void shouldAllowEnrolledStudentToToggleLessonCompletion() throws Exception {
    Course publicCourse =
        courseRepository.save(
            new Course(
                "Public Active Course",
                "Desc",
                null,
                true,
                CourseVisibility.PUBLIC,
                teacherA,
                null));

    ModuleEntity module = moduleRepository.save(new ModuleEntity(publicCourse, "Module 1", 0));
    LessonEntity lesson =
        lessonRepository.save(new LessonEntity(module, "Lesson 1", LessonType.VIDEO, 0));

    enrollmentRepository.save(new EnrollmentEntity(studentUser, publicCourse));

    // Toggle complete (turns ON)
    mockMvc
        .perform(
            post("/api/lessons/" + lesson.getId() + "/complete")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail())))
                .with(csrf()))
        .andExpect(status().isNoContent())
        .andDo(print());

    assertThat(
            lessonCompletionRepository.existsById(
                new LessonCompletionId(studentUser.getId(), lesson.getId())))
        .isTrue();

    // Toggle complete (turns OFF)
    mockMvc
        .perform(
            post("/api/lessons/" + lesson.getId() + "/complete")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail())))
                .with(csrf()))
        .andExpect(status().isNoContent())
        .andDo(print());

    assertThat(
            lessonCompletionRepository.existsById(
                new LessonCompletionId(studentUser.getId(), lesson.getId())))
        .isFalse();
  }

  @Test
  void shouldRejectUnenrolledStudentFromTogglingLessonCompletion() throws Exception {
    Course publicCourse =
        courseRepository.save(
            new Course(
                "Public Active Course",
                "Desc",
                null,
                true,
                CourseVisibility.PUBLIC,
                teacherA,
                null));

    ModuleEntity module = moduleRepository.save(new ModuleEntity(publicCourse, "Module 1", 0));
    LessonEntity lesson =
        lessonRepository.save(new LessonEntity(module, "Lesson 1", LessonType.VIDEO, 0));

    mockMvc
        .perform(
            post("/api/lessons/" + lesson.getId() + "/complete")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail())))
                .with(csrf()))
        .andExpect(status().isForbidden())
        .andDo(print());
  }

  @Test
  void shouldAllowEnrolledStudentToGetProgress() throws Exception {
    Course publicCourse =
        courseRepository.save(
            new Course(
                "Public Active Course",
                "Desc",
                null,
                true,
                CourseVisibility.PUBLIC,
                teacherA,
                null));

    ModuleEntity module = moduleRepository.save(new ModuleEntity(publicCourse, "Module 1", 0));
    lessonRepository.save(new LessonEntity(module, "Lesson 1", LessonType.VIDEO, 0));

    enrollmentRepository.save(new EnrollmentEntity(studentUser, publicCourse));

    mockMvc
        .perform(
            get("/api/courses/" + publicCourse.getId() + "/progress")
                .with(
                    oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail()))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.completedLessons").value(0))
        .andExpect(jsonPath("$.totalLessons").value(1))
        .andExpect(jsonPath("$.percent").value(0))
        .andDo(print());
  }

  @Test
  void shouldAllowCourseAuthorToGetProgressEvenIfNotEnrolled() throws Exception {
    Course publicCourse =
        courseRepository.save(
            new Course(
                "Public Active Course",
                "Desc",
                null,
                true,
                CourseVisibility.PUBLIC,
                teacherA,
                null));

    ModuleEntity module = moduleRepository.save(new ModuleEntity(publicCourse, "Module 1", 0));
    lessonRepository.save(new LessonEntity(module, "Lesson 1", LessonType.VIDEO, 0));

    mockMvc
        .perform(
            get("/api/courses/" + publicCourse.getId() + "/progress")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", teacherA.getEmail()))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.completedLessons").value(0))
        .andExpect(jsonPath("$.totalLessons").value(1))
        .andExpect(jsonPath("$.percent").value(0))
        .andDo(print());
  }

  @Test
  void shouldAllowAdminToGetProgressEvenIfNotEnrolled() throws Exception {
    Course publicCourse =
        courseRepository.save(
            new Course(
                "Public Active Course",
                "Desc",
                null,
                true,
                CourseVisibility.PUBLIC,
                teacherA,
                null));

    ModuleEntity module = moduleRepository.save(new ModuleEntity(publicCourse, "Module 1", 0));
    lessonRepository.save(new LessonEntity(module, "Lesson 1", LessonType.VIDEO, 0));

    mockMvc
        .perform(
            get("/api/courses/" + publicCourse.getId() + "/progress")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", adminUser.getEmail()))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.completedLessons").value(0))
        .andExpect(jsonPath("$.totalLessons").value(1))
        .andExpect(jsonPath("$.percent").value(0))
        .andDo(print());
  }

  @Test
  void shouldRejectUnenrolledStudentFromGettingProgress() throws Exception {
    Course publicCourse =
        courseRepository.save(
            new Course(
                "Public Active Course",
                "Desc",
                null,
                true,
                CourseVisibility.PUBLIC,
                teacherA,
                null));

    mockMvc
        .perform(
            get("/api/courses/" + publicCourse.getId() + "/progress")
                .with(
                    oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail()))))
        .andExpect(status().isForbidden())
        .andDo(print());
  }

  @Test
  void shouldIdempotentlyMarkLessonAsCompleted() {
    Course publicCourse =
        courseRepository.save(
            new Course(
                "Public Active Course",
                "Desc",
                null,
                true,
                CourseVisibility.PUBLIC,
                teacherA,
                null));

    ModuleEntity module = moduleRepository.save(new ModuleEntity(publicCourse, "Module 1", 0));
    LessonEntity lesson =
        lessonRepository.save(new LessonEntity(module, "Lesson 1", LessonType.VIDEO, 0));

    // Call markComplete
    lessonCompletionService.markComplete(studentUser.getId(), lesson.getId());

    assertThat(
            lessonCompletionRepository.existsById(
                new LessonCompletionId(studentUser.getId(), lesson.getId())))
        .isTrue();

    // Call markComplete again (should be idempotent no-op)
    lessonCompletionService.markComplete(studentUser.getId(), lesson.getId());

    assertThat(
            lessonCompletionRepository.existsById(
                new LessonCompletionId(studentUser.getId(), lesson.getId())))
        .isTrue();
  }
}
