package com.goctrithuc.backend.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class LessonResourceId implements Serializable {

  @Column(name = "lesson_id", nullable = false)
  private Long lessonId;

  @Column(name = "file_id", nullable = false)
  private Long fileId;

  protected LessonResourceId() {}

  public LessonResourceId(Long lessonId, Long fileId) {
    this.lessonId = lessonId;
    this.fileId = fileId;
  }

  public Long getLessonId() {
    return lessonId;
  }

  public Long getFileId() {
    return fileId;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (!(o instanceof LessonResourceId that)) {
      return false;
    }
    return Objects.equals(lessonId, that.lessonId) && Objects.equals(fileId, that.fileId);
  }

  @Override
  public int hashCode() {
    return Objects.hash(lessonId, fileId);
  }
}
