package com.goctrithuc.backend.controllers;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oauth2Login;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.goctrithuc.backend.BaseIntegrationTest;
import com.goctrithuc.backend.dtos.AnnouncementRequest;
import com.goctrithuc.backend.dtos.CommentRequest;
import com.goctrithuc.backend.entities.*;
import com.goctrithuc.backend.repositories.*;
import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@AutoConfigureMockMvc
public class Day10IntegrationTest extends BaseIntegrationTest {

  private final MockMvc mockMvc;
  private final UserRepository userRepository;
  private final RoleRepository roleRepository;
  private final UserRoleRepository userRoleRepository;
  private final CourseRepository courseRepository;
  private final EnrollmentRepository enrollmentRepository;
  private final ModuleRepository moduleRepository;
  private final LessonRepository lessonRepository;
  private final AnnouncementRepository announcementRepository;
  private final LessonCommentRepository lessonCommentRepository;
  private final AnnouncementCommentRepository announcementCommentRepository;
  private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;
  private final ObjectMapper objectMapper = new ObjectMapper();

  private User teacher;
  private User student;
  private User admin;
  private Course course;
  private LessonEntity lesson;

  @Autowired
  public Day10IntegrationTest(
      MockMvc mockMvc,
      UserRepository userRepository,
      RoleRepository roleRepository,
      UserRoleRepository userRoleRepository,
      CourseRepository courseRepository,
      EnrollmentRepository enrollmentRepository,
      ModuleRepository moduleRepository,
      LessonRepository lessonRepository,
      AnnouncementRepository announcementRepository,
      LessonCommentRepository lessonCommentRepository,
      AnnouncementCommentRepository announcementCommentRepository,
      org.springframework.jdbc.core.JdbcTemplate jdbcTemplate) {
    this.mockMvc = mockMvc;
    this.userRepository = userRepository;
    this.roleRepository = roleRepository;
    this.userRoleRepository = userRoleRepository;
    this.courseRepository = courseRepository;
    this.enrollmentRepository = enrollmentRepository;
    this.moduleRepository = moduleRepository;
    this.lessonRepository = lessonRepository;
    this.announcementRepository = announcementRepository;
    this.lessonCommentRepository = lessonCommentRepository;
    this.announcementCommentRepository = announcementCommentRepository;
    this.jdbcTemplate = jdbcTemplate;
  }

  @BeforeEach
  void setUp() {
    // 1. Setup users
    teacher = userRepository.save(new User("teacher@hust.edu.vn", "Teacher", "teacher", null));
    userRoleRepository.save(
        new UserRole(teacher, roleRepository.findByName("teacher").orElseThrow()));

    student = userRepository.save(new User("student@hust.edu.vn", "Student", "student", null));
    userRoleRepository.save(
        new UserRole(student, roleRepository.findByName("student").orElseThrow()));

    admin = userRepository.save(new User("admin@hust.edu.vn", "Admin", "admin", null));
    userRoleRepository.save(new UserRole(admin, roleRepository.findByName("admin").orElseThrow()));

    // 2. Setup course & curriculum
    course =
        courseRepository.save(
            new Course(
                "Java 101",
                "Introduction to Java",
                null,
                true,
                CourseVisibility.PUBLIC,
                teacher,
                null));
    enrollmentRepository.save(new EnrollmentEntity(student, course));

    ModuleEntity module = moduleRepository.save(new ModuleEntity(course, "Module 1", 1));
    lesson = lessonRepository.save(new LessonEntity(module, "Lesson 1", LessonType.BLOG, 1));
  }

  @AfterEach
  void cleanUp() {
    lessonCommentRepository.deleteAll();
    announcementCommentRepository.deleteAll();
    announcementRepository.deleteAll();
    lessonRepository.deleteAll();
    moduleRepository.deleteAll();
    enrollmentRepository.deleteAll();
    courseRepository.deleteAll();
    userRoleRepository.deleteAll();
    userRepository.deleteAll();
  }

