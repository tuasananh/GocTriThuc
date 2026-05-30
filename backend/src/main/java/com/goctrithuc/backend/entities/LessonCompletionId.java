package com.goctrithuc.backend.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class LessonCompletionId implements Serializable {

  @Column(name = "user_id", nullable = false)
  private Long userId;

  @Column(name = "lesson_id", nullable = false)
  private Long lessonId;

  protected LessonCompletionId() {}

  public LessonCompletionId(Long userId, Long lessonId) {
    this.userId = userId;
    this.lessonId = lessonId;
  }

  public Long getUserId() {
    return userId;
  }

  public Long getLessonId() {
    return lessonId;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (!(o instanceof LessonCompletionId that)) {
      return false;
    }
    return Objects.equals(userId, that.userId) && Objects.equals(lessonId, that.lessonId);
  }

  @Override
  public int hashCode() {
    return Objects.hash(userId, lessonId);
  }
}
