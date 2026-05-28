package com.goctrithuc.backend.controllers;

import static org.hamcrest.Matchers.isA;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oauth2Login;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.goctrithuc.backend.BaseIntegrationTest;
import com.goctrithuc.backend.dtos.CreateCourseRequest;
import com.goctrithuc.backend.dtos.UpdateCourseRequest;
import com.goctrithuc.backend.entities.Course;
import com.goctrithuc.backend.entities.CourseVisibility;
import com.goctrithuc.backend.entities.User;
import com.goctrithuc.backend.entities.UserRole;
import com.goctrithuc.backend.repositories.CourseRepository;
import com.goctrithuc.backend.repositories.RoleRepository;
import com.goctrithuc.backend.repositories.UserRepository;
import com.goctrithuc.backend.repositories.UserRoleRepository;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@AutoConfigureMockMvc
public class CourseControllerIntegrationTest extends BaseIntegrationTest {

  private final MockMvc mockMvc;
  private final UserRepository userRepository;
  private final UserRoleRepository userRoleRepository;
  private final RoleRepository roleRepository;
  private final CourseRepository courseRepository;
  private final ObjectMapper objectMapper = new ObjectMapper();

  private User adminUser;
  private User teacherA;
  private User teacherB;
  private User studentUser;

  @Autowired
  public CourseControllerIntegrationTest(
      MockMvc mockMvc,
      UserRepository userRepository,
      UserRoleRepository userRoleRepository,
      RoleRepository roleRepository,
      CourseRepository courseRepository) {
    this.mockMvc = mockMvc;
    this.userRepository = userRepository;
    this.userRoleRepository = userRoleRepository;
    this.roleRepository = roleRepository;
    this.courseRepository = courseRepository;
  }

  @BeforeEach
  void setUp() {
    // Clean up first to prevent conflicts
    courseRepository.deleteAll();
    userRoleRepository.deleteAll();
    userRepository.deleteAll();

    // Setup typical users
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
    courseRepository.deleteAll();
    userRoleRepository.deleteAll();
    userRepository.deleteAll();
  }

