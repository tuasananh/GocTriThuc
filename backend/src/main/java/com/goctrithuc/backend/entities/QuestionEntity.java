package com.goctrithuc.backend.entities;

import jakarta.persistence.*;
import java.time.ZonedDateTime;

@Entity
@Table(name = "questions")
public class QuestionEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "author_id", nullable = false)
  private Long authorId;

  @Column(nullable = false)
  private String statement;

  @Column(name = "question_type", nullable = false)
  @Convert(converter = QuestionTypeJpaConverter.class)
  private QuestionType questionType;

  @OneToOne(mappedBy = "question", fetch = FetchType.LAZY, cascade = CascadeType.REMOVE)
  private McQuestionEntity mcQuestion;

  @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
  private ZonedDateTime createdAt;

  @Column(name = "updated_at", nullable = false, insertable = false)
  private ZonedDateTime updatedAt;

  protected QuestionEntity() {}

  public QuestionEntity(Long authorId, String statement, QuestionType questionType) {
    this.authorId = authorId;
    this.statement = statement;
    this.questionType = questionType;
  }

  public Long getId() {
    return id;
  }

  public Long getAuthorId() {
    return authorId;
  }

  public void setAuthorId(Long authorId) {
    this.authorId = authorId;
  }

  public String getStatement() {
    return statement;
  }

  public void setStatement(String statement) {
    this.statement = statement;
  }

  public QuestionType getQuestionType() {
    return questionType;
  }

  public void setQuestionType(QuestionType questionType) {
    this.questionType = questionType;
  }

  public ZonedDateTime getCreatedAt() {
    return createdAt;
  }

  public ZonedDateTime getUpdatedAt() {
    return updatedAt;
  }

  public McQuestionEntity getMcQuestion() {
    return mcQuestion;
  }
}
