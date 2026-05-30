package com.goctrithuc.backend.controllers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oauth2Login;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
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
public class EnrollmentIntegrationTest extends BaseIntegrationTest {

  private final MockMvc mockMvc;
  private final UserRepository userRepository;
  private final UserRoleRepository userRoleRepository;
  private final RoleRepository roleRepository;
  private final CourseRepository courseRepository;
  private final EnrollmentRepository enrollmentRepository;

  private User teacherA;
  private User studentUser;

  @Autowired
  public EnrollmentIntegrationTest(
      @SuppressWarnings("SpringJavaInjectionPointsAutowiringInspection") MockMvc mockMvc,
      UserRepository userRepository,
      UserRoleRepository userRoleRepository,
      RoleRepository roleRepository,
      CourseRepository courseRepository,
      EnrollmentRepository enrollmentRepository) {
    this.mockMvc = mockMvc;
    this.userRepository = userRepository;
    this.userRoleRepository = userRoleRepository;
    this.roleRepository = roleRepository;
    this.courseRepository = courseRepository;
    this.enrollmentRepository = enrollmentRepository;
  }

  @BeforeEach
  void setUp() {
    enrollmentRepository.deleteAll();
    courseRepository.deleteAll();
    userRoleRepository.deleteAll();
    userRepository.deleteAll();

    teacherA = userRepository.save(new User("teachera@hust.edu.vn", "Teacher A", "teachera", null));
    userRoleRepository.save(
        new UserRole(teacherA, roleRepository.findByName("teacher").orElseThrow()));

    studentUser = userRepository.save(new User("student@hust.edu.vn", "Student", "student", null));
    userRoleRepository.save(
        new UserRole(studentUser, roleRepository.findByName("student").orElseThrow()));
  }

  @AfterEach
  void cleanUp() {
    enrollmentRepository.deleteAll();
    courseRepository.deleteAll();
    userRoleRepository.deleteAll();
    userRepository.deleteAll();
  }

  @Test
  void shouldAllowStudentToEnrollInPublicCourse() throws Exception {
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
            post("/api/courses/" + publicCourse.getId() + "/enroll")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail())))
                .with(csrf()))
        .andExpect(status().isCreated())
        .andDo(print());

    assertThat(
            enrollmentRepository.existsById(
                new EnrollmentId(studentUser.getId(), publicCourse.getId())))
        .isTrue();
  }

  @Test
  void shouldRejectStudentFromEnrollingInUnpublishedCourse() throws Exception {
    Course unpublishedCourse =
        courseRepository.save(
            new Course(
                "Unpublished Course",
                "Desc",
                null,
                false,
                CourseVisibility.PUBLIC,
                teacherA,
                null));

    mockMvc
        .perform(
            post("/api/courses/" + unpublishedCourse.getId() + "/enroll")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail())))
                .with(csrf()))
        .andExpect(status().isNotFound())
        .andDo(print());
  }

  @Test
  void shouldRejectStudentFromEnrollingInPrivateCourseDirectly() throws Exception {
    Course privateCourse =
        courseRepository.save(
            new Course(
                "Private Active Course",
                "Desc",
                null,
                true,
                CourseVisibility.PRIVATE,
                teacherA,
                null));

    mockMvc
        .perform(
            post("/api/courses/" + privateCourse.getId() + "/enroll")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail())))
                .with(csrf()))
        .andExpect(status().isNotFound())
        .andDo(print());
  }

  @Test
  void shouldRejectStudentFromEnrollingInRestrictedCourseDirectly() throws Exception {
    Course restrictedCourse =
        courseRepository.save(
            new Course(
                "Restricted Course",
                "Desc",
                null,
                true,
                CourseVisibility.RESTRICTED,
                teacherA,
                null));

    mockMvc
        .perform(
            post("/api/courses/" + restrictedCourse.getId() + "/enroll")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail())))
                .with(csrf()))
        .andExpect(status().isBadRequest())
        .andDo(print());
  }

  @Test
  void shouldAllowStudentToUnenroll() throws Exception {
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

    enrollmentRepository.save(new EnrollmentEntity(studentUser, publicCourse));

    mockMvc
        .perform(
            delete("/api/courses/" + publicCourse.getId() + "/enroll")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail())))
                .with(csrf()))
        .andExpect(status().isNoContent())
        .andDo(print());

    assertThat(
            enrollmentRepository.existsById(
                new EnrollmentId(studentUser.getId(), publicCourse.getId())))
        .isFalse();
  }
}
