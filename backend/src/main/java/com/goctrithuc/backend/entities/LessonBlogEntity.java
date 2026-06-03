package com.goctrithuc.backend.entities;

import jakarta.persistence.*;
import java.time.ZonedDateTime;

@Entity
@Table(name = "lesson_blogs")
public class LessonBlogEntity {

  @Id private Long id;

  @OneToOne(fetch = FetchType.LAZY)
  @MapsId
  @JoinColumn(name = "id")
  private LessonEntity lesson;

  @Column(nullable = false)
  private String content;

  @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
  private ZonedDateTime createdAt;

  @Column(name = "updated_at", nullable = false, insertable = false)
  private ZonedDateTime updatedAt;

  protected LessonBlogEntity() {}

  public LessonBlogEntity(LessonEntity lesson, String content) {
    this.lesson = lesson;
    this.content = content;
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

  public String getContent() {
    return content;
  }

  public void setContent(String content) {
    this.content = content;
  }

  public ZonedDateTime getCreatedAt() {
    return createdAt;
  }

  public ZonedDateTime getUpdatedAt() {
    return updatedAt;
  }
}