  @Test
  void testAnnouncementCRUDAndPermissions() throws Exception {
    AnnouncementRequest request = new AnnouncementRequest("Welcome Title", "Welcome Content");
    String reqBody = objectMapper.writeValueAsString(request);

    // 1. Create - Success for Teacher
    String createResponseJson =
        mockMvc
            .perform(
                post("/api/courses/" + course.getId() + "/announcements")
                    .with(oauth2Login().attributes(attrs -> attrs.put("email", teacher.getEmail())))
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(reqBody))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.title").value("Welcome Title"))
            .andExpect(jsonPath("$.content").value("Welcome Content"))
            .andExpect(jsonPath("$.createdAt").isNotEmpty())
            .andExpect(jsonPath("$.updatedAt").isNotEmpty())
            .andReturn()
            .getResponse()
            .getContentAsString();

    Long announcementId = objectMapper.readTree(createResponseJson).get("id").asLong();

    // 2. Read - Success for Enrolled Student
    mockMvc
        .perform(
            get("/api/courses/" + course.getId() + "/announcements")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", student.getEmail()))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content[0].title").value("Welcome Title"));

    // 3. Update - Success for Admin
    AnnouncementRequest updateRequest = new AnnouncementRequest("Updated Title", "Updated Content");
    mockMvc
        .perform(
            put("/api/courses/" + course.getId() + "/announcements/" + announcementId)
                .with(oauth2Login().attributes(attrs -> attrs.put("email", admin.getEmail())))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.title").value("Updated Title"))
        .andExpect(jsonPath("$.content").value("Updated Content"));

    // BOLA Check - Update announcement with mismatching course ID -> Should fail
    mockMvc
        .perform(
            put("/api/courses/999/announcements/" + announcementId)
                .with(oauth2Login().attributes(attrs -> attrs.put("email", teacher.getEmail())))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
        .andExpect(status().isBadRequest());

    // BOLA Check - Delete announcement with mismatching course ID -> Should fail
    mockMvc
        .perform(
            delete("/api/courses/999/announcements/" + announcementId)
                .with(oauth2Login().attributes(attrs -> attrs.put("email", teacher.getEmail())))
                .with(csrf()))
        .andExpect(status().isBadRequest());

    // 4. Delete - Success for Teacher (Course Author)
    mockMvc
        .perform(
            delete("/api/courses/" + course.getId() + "/announcements/" + announcementId)
                .with(oauth2Login().attributes(attrs -> attrs.put("email", teacher.getEmail())))
                .with(csrf()))
        .andExpect(status().isNoContent());

    // 5. Read - Should be Empty
    mockMvc
        .perform(
            get("/api/courses/" + course.getId() + "/announcements")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", student.getEmail()))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content").isEmpty());
  }

  @Test
  void testLessonCommentsRecursiveTreeAndSanitization() throws Exception {
    // 0. Query comments on empty lesson - Should return empty page instead of crashing
    mockMvc
        .perform(
            get("/api/lessons/" + lesson.getId() + "/comments")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", student.getEmail()))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content").isEmpty());

    // 1. Create root comment with sanitization test (strip <script>)
    CommentRequest rootReq =
        new CommentRequest("<script>alert(1)</script>Root comment <b>HTML</b>", null);
    String rootRes =
        mockMvc
            .perform(
                post("/api/lessons/" + lesson.getId() + "/comments")
                    .with(oauth2Login().attributes(attrs -> attrs.put("email", student.getEmail())))
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(rootReq)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.createdAt").isNotEmpty())
            .andExpect(jsonPath("$.updatedAt").isNotEmpty())
            // Sanitized content strips unallowed tags
            .andExpect(
                jsonPath("$.content").value("Root comment <b>HTML</b>")) // <b> is relaxed allowed
            .andReturn()
            .getResponse()
            .getContentAsString();

    Long rootCommentId = objectMapper.readTree(rootRes).get("id").asLong();

    // 2. Create child comment (Reply)
    CommentRequest childReq = new CommentRequest("Reply to root", rootCommentId);
    mockMvc
        .perform(
            post("/api/lessons/" + lesson.getId() + "/comments")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", teacher.getEmail())))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(childReq)))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.parentId").value(rootCommentId.toString()));

