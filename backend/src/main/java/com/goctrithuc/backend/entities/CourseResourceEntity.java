package com.goctrithuc.backend.entities;

import jakarta.persistence.*;
import java.time.ZonedDateTime;
import org.hibernate.annotations.Generated;

@Entity
@Table(name = "course_resources")
public class CourseResourceEntity {

  @EmbeddedId private CourseResourceId id;

  @ManyToOne(fetch = FetchType.LAZY)
  @MapsId("courseId")
  @JoinColumn(name = "course_id", nullable = false)
  private Course course;

  @ManyToOne(fetch = FetchType.LAZY)
  @MapsId("fileId")
  @JoinColumn(name = "file_id", nullable = false)
  private File file;

  @Column(name = "created_at", nullable = false, updatable = false, insertable = false)
  @Generated
  private ZonedDateTime createdAt;

  @Column(name = "updated_at", nullable = false, insertable = false)
  @Generated
  private ZonedDateTime updatedAt;

  protected CourseResourceEntity() {}

  public CourseResourceEntity(Course course, File file) {
    this.course = course;
    this.file = file;
    this.id = new CourseResourceId(course.getId(), file.getId());
  }

  public CourseResourceId getId() {
    return id;
  }

  public void setId(CourseResourceId id) {
    this.id = id;
  }

  public Course getCourse() {
    return course;
  }

  public void setCourse(Course course) {
    this.course = course;
  }

  public File getFile() {
    return file;
  }

  public void setFile(File file) {
    this.file = file;
  }

  public ZonedDateTime getCreatedAt() {
    return createdAt;
  }

  public ZonedDateTime getUpdatedAt() {
    return updatedAt;
  }
}
