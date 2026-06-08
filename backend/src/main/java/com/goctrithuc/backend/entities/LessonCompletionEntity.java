package com.goctrithuc.backend.entities;

import jakarta.persistence.*;
import java.time.ZonedDateTime;
import org.hibernate.annotations.Generated;

@Entity
@Table(name = "lesson_completions")
public class LessonCompletionEntity {

  @EmbeddedId private LessonCompletionId id;

  @ManyToOne(fetch = FetchType.LAZY)
  @MapsId("userId")
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @ManyToOne(fetch = FetchType.LAZY)
  @MapsId("lessonId")
  @JoinColumn(name = "lesson_id", nullable = false)
  private LessonEntity lesson;

  @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
  @Generated
  private ZonedDateTime createdAt;

  protected LessonCompletionEntity() {}

  public LessonCompletionEntity(User user, LessonEntity lesson) {
    this.user = user;
    this.lesson = lesson;
    this.id = new LessonCompletionId(user.getId(), lesson.getId());
  }

  public LessonCompletionId getId() {
    return id;
  }

  public void setId(LessonCompletionId id) {
    this.id = id;
  }

  public User getUser() {
    return user;
  }

  public void setUser(User user) {
    this.user = user;
  }

  public LessonEntity getLesson() {
    return lesson;
  }

  public void setLesson(LessonEntity lesson) {
    this.lesson = lesson;
  }

  public ZonedDateTime getCreatedAt() {
    return createdAt;
  }
}
