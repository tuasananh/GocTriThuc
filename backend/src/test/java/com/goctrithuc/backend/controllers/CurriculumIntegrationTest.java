package com.goctrithuc.backend.controllers;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oauth2Login;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.goctrithuc.backend.BaseIntegrationTest;
import com.goctrithuc.backend.entities.*;
import com.goctrithuc.backend.repositories.*;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

@AutoConfigureMockMvc
public class CurriculumIntegrationTest extends BaseIntegrationTest {

  private final MockMvc mockMvc;
  private final UserRepository userRepository;
  private final UserRoleRepository userRoleRepository;
  private final RoleRepository roleRepository;
  private final CourseRepository courseRepository;
  private final ModuleRepository moduleRepository;
  private final LessonRepository lessonRepository;
  private final EnrollmentRepository enrollmentRepository;

  private User adminUser;
  private User teacherA;
  private User studentUser;

  @Autowired
  public CurriculumIntegrationTest(
      @SuppressWarnings("SpringJavaInjectionPointsAutowiringInspection") MockMvc mockMvc,
      UserRepository userRepository,
      UserRoleRepository userRoleRepository,
      RoleRepository roleRepository,
      CourseRepository courseRepository,
      ModuleRepository moduleRepository,
      LessonRepository lessonRepository,
      EnrollmentRepository enrollmentRepository) {
    this.mockMvc = mockMvc;
    this.userRepository = userRepository;
    this.userRoleRepository = userRoleRepository;
    this.roleRepository = roleRepository;
    this.courseRepository = courseRepository;
    this.moduleRepository = moduleRepository;
    this.lessonRepository = lessonRepository;
    this.enrollmentRepository = enrollmentRepository;
  }

  @BeforeEach
  void setUp() {
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
    lessonRepository.deleteAll();
    moduleRepository.deleteAll();
    enrollmentRepository.deleteAll();
    courseRepository.deleteAll();
    userRoleRepository.deleteAll();
    userRepository.deleteAll();
  }

  @Test
  void shouldAllowEnrolledStudentToGetModules() throws Exception {
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
            get("/api/courses/" + publicCourse.getId() + "/modules")
                .with(
                    oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail()))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(1))
        .andExpect(jsonPath("$[0].title").value("Module 1"))
        .andExpect(jsonPath("$[0].lessons.length()").value(1))
        .andExpect(jsonPath("$[0].lessons[0].title").value("Lesson 1"))
        .andDo(print());
  }

  @Test
  void shouldAllowCourseAuthorToGetModules() throws Exception {
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
            get("/api/courses/" + publicCourse.getId() + "/modules")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", teacherA.getEmail()))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(1))
        .andDo(print());
  }

  @Test
  void shouldAllowAdminToGetModules() throws Exception {
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
            get("/api/courses/" + publicCourse.getId() + "/modules")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", adminUser.getEmail()))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(1))
        .andDo(print());
  }

  @Test
  void shouldRejectUnenrolledStudentFromGettingModules() throws Exception {
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
            get("/api/courses/" + publicCourse.getId() + "/modules")
                .with(
                    oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail()))))
        .andExpect(status().isForbidden())
        .andDo(print());
  }
}
