package com.goctrithuc.backend.entities;

import jakarta.persistence.*;
import java.time.ZonedDateTime;
import java.util.Map;
import org.hibernate.annotations.Generated;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "lesson_tests")
public class LessonTestEntity {

  @Id private Long id;

  @OneToOne(fetch = FetchType.LAZY)
  @MapsId
  @JoinColumn(name = "id")
  private LessonEntity lesson;

  @Column(nullable = false)
  private String statement;

  @Column(name = "time_limit", nullable = false)
  private Integer timeLimit;

  @JdbcTypeCode(SqlTypes.JSON)
  private Map<String, Object> settings;

  @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
  @Generated
  private ZonedDateTime createdAt;

  @Column(name = "updated_at", nullable = false, insertable = false)
  @Generated
  private ZonedDateTime updatedAt;

  protected LessonTestEntity() {}

  public LessonTestEntity(
      LessonEntity lesson, String statement, Integer timeLimit, Map<String, Object> settings) {
    this.lesson = lesson;
    this.statement = statement;
    this.timeLimit = timeLimit;
    this.settings = settings;
  }

  public Long getId() {
    return id;
  }

  public LessonEntity getLesson() {
    return lesson;
  }

  public void setLesson(LessonEntity lesson) {
    this.lesson = lesson;
  }

  public String getStatement() {
    return statement;
  }

  public void setStatement(String statement) {
    this.statement = statement;
  }

  public Integer getTimeLimit() {
    return timeLimit;
  }

  public void setTimeLimit(Integer timeLimit) {
    this.timeLimit = timeLimit;
  }

  public Map<String, Object> getSettings() {
    return settings != null ? settings : Map.of();
  }

  public void setSettings(Map<String, Object> settings) {
    this.settings = settings;
  }

  public ZonedDateTime getCreatedAt() {
    return createdAt;
  }

  public ZonedDateTime getUpdatedAt() {
    return updatedAt;
  }
}
