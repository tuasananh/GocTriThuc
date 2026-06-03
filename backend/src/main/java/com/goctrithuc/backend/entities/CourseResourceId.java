package com.goctrithuc.backend.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class CourseResourceId implements Serializable {

  @Column(name = "course_id", nullable = false)
  private Long courseId;

  @Column(name = "file_id", nullable = false)
  private Long fileId;

  protected CourseResourceId() {}

  public CourseResourceId(Long courseId, Long fileId) {
    this.courseId = courseId;
    this.fileId = fileId;
  }

  public Long getCourseId() {
    return courseId;
  }

  public Long getFileId() {
    return fileId;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (!(o instanceof CourseResourceId that)) {
      return false;
    }
    return Objects.equals(courseId, that.courseId) && Objects.equals(fileId, that.fileId);
  }

  @Override
  public int hashCode() {
    return Objects.hash(courseId, fileId);
  }
}