  @Test
  void shouldAllowGuestToAccessPublicAndRestrictedCoursesInListing() throws Exception {
    // Create courses
    courseRepository.save(
        new Course("Public Course", "Desc", null, true, CourseVisibility.Public, teacherA, null));
    courseRepository.save(
        new Course(
            "Restricted Course", "Desc", null, true, CourseVisibility.Restricted, teacherA, null));
    courseRepository.save(
        new Course(
            "Private Course", "Desc", null, false, CourseVisibility.Private, teacherA, null));

    mockMvc
        .perform(get("/api/courses?sort=title,asc"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content.length()").value(2))
        .andExpect(jsonPath("$.content[0].title").value("Public Course"))
        .andExpect(jsonPath("$.content[0].status").value("live"))
        .andExpect(jsonPath("$.content[1].title").value("Restricted Course"))
        .andExpect(jsonPath("$.content[1].status").value("live"))
        .andDo(print());
  }

  @Test
  void shouldAllowGuestToViewPublicCourseDetail() throws Exception {
    Course publicCourse =
        courseRepository.save(
            new Course(
                "Public Course Detailed",
                "Desc",
                null,
                true,
                CourseVisibility.Public,
                teacherA,
                null));

    // Notice: Jackson globally serializes Long into String for Snowflake IDs.
    // So JSON response has "id" as String. We assert $.id is string matching the ID string.
    mockMvc
        .perform(get("/api/courses/" + publicCourse.getId()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(isA(String.class)))
        .andExpect(jsonPath("$.id").value(publicCourse.getId().toString()))
        .andExpect(jsonPath("$.author.id").value(isA(String.class)))
        .andExpect(jsonPath("$.author.id").value(teacherA.getId().toString()))
        .andExpect(jsonPath("$.title").value("Public Course Detailed"))
        .andExpect(jsonPath("$.visibility").value("Public"))
        .andExpect(jsonPath("$.status").value("live"))
        .andDo(print());
  }

  @Test
  void shouldAllowTeacherToCreateCourseWithEmptyRequestPayload() throws Exception {
    // POST with empty payload or missing body
    mockMvc
        .perform(
            post("/api/courses")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", teacherA.getEmail())))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.title").value("Khóa học mới"))
        .andExpect(jsonPath("$.visibility").value("Private"))
        .andExpect(jsonPath("$.status").value("draft"))
        .andExpect(jsonPath("$.author.displayName").value("Teacher A"))
        .andDo(print());
  }

  @Test
  void shouldAllowTeacherToCreateCourseWithFullPayload() throws Exception {
    Map<String, Object> settings = new HashMap<>();
    settings.put("allowSelfEnroll", true);
    CreateCourseRequest req =
        new CreateCourseRequest(
            "Design Patterns 101",
            "Introduction to design patterns",
            "http://thumbnail.com/pic.png",
            CourseVisibility.Public,
            settings);

    mockMvc
        .perform(
            post("/api/courses")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", teacherA.getEmail())))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.title").value("Design Patterns 101"))
        .andExpect(jsonPath("$.visibility").value("Public"))
        .andExpect(
            jsonPath("$.status").value("coming_soon")) // because isPublished defaults to false
        .andExpect(jsonPath("$.settings.allowSelfEnroll").value(true))
        .andDo(print());
  }

  @Test
  void shouldAllowAuthorToUpdateCourseViaPut() throws Exception {
    Course c =
        courseRepository.save(
            new Course("Old Title", "Desc", null, false, CourseVisibility.Private, teacherA, null));

    UpdateCourseRequest req =
        new UpdateCourseRequest(
            "New Title Via PUT",
            "New Desc",
            "http://newthumb.png",
            CourseVisibility.Public,
            true,
            null);

    mockMvc
        .perform(
            put("/api/courses/" + c.getId())
                .with(oauth2Login().attributes(attrs -> attrs.put("email", teacherA.getEmail())))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.title").value("New Title Via PUT"))
        .andExpect(jsonPath("$.visibility").value("Public"))
        .andExpect(jsonPath("$.status").value("live")) // isPublished=true + Public -> "live"
        .andDo(print());
  }

  @Test
  void shouldAllowAuthorToDeleteCourse() throws Exception {
    Course c =
        courseRepository.save(
            new Course("Delete Me", "Desc", null, false, CourseVisibility.Private, teacherA, null));

    mockMvc
        .perform(
            delete("/api/courses/" + c.getId())
                .with(oauth2Login().attributes(attrs -> attrs.put("email", teacherA.getEmail())))
                .with(csrf()))
        .andExpect(status().isNoContent())
        .andDo(print());

    assert courseRepository.findById(c.getId()).isEmpty();
  }

  @Test
  void shouldRejectStudentCourseCreation() throws Exception {
    mockMvc
        .perform(
            post("/api/courses")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail())))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isForbidden())
        .andDo(print());
  }

  @Test
  void shouldRejectStudentAccessToPrivateCourseDetail() throws Exception {
    Course privateCourse =
        courseRepository.save(
            new Course(
                "Private Course", "Desc", null, false, CourseVisibility.Private, teacherA, null));

    mockMvc
        .perform(
            get("/api/courses/" + privateCourse.getId())
                .with(
                    oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail()))))
        .andExpect(status().isForbidden())
        .andDo(print());
  }

  @Test
  void shouldRejectNonAuthorToUpdateCourse() throws Exception {
    Course c =
        courseRepository.save(
            new Course("Title", "Desc", null, false, CourseVisibility.Private, teacherA, null));
    UpdateCourseRequest req = new UpdateCourseRequest("Hacked Title", null, null, null, null, null);

    mockMvc
        .perform(
            put("/api/courses/" + c.getId())
                .with(oauth2Login().attributes(attrs -> attrs.put("email", teacherB.getEmail())))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
        .andExpect(status().isForbidden())
        .andDo(print());
  }

  @Test
  void shouldRejectNonAuthorToDeleteCourse() throws Exception {
    Course c =
        courseRepository.save(
            new Course("Title", "Desc", null, false, CourseVisibility.Private, teacherA, null));

    mockMvc
        .perform(
            delete("/api/courses/" + c.getId())
                .with(oauth2Login().attributes(attrs -> attrs.put("email", teacherB.getEmail())))
                .with(csrf()))
        .andExpect(status().isForbidden())
        .andDo(print());
  }

  @Test
  void shouldAllowAdminToUpdateAnotherTeacherCourse() throws Exception {
    Course c =
        courseRepository.save(
            new Course(
                "Teacher Course", "Desc", null, false, CourseVisibility.Private, teacherA, null));

    UpdateCourseRequest req =
        new UpdateCourseRequest("Admin Overwrite", null, null, null, null, null);

    mockMvc
        .perform(
            put("/api/courses/" + c.getId())
                .with(oauth2Login().attributes(attrs -> attrs.put("email", adminUser.getEmail())))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.title").value("Admin Overwrite"))
        .andDo(print());
  }

  @Test
  void shouldAllowAdminToDeleteAnotherTeacherCourse() throws Exception {
    Course c =
        courseRepository.save(
            new Course(
                "Teacher Course to Delete",
                "Desc",
                null,
                false,
                CourseVisibility.Private,
                teacherA,
                null));

    mockMvc
        .perform(
            delete("/api/courses/" + c.getId())
                .with(oauth2Login().attributes(attrs -> attrs.put("email", adminUser.getEmail())))
                .with(csrf()))
        .andExpect(status().isNoContent())
        .andDo(print());

    assert courseRepository.findById(c.getId()).isEmpty();
  }

  @Test
  void shouldComputeAllFourCourseStates() throws Exception {
    Course draft =
        courseRepository.save(
            new Course(
                "Draft Course", "Desc", null, false, CourseVisibility.Private, teacherA, null));
    Course comingSoon =
        courseRepository.save(
            new Course(
                "Coming Soon Course",
                "Desc",
                null,
                false,
                CourseVisibility.Public,
                teacherA,
                null));
    Course publishedHidden =
        courseRepository.save(
            new Course(
                "Published Hidden Course",
                "Desc",
                null,
                true,
                CourseVisibility.Private,
                teacherA,
                null));
    Course live =
        courseRepository.save(
            new Course("Live Course", "Desc", null, true, CourseVisibility.Public, teacherA, null));

    mockMvc
        .perform(
            get("/api/courses/" + draft.getId())
                .with(oauth2Login().attributes(attrs -> attrs.put("email", teacherA.getEmail()))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("draft"));

    mockMvc
        .perform(get("/api/courses/" + comingSoon.getId()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("coming_soon"));

    mockMvc
        .perform(
            get("/api/courses/" + publishedHidden.getId())
                .with(oauth2Login().attributes(attrs -> attrs.put("email", teacherA.getEmail()))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("published_hidden"));

    mockMvc
        .perform(get("/api/courses/" + live.getId()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("live"));
  }

  @Test
  void shouldAllowPatchForPartialUpdate() throws Exception {
    Course c =
        courseRepository.save(
            new Course(
                "Original Title",
                "Original Desc",
                "http://original.png",
                false,
                CourseVisibility.Private,
                teacherA,
                null));

    UpdateCourseRequest req =
        new UpdateCourseRequest("Patched Title Only", null, null, null, null, null);

    mockMvc
        .perform(
            patch("/api/courses/" + c.getId())
                .with(oauth2Login().attributes(attrs -> attrs.put("email", teacherA.getEmail())))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.title").value("Patched Title Only"))
        .andExpect(jsonPath("$.description").value("Original Desc"))
        .andExpect(jsonPath("$.thumbnailUrl").value("http://original.png"))
        .andDo(print());
  }

  @Test
  void shouldSearchCoursesByTitle() throws Exception {
    courseRepository.save(
        new Course(
            "Java Programming", "Desc", null, true, CourseVisibility.Public, teacherA, null));
    courseRepository.save(
        new Course("Python Basics", "Desc", null, true, CourseVisibility.Public, teacherA, null));

    mockMvc
        .perform(get("/api/courses?search=java"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content.length()").value(1))
        .andExpect(jsonPath("$.content[0].title").value("Java Programming"))
        .andDo(print());
  }

  @Test
  void shouldFilterCoursesByVisibility() throws Exception {
    courseRepository.save(
        new Course("Course A", "Desc", null, true, CourseVisibility.Public, teacherA, null));
    courseRepository.save(
        new Course("Course B", "Desc", null, true, CourseVisibility.Restricted, teacherA, null));

    mockMvc
        .perform(get("/api/courses?visibility=Restricted"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content.length()").value(1))
        .andExpect(jsonPath("$.content[0].title").value("Course B"))
        .andDo(print());
  }

  @Test
  void shouldFilterOwnCoursesForTeacher() throws Exception {
    courseRepository.save(
        new Course(
            "Teacher A Course", "Desc", null, true, CourseVisibility.Public, teacherA, null));
    courseRepository.save(
        new Course(
            "Teacher B Course", "Desc", null, true, CourseVisibility.Public, teacherB, null));

    mockMvc
        .perform(
            get("/api/courses?own=true")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", teacherA.getEmail()))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content.length()").value(1))
        .andExpect(jsonPath("$.content[0].title").value("Teacher A Course"))
        .andDo(print());
  }

  @Test
  void shouldPaginateCourseListing() throws Exception {
    courseRepository.save(
        new Course("Course 1", "Desc", null, true, CourseVisibility.Public, teacherA, null));
    courseRepository.save(
        new Course("Course 2", "Desc", null, true, CourseVisibility.Public, teacherA, null));
    courseRepository.save(
        new Course("Course 3", "Desc", null, true, CourseVisibility.Public, teacherA, null));

    mockMvc
        .perform(get("/api/courses?page=0&size=2&sort=title,asc"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content.length()").value(2))
        .andExpect(jsonPath("$.number").value(0))
        .andExpect(jsonPath("$.size").value(2))
        .andExpect(jsonPath("$.totalElements").value(3))
        .andDo(print());
  }

  @Test
  void shouldAllowAdminToSeeAllVisibilityTypesInListing() throws Exception {
    courseRepository.save(
        new Course("Public Course", "Desc", null, true, CourseVisibility.Public, teacherA, null));
    courseRepository.save(
        new Course(
            "Restricted Course", "Desc", null, true, CourseVisibility.Restricted, teacherA, null));
    courseRepository.save(
        new Course(
            "Private Course", "Desc", null, false, CourseVisibility.Private, teacherA, null));

    mockMvc
        .perform(
            get("/api/courses?sort=title,asc")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", adminUser.getEmail()))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content.length()").value(3))
        .andExpect(jsonPath("$.content[0].title").value("Private Course"))
        .andExpect(jsonPath("$.content[1].title").value("Public Course"))
        .andExpect(jsonPath("$.content[2].title").value("Restricted Course"))
        .andDo(print());
  }

  @Test
  void shouldRejectStudentOrGuestFromFilteringPrivateVisibility() throws Exception {
    mockMvc
        .perform(get("/api/courses?visibility=Private"))
        .andExpect(status().isForbidden())
        .andDo(print());

    mockMvc
        .perform(
            get("/api/courses?visibility=Private")
                .with(
                    oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail()))))
        .andExpect(status().isForbidden())
        .andDo(print());
  }

  @Test
  void shouldReturn404WhenCourseDoesNotExist() throws Exception {
    long nonExistentId = 999999999L;

    mockMvc
        .perform(get("/api/courses/" + nonExistentId))
        .andExpect(status().isNotFound())
        .andDo(print());

    UpdateCourseRequest req = new UpdateCourseRequest("Title", null, null, null, null, null);
    mockMvc
        .perform(
            put("/api/courses/" + nonExistentId)
                .with(oauth2Login().attributes(attrs -> attrs.put("email", teacherA.getEmail())))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
        .andExpect(status().isNotFound())
        .andDo(print());

    mockMvc
        .perform(
            delete("/api/courses/" + nonExistentId)
                .with(oauth2Login().attributes(attrs -> attrs.put("email", teacherA.getEmail())))
                .with(csrf()))
        .andExpect(status().isNotFound())
        .andDo(print());
  }

  @Test
  void shouldRejectGuestFromViewingPrivateCourseDetail() throws Exception {
    Course privateCourse =
        courseRepository.save(
            new Course(
                "Private Course Detailed",
                "Desc",
                null,
                false,
                CourseVisibility.Private,
                teacherA,
                null));

    mockMvc
        .perform(get("/api/courses/" + privateCourse.getId()))
        .andExpect(status().isForbidden())
        .andDo(print());
  }

  @Test
  void shouldRejectUnauthenticatedAccessWithoutCsrfToken() throws Exception {
    mockMvc
        .perform(post("/api/courses").contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isForbidden())
        .andDo(print());
  }

  @Test
  void shouldPersistAndRetrieveJSONBSettings() throws Exception {
    Map<String, Object> settings = new HashMap<>();
    settings.put("theme", "dark");
    settings.put("maxStudents", 50);

    CreateCourseRequest req =
        new CreateCourseRequest("Settings Course", "Desc", null, CourseVisibility.Public, settings);

    String responseString =
        mockMvc
            .perform(
                post("/api/courses")
                    .with(
                        oauth2Login().attributes(attrs -> attrs.put("email", teacherA.getEmail())))
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.settings.theme").value("dark"))
            .andExpect(jsonPath("$.settings.maxStudents").value(50))
            .andReturn()
            .getResponse()
            .getContentAsString();

    String idStr = com.jayway.jsonpath.JsonPath.read(responseString, "$.id");

    mockMvc
        .perform(get("/api/courses/" + idStr))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.settings.theme").value("dark"))
        .andExpect(jsonPath("$.settings.maxStudents").value(50))
        .andDo(print());
  }
}
