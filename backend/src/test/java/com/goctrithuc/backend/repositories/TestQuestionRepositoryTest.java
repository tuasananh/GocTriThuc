package com.goctrithuc.backend.repositories;

import static org.assertj.core.api.Assertions.assertThat;

import com.goctrithuc.backend.BaseIntegrationTest;
import com.goctrithuc.backend.entities.*;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.transaction.annotation.Transactional;

/** Regression test: deleteByTestIdAndQuestionId on embedded ID must actually remove the row. */
@AutoConfigureMockMvc
@Transactional
public class TestQuestionRepositoryTest extends BaseIntegrationTest {

  @Autowired private UserRepository userRepository;
  @Autowired private CourseRepository courseRepository;
  @Autowired private ModuleRepository moduleRepository;
  @Autowired private LessonRepository lessonRepository;
  @Autowired private LessonTestRepository lessonTestRepository;
  @Autowired private QuestionRepository questionRepository;
  @Autowired private McQuestionRepository mcQuestionRepository;
  @Autowired private TestQuestionRepository testQuestionRepository;
  @Autowired private RoleRepository roleRepository;
  @Autowired private UserRoleRepository userRoleRepository;
  @Autowired private EntityManager entityManager;

  @Test
  void deleteByTestIdAndQuestionIdActuallyRemovesRow() {
    // --- Arrange ---
    User teacher =
        userRepository.save(new User("teacher@test.com", "Teacher", "teacher_repo_test", null));
    userRoleRepository.save(
        new UserRole(teacher, roleRepository.findByName("teacher").orElseThrow()));

    Course course =
        courseRepository.save(
            new Course("C", "D", null, true, CourseVisibility.PUBLIC, teacher, null));
    ModuleEntity module = moduleRepository.save(new ModuleEntity(course, "M", 0));
    LessonEntity lesson = lessonRepository.save(new LessonEntity(module, "L", LessonType.TEST, 0));
    LessonTestEntity test = lessonTestRepository.save(new LessonTestEntity(lesson, "T", 60, null));

    QuestionEntity q =
        questionRepository.save(
            new QuestionEntity(teacher.getId(), "Q?", QuestionType.MULTIPLE_CHOICE));
    mcQuestionRepository.save(
        new McQuestionEntity(q, new String[] {"A", "B"}, new int[] {0}, true));

    testQuestionRepository.save(new TestQuestionEntity(test, q, 0, 5.0));
    assertThat(testQuestionRepository.existsById(new TestQuestionId(test.getId(), q.getId())))
        .isTrue();

    // --- Act ---
    testQuestionRepository.deleteByTestIdAndQuestionId(test.getId(), q.getId());

    // --- Assert ---
    // If the derived query silently no-ops (embedded-ID bug), this would still be true.
    assertThat(testQuestionRepository.existsById(new TestQuestionId(test.getId(), q.getId())))
        .as("deleteByTestIdAndQuestionId must actually remove the row")
        .isFalse();
  }

  @Test
  void observeDeleteByIdBehavior() {
    // --- Arrange ---
    User teacher =
        userRepository.save(
            new User("teacher-del-by-id@test.com", "Teacher", "teacher_del_id", null));
    userRoleRepository.save(
        new UserRole(teacher, roleRepository.findByName("teacher").orElseThrow()));
    Course course =
        courseRepository.save(
            new Course("C", "D", null, true, CourseVisibility.PUBLIC, teacher, null));
    ModuleEntity module = moduleRepository.save(new ModuleEntity(course, "M", 0));
    LessonEntity lesson = lessonRepository.save(new LessonEntity(module, "L", LessonType.TEST, 0));
    LessonTestEntity test = lessonTestRepository.save(new LessonTestEntity(lesson, "T", 60, null));
    QuestionEntity q =
        questionRepository.save(
            new QuestionEntity(teacher.getId(), "Q?", QuestionType.MULTIPLE_CHOICE));
    mcQuestionRepository.save(
        new McQuestionEntity(q, new String[] {"A", "B"}, new int[] {0}, true));

    TestQuestionEntity tq = testQuestionRepository.save(new TestQuestionEntity(test, q, 0, 5.0));
    testQuestionRepository.flush(); // Ensure insert is flushed first

    entityManager.clear(); // Clear first-level cache to simulate cold database state

    // --- Act & Observe SQL ---
    System.out.println("==================================================");
    System.out.println("SQL OBSERVATION: START OF deleteById");
    System.out.println("==================================================");

    testQuestionRepository.deleteById(tq.getId());
    testQuestionRepository.flush(); // Force Hibernate to execute SQL delete/select immediately

    System.out.println("==================================================");
    System.out.println("SQL OBSERVATION: END OF deleteById");
    System.out.println("==================================================");
  }

  @Test
  void observeDeleteByCustomQueryBehavior() {
    // --- Arrange ---
    User teacher =
        userRepository.save(
            new User("teacher-del-by-custom@test.com", "Teacher", "teacher_del_custom", null));
    userRoleRepository.save(
        new UserRole(teacher, roleRepository.findByName("teacher").orElseThrow()));
    Course course =
        courseRepository.save(
            new Course("C", "D", null, true, CourseVisibility.PUBLIC, teacher, null));
    ModuleEntity module = moduleRepository.save(new ModuleEntity(course, "M", 0));
    LessonEntity lesson = lessonRepository.save(new LessonEntity(module, "L", LessonType.TEST, 0));
    LessonTestEntity test = lessonTestRepository.save(new LessonTestEntity(lesson, "T", 60, null));
    QuestionEntity q =
        questionRepository.save(
            new QuestionEntity(teacher.getId(), "Q?", QuestionType.MULTIPLE_CHOICE));
    mcQuestionRepository.save(
        new McQuestionEntity(q, new String[] {"A", "B"}, new int[] {0}, true));

    testQuestionRepository.save(new TestQuestionEntity(test, q, 0, 5.0));
    testQuestionRepository.flush(); // Ensure insert is flushed first

    entityManager.clear(); // Clear first-level cache to simulate cold database state

    // --- Act & Observe SQL ---
    System.out.println("==================================================");
    System.out.println("SQL OBSERVATION: START OF deleteByTestIdAndQuestionId");
    System.out.println("==================================================");

    testQuestionRepository.deleteByTestIdAndQuestionId(test.getId(), q.getId());
    testQuestionRepository.flush(); // Force Hibernate to execute SQL delete immediately

    System.out.println("==================================================");
    System.out.println("SQL OBSERVATION: END OF deleteByTestIdAndQuestionId");
    System.out.println("==================================================");
  }
}
