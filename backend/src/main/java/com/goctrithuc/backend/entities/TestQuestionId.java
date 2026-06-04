package com.goctrithuc.backend.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class TestQuestionId implements Serializable {

  @Column(name = "test_id", nullable = false)
  private Long testId;

  @Column(name = "question_id", nullable = false)
  private Long questionId;

  protected TestQuestionId() {}

  public TestQuestionId(Long testId, Long questionId) {
    this.testId = testId;
    this.questionId = questionId;
  }

  public Long getTestId() {
    return testId;
  }

  public Long getQuestionId() {
    return questionId;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (!(o instanceof TestQuestionId that)) {
      return false;
    }
    return Objects.equals(testId, that.testId) && Objects.equals(questionId, that.questionId);
  }

  @Override
  public int hashCode() {
    return Objects.hash(testId, questionId);
  }
}
