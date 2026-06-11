package com.goctrithuc.backend.entities;

import jakarta.persistence.*;
import java.time.ZonedDateTime;
import org.hibernate.annotations.Generated;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "mc_questions")
public class McQuestionEntity {

  @Id private Long id;

  @OneToOne(fetch = FetchType.LAZY)
  @MapsId
  @JoinColumn(name = "id")
  private QuestionEntity question;

  @Column(name = "choices", nullable = false)
  @JdbcTypeCode(SqlTypes.ARRAY)
  private String[] choices;

  @Column(name = "correct_choices", nullable = false)
  @JdbcTypeCode(SqlTypes.ARRAY)
  private int[] correctChoices;

  @Column(name = "is_single_choice", nullable = false)
  private boolean isSingleChoice;

  @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
  @Generated
  private ZonedDateTime createdAt;

  @Column(name = "updated_at", nullable = false, insertable = false)
  @Generated
  private ZonedDateTime updatedAt;

  protected McQuestionEntity() {}

  public McQuestionEntity(
      QuestionEntity question, String[] choices, int[] correctChoices, boolean isSingleChoice) {
    this.question = question;
    this.choices = choices;
    this.correctChoices = correctChoices;
    this.isSingleChoice = isSingleChoice;
  }

  public Long getId() {
    return id;
  }

  public QuestionEntity getQuestion() {
    return question;
  }

  public void setQuestion(QuestionEntity question) {
    this.question = question;
  }

  public String[] getChoices() {
    return choices;
  }

  public void setChoices(String[] choices) {
    this.choices = choices;
  }

  public int[] getCorrectChoices() {
    return correctChoices;
  }

  public void setCorrectChoices(int[] correctChoices) {
    this.correctChoices = correctChoices;
  }

  public boolean isSingleChoice() {
    return isSingleChoice;
  }

  public void setSingleChoice(boolean singleChoice) {
    isSingleChoice = singleChoice;
  }

  public ZonedDateTime getCreatedAt() {
    return createdAt;
  }

  public ZonedDateTime getUpdatedAt() {
    return updatedAt;
  }
}
