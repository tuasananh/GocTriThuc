package com.goctrithuc.backend.dtos;

import static org.assertj.core.api.Assertions.assertThat;

import com.goctrithuc.backend.entities.LessonTestEntity;
import com.goctrithuc.backend.entities.McQuestionEntity;
import com.goctrithuc.backend.entities.QuestionEntity;
import com.goctrithuc.backend.entities.QuestionType;
import com.goctrithuc.backend.entities.TestQuestionEntity;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

public class TestQuestionResponseTest {

  private TestQuestionEntity tq;
  private QuestionEntity q;
  private McQuestionEntity mc;

  @BeforeEach
  void setUp() throws Exception {
    // Build minimal QuestionEntity via reflection (no-arg constructor is protected)
    q = buildQuestion();
    mc = new McQuestionEntity(q, new String[] {"A", "B", "C"}, new int[] {0, 2}, false);
    tq = new TestQuestionEntity(buildLessonTest(), q, 1, 5.0);
  }

  @Test
  void fromStudentHidesCorrectChoices() {
    TestQuestionResponse res = TestQuestionResponse.fromStudent(tq, q, mc);

    assertThat(res.correctChoices()).as("Students must never see correct answers").isNull();
  }

  @Test
  void fromStudentExposesChoices() {
    TestQuestionResponse res = TestQuestionResponse.fromStudent(tq, q, mc);

    assertThat(res.choices()).containsExactly("A", "B", "C");
  }

  @Test
  void fromInstructorExposesCorrectChoices() {
    TestQuestionResponse res = TestQuestionResponse.fromInstructor(tq, q, mc);

    assertThat(res.correctChoices())
        .as("Instructors must see correct answers")
        .isNotNull()
        .containsExactlyInAnyOrder(0, 2);
  }

  @Test
  void fromInstructorAndFromStudentReturnSameOrderAndPoint() {
    TestQuestionResponse instructor = TestQuestionResponse.fromInstructor(tq, q, mc);
    TestQuestionResponse student = TestQuestionResponse.fromStudent(tq, q, mc);

    assertThat(instructor.order()).isEqualTo(student.order());
    assertThat(instructor.point()).isEqualTo(student.point());
    assertThat(instructor.isSingleChoice()).isEqualTo(student.isSingleChoice());
  }

  // --- helpers ---

  private QuestionEntity buildQuestion() throws Exception {
    var ctor =
        QuestionEntity.class.getDeclaredConstructor(Long.class, String.class, QuestionType.class);
    ctor.setAccessible(true);
    return ctor.newInstance(1L, "What is 2+2?", QuestionType.MULTIPLE_CHOICE);
  }

  private LessonTestEntity buildLessonTest() throws Exception {
    // LessonTestEntity has a protected no-arg constructor; use it via reflection
    var ctor = LessonTestEntity.class.getDeclaredConstructor();
    ctor.setAccessible(true);
    return ctor.newInstance();
  }
}