    // 3. Get comments tree - verifying N+1 free CTE
    mockMvc
        .perform(
            get("/api/lessons/" + lesson.getId() + "/comments")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", student.getEmail()))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content[0].id").value(rootCommentId.toString()));
    // 4. Create comment with blank content (after sanitization) - Should fail
    CommentRequest blankReq = new CommentRequest("   <script>alert(1)</script>   ", null);
    mockMvc
        .perform(
            post("/api/lessons/" + lesson.getId() + "/comments")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", student.getEmail())))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(blankReq)))
        .andExpect(status().isBadRequest());
  }

  @Test
  void testCommentEditTimeWindowAndCascadingDeletion() throws Exception {
    // 1. Create a comment
    CommentRequest req = new CommentRequest("Original comment", null);
    String res =
        mockMvc
            .perform(
                post("/api/lessons/" + lesson.getId() + "/comments")
                    .with(oauth2Login().attributes(attrs -> attrs.put("email", student.getEmail())))
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getContentAsString();

    Long commentId = objectMapper.readTree(res).get("id").asLong();

    // 2. Edit within 15 minutes - Should succeed
    CommentRequest editReq = new CommentRequest("Edited comment", null);
    mockMvc
        .perform(
            patch("/api/lessons/comments/" + commentId)
                .with(oauth2Login().attributes(attrs -> attrs.put("email", student.getEmail())))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(editReq)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content").value("Edited comment"))
        .andExpect(jsonPath("$.editedAt").isNotEmpty());

    // 3. Simulate expired time window manually in database
    jdbcTemplate.update(
        "UPDATE lesson_comments SET created_at = NOW() - INTERVAL '20 minutes' WHERE id = ?",
        commentId);

    // 4. Edit after 15 minutes - Should fail
    mockMvc
        .perform(
            patch("/api/lessons/comments/" + commentId)
                .with(oauth2Login().attributes(attrs -> attrs.put("email", student.getEmail())))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(editReq)))
        .andExpect(status().isForbidden());

    // 5. Verify cascading deletion works
    // Create a child reply comment
    CommentRequest replyReq = new CommentRequest("Child reply to comment", commentId);
    String replyRes =
        mockMvc
            .perform(
                post("/api/lessons/" + lesson.getId() + "/comments")
                    .with(oauth2Login().attributes(attrs -> attrs.put("email", student.getEmail())))
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(replyReq)))
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getContentAsString();
    Long replyId = objectMapper.readTree(replyRes).get("id").asLong();

    // Delete root comment
    mockMvc
        .perform(
            delete("/api/lessons/comments/" + commentId)
                .with(oauth2Login().attributes(attrs -> attrs.put("email", admin.getEmail())))
                .with(csrf()))
        .andExpect(status().isNoContent());

    // Verify parent and child comments are both deleted
    org.junit.jupiter.api.Assertions.assertTrue(
        lessonCommentRepository.findById(commentId).isEmpty());
    org.junit.jupiter.api.Assertions.assertTrue(
        lessonCommentRepository.findById(replyId).isEmpty());
  }

  @Test
  void testAdminUserListingAndRolePromotion() throws Exception {
    // 1. User listing - Forbidden for students
    mockMvc
        .perform(
            get("/api/admin/users")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", student.getEmail()))))
        .andExpect(status().isForbidden());

    // 2. User listing - Ok for Admin
    mockMvc
        .perform(
            get("/api/admin/users")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", admin.getEmail()))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content[0].email").exists());

    // 3. Role update - Admin promotes student to teacher
    Map<String, String> roleBody = Map.of("role", "teacher");
    mockMvc
        .perform(
            put("/api/admin/users/" + student.getId() + "/role")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", admin.getEmail())))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(roleBody)))
        .andExpect(status().isNoContent());

    // 4. Verify role is changed
    mockMvc
        .perform(
            get("/api/users/me")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", student.getEmail()))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.roles[0]").value("teacher"));
  }
}
