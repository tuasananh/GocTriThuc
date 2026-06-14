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
import com.goctrithuc.backend.dtos.*;
import com.goctrithuc.backend.entities.*;
import com.goctrithuc.backend.repositories.*;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
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
  private final LessonVideoRepository lessonVideoRepository;
  private final LessonBlogRepository lessonBlogRepository;
  private final LessonTestRepository lessonTestRepository;
  private final EnrollmentRepository enrollmentRepository;
  private final FileRepository fileRepository;
  private final LessonResourceRepository lessonResourceRepository;
  private final ObjectMapper objectMapper = new ObjectMapper();

  private User adminUser;
  private User teacherA;
  private User teacherB;
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
      LessonVideoRepository lessonVideoRepository,
      LessonBlogRepository lessonBlogRepository,
      LessonTestRepository lessonTestRepository,
      EnrollmentRepository enrollmentRepository,
      FileRepository fileRepository,
      LessonResourceRepository lessonResourceRepository) {
    this.mockMvc = mockMvc;
    this.userRepository = userRepository;
    this.userRoleRepository = userRoleRepository;
    this.roleRepository = roleRepository;
    this.courseRepository = courseRepository;
    this.moduleRepository = moduleRepository;
    this.lessonRepository = lessonRepository;
    this.lessonVideoRepository = lessonVideoRepository;
    this.lessonBlogRepository = lessonBlogRepository;
    this.lessonTestRepository = lessonTestRepository;
    this.enrollmentRepository = enrollmentRepository;
    this.fileRepository = fileRepository;
    this.lessonResourceRepository = lessonResourceRepository;
  }

  @BeforeEach
  void setUp() {
    lessonResourceRepository.deleteAll();
    lessonVideoRepository.deleteAll();
    lessonBlogRepository.deleteAll();
    lessonTestRepository.deleteAll();
    lessonRepository.deleteAll();
    moduleRepository.deleteAll();
    enrollmentRepository.deleteAll();
    courseRepository.deleteAll();
    fileRepository.deleteAll();
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
    lessonResourceRepository.deleteAll();
    lessonVideoRepository.deleteAll();
    lessonBlogRepository.deleteAll();
    lessonTestRepository.deleteAll();
    lessonRepository.deleteAll();
    moduleRepository.deleteAll();
    enrollmentRepository.deleteAll();
    courseRepository.deleteAll();
    fileRepository.deleteAll();
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

  // --- DAY 6 ADDITIONS (QA & SECURITY AUDITED TESTS) ---

  @Test
  void shouldAllowAuthorToManageModulesAndLessons() throws Exception {
    Course course =
        courseRepository.save(
            new Course(
                "HUST Software Architecture",
                "Advanced Course",
                null,
                true,
                CourseVisibility.PUBLIC,
                teacherA,
                null));

    // 1. Create Module (Happy Path test)
    CreateModuleRequest createModReq = new CreateModuleRequest("Module 1: Introduction");
    String moduleResJson =
        mockMvc
            .perform(
                post("/api/courses/" + course.getId() + "/modules")
                    .with(
                        oauth2Login().attributes(attrs -> attrs.put("email", teacherA.getEmail())))
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(createModReq)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.title").value("Module 1: Introduction"))
            .andExpect(jsonPath("$.order").value(0))
            .andReturn()
            .getResponse()
            .getContentAsString();

    String moduleIdStr = com.jayway.jsonpath.JsonPath.read(moduleResJson, "$.id");
    Long moduleId = Long.valueOf(moduleIdStr);

    // 2. Create Lesson inside Module (Happy Path test - SRS line 758)
    CreateLessonRequest createLessReq =
        new CreateLessonRequest("Lesson 1.1: Hello HUST", LessonType.BLOG);
    String lessonResJson =
        mockMvc
            .perform(
                post("/api/modules/" + moduleId + "/lessons")
                    .with(
                        oauth2Login().attributes(attrs -> attrs.put("email", teacherA.getEmail())))
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(createLessReq)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.title").value("Lesson 1.1: Hello HUST"))
            .andExpect(jsonPath("$.type").value("blog"))
            .andExpect(jsonPath("$.order").value(0))
            .andReturn()
            .getResponse()
            .getContentAsString();

    String lessonIdStr = com.jayway.jsonpath.JsonPath.read(lessonResJson, "$.id");
    Long lessonId = Long.valueOf(lessonIdStr);

    // Verify default subtype blog seed has been created
    assertThat(lessonBlogRepository.findById(lessonId)).isPresent();
    assertThat(lessonBlogRepository.findById(lessonId).get().getContent()).isEqualTo("<p></p>");

    // 3. Update Lesson Blog Content (with active Jsoup HTML Whitelist Sanitizer check)
    String xssHtml =
        "<p class='block-class' style='color:red' data-id='block-123' data-content-type='paragraph'>Safe text</p><script>alert('XSS')</script>";
    UpdateLessonBlogRequest updateBlogReq = new UpdateLessonBlogRequest(xssHtml);

    mockMvc
        .perform(
            put("/api/lessons/" + lessonId + "/blog")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", teacherA.getEmail())))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateBlogReq)))
        .andExpect(status().isNoContent());

    // Verify cleaned content (Script stripped, class/style/data-* preserved globally)
    String sanitizedContent = lessonBlogRepository.findById(lessonId).get().getContent();
    assertThat(sanitizedContent).contains("Safe text");
    assertThat(sanitizedContent).contains("class=\"block-class\"");
    assertThat(sanitizedContent).contains("style=\"color:red\"");
    assertThat(sanitizedContent).contains("data-id=\"block-123\"");
    assertThat(sanitizedContent).contains("data-content-type=\"paragraph\"");
    assertThat(sanitizedContent).doesNotContain("<script>");

    // 4. Retrieve Lesson Detail (Security Test: Access denied for non-enrolled student/guest)
    mockMvc
        .perform(
            get("/api/lessons/" + lessonId)
                .with(
                    oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail()))))
        .andExpect(status().isForbidden());

    // Enroll student
    enrollmentRepository.save(new EnrollmentEntity(studentUser, course));

    // Retrieve Lesson Detail (Happy Path Test: Access allowed for enrolled student)
    mockMvc
        .perform(
            get("/api/lessons/" + lessonId)
                .with(
                    oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail()))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.title").value("Lesson 1.1: Hello HUST"))
        .andExpect(jsonPath("$.blog.content").value(sanitizedContent));

    // 5. Delete Module (Verify hard-delete cascade to lessons and lesson subtypes)
    mockMvc
        .perform(
            delete("/api/modules/" + moduleId)
                .with(oauth2Login().attributes(attrs -> attrs.put("email", teacherA.getEmail())))
                .with(csrf()))
        .andExpect(status().isNoContent());

    assertThat(moduleRepository.findById(moduleId)).isEmpty();
    assertThat(lessonRepository.findById(lessonId)).isEmpty();
    assertThat(lessonBlogRepository.findById(lessonId)).isEmpty();
  }

  @Test
  void shouldValidateReorderBoundariesAndSwapSequence() throws Exception {
    Course course =
        courseRepository.save(
            new Course("Course B", "Desc", null, true, CourseVisibility.PUBLIC, teacherA, null));

    // Setup 3 modules for HUST course
    ModuleEntity m1 = moduleRepository.save(new ModuleEntity(course, "Mod 1", 0));
    ModuleEntity m2 = moduleRepository.save(new ModuleEntity(course, "Mod 2", 1));
    ModuleEntity m3 = moduleRepository.save(new ModuleEntity(course, "Mod 3", 2));

    // 1. Move first module "up" (Boundary Edge Case) -> throws 400 Bad Request
    mockMvc
        .perform(
            patch("/api/modules/" + m1.getId() + "/order")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", teacherA.getEmail())))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new ReorderRequest("up"))))
        .andExpect(status().isBadRequest())
        .andDo(print());

    // 2. Move last module "down" (Boundary Edge Case) -> throws 400 Bad Request
    mockMvc
        .perform(
            patch("/api/modules/" + m3.getId() + "/order")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", teacherA.getEmail())))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new ReorderRequest("down"))))
        .andExpect(status().isBadRequest())
        .andDo(print());

    // 3. Move second module "up" (Mod 2 swapped with Mod 1) -> Mod 2 order becomes 0, Mod 1 order
    // becomes 1 (Happy Path)
    mockMvc
        .perform(
            patch("/api/modules/" + m2.getId() + "/order")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", teacherA.getEmail())))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new ReorderRequest("up"))))
        .andExpect(status().isNoContent());

    assertThat(moduleRepository.findById(m2.getId()).get().getOrder()).isEqualTo(0);
    assertThat(moduleRepository.findById(m1.getId()).get().getOrder()).isEqualTo(1);
    assertThat(moduleRepository.findById(m3.getId()).get().getOrder()).isEqualTo(2);
  }

  @Test
  void shouldRejectUnauthorizedActionsByNonAuthor() throws Exception {
    Course course =
        courseRepository.save(
            new Course("Course B", "Desc", null, true, CourseVisibility.PUBLIC, teacherA, null));
    ModuleEntity m1 = moduleRepository.save(new ModuleEntity(course, "Mod 1", 0));

    // Security Test: Teacher B tries to modify -> 403 Forbidden
    mockMvc
        .perform(
            put("/api/modules/" + m1.getId())
                .with(oauth2Login().attributes(attrs -> attrs.put("email", teacherB.getEmail())))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new UpdateModuleRequest("Hacked Module"))))
        .andExpect(status().isForbidden());

    mockMvc
        .perform(
            delete("/api/modules/" + m1.getId())
                .with(oauth2Login().attributes(attrs -> attrs.put("email", teacherB.getEmail())))
                .with(csrf()))
        .andExpect(status().isForbidden());
  }

  @Test
  void shouldAllowAuthorToUpdateLessonVideo() throws Exception {
    Course course =
        courseRepository.save(
            new Course(
                "HUST Computer Networks",
                "Advanced Networks",
                null,
                true,
                CourseVisibility.PUBLIC,
                teacherA,
                null));

    ModuleEntity module = moduleRepository.save(new ModuleEntity(course, "Module 1: Intro", 0));
    LessonEntity lesson =
        lessonRepository.save(
            new LessonEntity(module, "Lesson 1.1: OSI Model", LessonType.VIDEO, 0));
    lessonVideoRepository.save(new LessonVideoEntity(lesson, VideoProvider.YOUTUBE, ""));

    // Update video content
    UpdateLessonVideoRequest updateVideoReq =
        new UpdateLessonVideoRequest(
            VideoProvider.YOUTUBE, "https://www.youtube.com/watch?v=dQw4w9WgXcQ");

    mockMvc
        .perform(
            put("/api/lessons/" + lesson.getId() + "/video")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", teacherA.getEmail())))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateVideoReq)))
        .andExpect(status().isNoContent());

    // Verify database update
    LessonVideoEntity videoEntity = lessonVideoRepository.findById(lesson.getId()).orElseThrow();
    assertThat(videoEntity.getProvider()).isEqualTo(VideoProvider.YOUTUBE);
    assertThat(videoEntity.getProviderValue())
        .isEqualTo("https://www.youtube.com/watch?v=dQw4w9WgXcQ");

    // Enroll student and retrieve details
    enrollmentRepository.save(new EnrollmentEntity(studentUser, course));

    mockMvc
        .perform(
            get("/api/lessons/" + lesson.getId())
                .with(
                    oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail()))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.title").value("Lesson 1.1: OSI Model"))
        .andExpect(jsonPath("$.video.provider").value("youtube"))
        .andExpect(
            jsonPath("$.video.providerValue").value("https://www.youtube.com/watch?v=dQw4w9WgXcQ"));
  }

  @Test
  void shouldAllowAuthorToAttachLessonResourceAndRetrieveDetailWithResources() throws Exception {
    Course course =
        courseRepository.save(
            new Course(
                "HUST Computer Networks",
                "Advanced Networks",
                null,
                true,
                CourseVisibility.PUBLIC,
                teacherA,
                null));

    ModuleEntity module = moduleRepository.save(new ModuleEntity(course, "Module 1: Intro", 0));
    LessonEntity lesson =
        lessonRepository.save(
            new LessonEntity(module, "Lesson 1.1: OSI Model", LessonType.VIDEO, 0));

    // Create uploaded file owned by teacherA
    File file =
        fileRepository.save(
            new File(
                teacherA.getId(),
                "local",
                "lesson_doc.pdf",
                "application/pdf",
                "My Lesson Document.pdf",
                1024L));

    // Attach resource
    AttachResourceRequest attachReq = new AttachResourceRequest(file.getId());
    mockMvc
        .perform(
            post("/api/lessons/" + lesson.getId() + "/resources")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", teacherA.getEmail())))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(attachReq)))
        .andExpect(status().isCreated());

    // Enroll student and retrieve details to verify
    enrollmentRepository.save(new EnrollmentEntity(studentUser, course));

    mockMvc
        .perform(
            get("/api/lessons/" + lesson.getId())
                .with(
                    oauth2Login().attributes(attrs -> attrs.put("email", studentUser.getEmail()))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.resources.length()").value(1))
        .andExpect(jsonPath("$.resources[0].filename").value("lesson_doc.pdf"))
        .andExpect(jsonPath("$.resources[0].mimeType").value("application/pdf"))
        .andExpect(jsonPath("$.resources[0].originalName").value("My Lesson Document.pdf"))
        .andExpect(jsonPath("$.resources[0].sizeBytes").value(1024));
  }

  @Test
  void shouldRejectNonAuthorOrNonAdminFromAttachingLessonResource() throws Exception {
    Course course =
        courseRepository.save(
            new Course(
                "HUST Computer Networks",
                "Advanced Networks",
                null,
                true,
                CourseVisibility.PUBLIC,
                teacherA,
                null));

    ModuleEntity module = moduleRepository.save(new ModuleEntity(course, "Module 1: Intro", 0));
    LessonEntity lesson =
        lessonRepository.save(
            new LessonEntity(module, "Lesson 1.1: OSI Model", LessonType.VIDEO, 0));

    File file =
        fileRepository.save(
            new File(
                teacherB.getId(),
                "local",
                "lesson_doc.pdf",
                "application/pdf",
                "My Lesson Document.pdf",
                1024L));

    AttachResourceRequest attachReq = new AttachResourceRequest(file.getId());

    // Teacher B is NOT the author of Teacher A's course/lesson
    mockMvc
        .perform(
            post("/api/lessons/" + lesson.getId() + "/resources")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", teacherB.getEmail())))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(attachReq)))
        .andExpect(status().isForbidden());
  }

  @Test
  void shouldRejectAttachingLessonResourceWhenFileNotOwnedByAuthor() throws Exception {
    Course course =
        courseRepository.save(
            new Course(
                "HUST Computer Networks",
                "Advanced Networks",
                null,
                true,
                CourseVisibility.PUBLIC,
                teacherA,
                null));

    ModuleEntity module = moduleRepository.save(new ModuleEntity(course, "Module 1: Intro", 0));
    LessonEntity lesson =
        lessonRepository.save(
            new LessonEntity(module, "Lesson 1.1: OSI Model", LessonType.VIDEO, 0));

    // File uploaded by Teacher B (not owned by Teacher A)
    File file =
        fileRepository.save(
            new File(
                teacherB.getId(),
                "local",
                "teacher_b_doc.pdf",
                "application/pdf",
                "B's Lecture.pdf",
                1024L));

    AttachResourceRequest attachReq = new AttachResourceRequest(file.getId());

    // Teacher A tries to attach Teacher B's file
    mockMvc
        .perform(
            post("/api/lessons/" + lesson.getId() + "/resources")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", teacherA.getEmail())))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(attachReq)))
        .andExpect(status().isForbidden());
  }
}
