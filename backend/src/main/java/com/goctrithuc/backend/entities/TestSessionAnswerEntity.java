package com.goctrithuc.backend.entities;

import jakarta.persistence.*;
import java.time.ZonedDateTime;
import org.hibernate.annotations.Generated;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "test_session_answers")
public class TestSessionAnswerEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "session_id", nullable = false)
  private TestSessionEntity session;

  @Column(name = "question_id", nullable = false)
  private Long questionId;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(name = "question_answer")
  private int[] questionAnswer;

  @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
  @Generated
  private ZonedDateTime createdAt;

  @Column(name = "updated_at", nullable = false, insertable = false)
  @Generated
  private ZonedDateTime updatedAt;

  protected TestSessionAnswerEntity() {}

  public TestSessionAnswerEntity(TestSessionEntity session, Long questionId, int[] questionAnswer) {
    this.session = session;
    this.questionId = questionId;
    this.questionAnswer = questionAnswer;
  }

  public Long getId() {
    return id;
  }

  public TestSessionEntity getSession() {
    return session;
  }

  public void setSession(TestSessionEntity session) {
    this.session = session;
  }

  public Long getQuestionId() {
    return questionId;
  }

  public void setQuestionId(Long questionId) {
    this.questionId = questionId;
  }

  public int[] getQuestionAnswer() {
    return questionAnswer;
  }

  public void setQuestionAnswer(int[] questionAnswer) {
    this.questionAnswer = questionAnswer;
  }

  public ZonedDateTime getCreatedAt() {
    return createdAt;
  }

  public ZonedDateTime getUpdatedAt() {
    return updatedAt;
  }
}
