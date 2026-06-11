package com.goctrithuc.backend.entities;

import jakarta.persistence.*;
import java.time.ZonedDateTime;
import org.hibernate.annotations.Generated;

@Entity
@Table(name = "test_question")
public class TestQuestionEntity {

  @EmbeddedId private TestQuestionId id;

  @ManyToOne(fetch = FetchType.LAZY)
  @MapsId("testId")
  @JoinColumn(name = "test_id", nullable = false)
  private LessonTestEntity test;

  @ManyToOne(fetch = FetchType.LAZY)
  @MapsId("questionId")
  @JoinColumn(name = "question_id", nullable = false)
  private QuestionEntity question;

  @Column(name = "\"order\"", nullable = false)
  private Integer order;

  @Column(name = "point")
  private Double point;

  @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
  @Generated
  private ZonedDateTime createdAt;

  @Column(name = "updated_at", nullable = false, insertable = false)
  @Generated
  private ZonedDateTime updatedAt;

  protected TestQuestionEntity() {}

  public TestQuestionEntity(
      LessonTestEntity test, QuestionEntity question, Integer order, Double point) {
    this.test = test;
    this.question = question;
    this.order = order;
    this.point = point;
    this.id = new TestQuestionId(test.getId(), question.getId());
  }

  public TestQuestionId getId() {
    return id;
  }

  public void setId(TestQuestionId id) {
    this.id = id;
  }

  public LessonTestEntity getTest() {
    return test;
  }

  public void setTest(LessonTestEntity test) {
    this.test = test;
  }

  public QuestionEntity getQuestion() {
    return question;
  }

  public void setQuestion(QuestionEntity question) {
    this.question = question;
  }

  public Integer getOrder() {
    return order;
  }

  public void setOrder(Integer order) {
    this.order = order;
  }

  public Double getPoint() {
    return point;
  }

  public void setPoint(Double point) {
    this.point = point;
  }

  public ZonedDateTime getCreatedAt() {
    return createdAt;
  }

  public ZonedDateTime getUpdatedAt() {
    return updatedAt;
  }
}
