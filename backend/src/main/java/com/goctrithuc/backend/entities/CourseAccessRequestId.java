package com.goctrithuc.backend.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class CourseAccessRequestId implements Serializable {

  @Column(name = "user_id", nullable = false)
  private Long userId;

  @Column(name = "course_id", nullable = false)
  private Long courseId;

  protected CourseAccessRequestId() {}

  public CourseAccessRequestId(Long userId, Long courseId) {
    this.userId = userId;
    this.courseId = courseId;
  }

  public Long getUserId() {
    return userId;
  }

  public Long getCourseId() {
    return courseId;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (!(o instanceof CourseAccessRequestId that)) {
      return false;
    }
    return Objects.equals(userId, that.userId) && Objects.equals(courseId, that.courseId);
  }

  @Override
  public int hashCode() {
    return Objects.hash(userId, courseId);
  }
}
