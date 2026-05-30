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
public class AccessRequestIntegrationTest extends BaseIntegrationTest {

  private final MockMvc mockMvc;
  private final UserRepository userRepository;
  private final UserRoleRepository userRoleRepository;
  private final RoleRepository roleRepository;
  private final CourseRepository courseRepository;
  private final EnrollmentRepository enrollmentRepository;
  private final CourseAccessRequestRepository courseAccessRequestRepository;

  private User teacherA;
  private User teacherB;
  private User studentUser;

  @Autowired
  public AccessRequestIntegrationTest(
      @SuppressWarnings("SpringJavaInjectionPointsAutowiringInspection") MockMvc mockMvc,
      UserRepository userRepository,
      UserRoleRepository userRoleRepository,
      RoleRepository roleRepository,
      CourseRepository courseRepository,
      EnrollmentRepository enrollmentRepository,
      CourseAccessRequestRepository courseAccessRequestRepository) {
    this.mockMvc = mockMvc;
    this.userRepository = userRepository;
    this.userRoleRepository = userRoleRepository;
    this.roleRepository = roleRepository;
    this.courseRepository = courseRepository;
    this.enrollmentRepository = enrollmentRepository;
    this.courseAccessRequestRepository = courseAccessRequestRepository;
  }

  @BeforeEach
  void setUp() {
    courseAccessRequestRepository.deleteAll();
    enrollmentRepository.deleteAll();
    courseRepository.deleteAll();
    userRoleRepository.deleteAll();
    userRepository.deleteAll();

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
    courseAccessRequestRepository.deleteAll();
    enrollmentRepository.deleteAll();
    courseRepository.deleteAll();
    userRoleRepository.deleteAll();
    userRepository.deleteAll();
  }

  @Test
  void shouldAllowStudentToRequestAccessToRestrictedCourse() throws Exception {
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
            post("/api/courses/" + restrictedCourse.getId() + "/access-requests")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail())))
                .with(csrf()))
        .andExpect(status().isCreated())
        .andDo(print());

    assertThat(
            courseAccessRequestRepository.existsByUserIdAndCourseId(
                studentUser.getId(), restrictedCourse.getId()))
        .isTrue();
  }

  @Test
  void shouldRejectAccessRequestForUnpublishedRestrictedCourse() throws Exception {
    Course unpublishedRestricted =
        courseRepository.save(
            new Course(
                "Unpublished Restricted Course",
                "Desc",
                null,
                false,
                CourseVisibility.RESTRICTED,
                teacherA,
                null));

    mockMvc
        .perform(
            post("/api/courses/" + unpublishedRestricted.getId() + "/access-requests")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail())))
                .with(csrf()))
        .andExpect(status().isNotFound())
        .andDo(print());
  }

  @Test
  void shouldAllowTeacherToApproveAccessRequest() throws Exception {
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

    courseAccessRequestRepository.save(
        new CourseAccessRequestEntity(studentUser, restrictedCourse));

    mockMvc
        .perform(
            post("/api/courses/"
                    + restrictedCourse.getId()
                    + "/access-requests/"
                    + studentUser.getId()
                    + "/approve")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", teacherA.getEmail())))
                .with(csrf()))
        .andExpect(status().isCreated())
        .andDo(print());

    assertThat(
            enrollmentRepository.existsById(
                new EnrollmentId(studentUser.getId(), restrictedCourse.getId())))
        .isTrue();
    assertThat(
            courseAccessRequestRepository.existsByUserIdAndCourseId(
                studentUser.getId(), restrictedCourse.getId()))
        .isFalse();
  }

  @Test
  void shouldAllowTeacherToRejectAccessRequest() throws Exception {
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

    courseAccessRequestRepository.save(
        new CourseAccessRequestEntity(studentUser, restrictedCourse));

    mockMvc
        .perform(
            delete(
                    "/api/courses/"
                        + restrictedCourse.getId()
                        + "/access-requests/"
                        + studentUser.getId())
                .with(oauth2Login().attributes(attrs -> attrs.put("email", teacherA.getEmail())))
                .with(csrf()))
        .andExpect(status().isNoContent())
        .andDo(print());

    assertThat(
            enrollmentRepository.existsById(
                new EnrollmentId(studentUser.getId(), restrictedCourse.getId())))
        .isFalse();
    assertThat(
            courseAccessRequestRepository.existsByUserIdAndCourseId(
                studentUser.getId(), restrictedCourse.getId()))
        .isFalse();
  }

  @Test
  void shouldRejectNonAuthorTeacherFromViewingAccessRequests() throws Exception {
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
            get("/api/courses/" + restrictedCourse.getId() + "/access-requests")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", teacherB.getEmail())))
                .with(csrf()))
        .andExpect(status().isForbidden())
        .andDo(print());
  }

  @Test
  void shouldRejectNonAuthorTeacherFromApprovingAccessRequest() throws Exception {
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

    courseAccessRequestRepository.save(
        new CourseAccessRequestEntity(studentUser, restrictedCourse));

    mockMvc
        .perform(
            post("/api/courses/"
                    + restrictedCourse.getId()
                    + "/access-requests/"
                    + studentUser.getId()
                    + "/approve")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", teacherB.getEmail())))
                .with(csrf()))
        .andExpect(status().isForbidden())
        .andDo(print());
  }

  @Test
  void shouldRejectNonAuthorTeacherFromRejectingAccessRequest() throws Exception {
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

    courseAccessRequestRepository.save(
        new CourseAccessRequestEntity(studentUser, restrictedCourse));

    mockMvc
        .perform(
            delete(
                    "/api/courses/"
                        + restrictedCourse.getId()
                        + "/access-requests/"
                        + studentUser.getId())
                .with(oauth2Login().attributes(attrs -> attrs.put("email", teacherB.getEmail())))
                .with(csrf()))
        .andExpect(status().isForbidden())
        .andDo(print());
  }
}
