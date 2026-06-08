package com.goctrithuc.backend.entities;

import jakarta.persistence.*;
import java.time.ZonedDateTime;
import org.hibernate.annotations.Generated;

@Entity
@Table(name = "course_access_requests")
public class CourseAccessRequestEntity {

  @EmbeddedId private CourseAccessRequestId id;

  @ManyToOne(fetch = FetchType.LAZY)
  @MapsId("userId")
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @ManyToOne(fetch = FetchType.LAZY)
  @MapsId("courseId")
  @JoinColumn(name = "course_id", nullable = false)
  private Course course;

  @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
  @Generated
  private ZonedDateTime createdAt;

  protected CourseAccessRequestEntity() {}

  public CourseAccessRequestEntity(User user, Course course) {
    this.user = user;
    this.course = course;
    this.id = new CourseAccessRequestId(user.getId(), course.getId());
  }

  public CourseAccessRequestId getId() {
    return id;
  }

  public void setId(CourseAccessRequestId id) {
    this.id = id;
  }

  public User getUser() {
    return user;
  }

  public void setUser(User user) {
    this.user = user;
  }

  public Course getCourse() {
    return course;
  }

  public void setCourse(Course course) {
    this.course = course;
  }

  public ZonedDateTime getCreatedAt() {
    return createdAt;
  }
}
