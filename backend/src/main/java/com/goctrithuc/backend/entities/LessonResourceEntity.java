package com.goctrithuc.backend.entities;

import jakarta.persistence.*;
import java.time.ZonedDateTime;

@Entity
@Table(name = "lesson_resources")
public class LessonResourceEntity {

  @EmbeddedId private LessonResourceId id;

  @ManyToOne(fetch = FetchType.LAZY)
  @MapsId("lessonId")
  @JoinColumn(name = "lesson_id", nullable = false)
  private LessonEntity lesson;

  @ManyToOne(fetch = FetchType.LAZY)
  @MapsId("fileId")
  @JoinColumn(name = "file_id", nullable = false)
  private File file;

  @Column(name = "created_at", nullable = false, updatable = false, insertable = false)
  private ZonedDateTime createdAt;

  @Column(name = "updated_at", nullable = false, insertable = false)
  private ZonedDateTime updatedAt;

  protected LessonResourceEntity() {}

  public LessonResourceEntity(LessonEntity lesson, File file) {
    this.lesson = lesson;
    this.file = file;
    this.id = new LessonResourceId(lesson.getId(), file.getId());
  }

  public LessonResourceId getId() {
    return id;
  }

  public void setId(LessonResourceId id) {
    this.id = id;
  }

  public LessonEntity getLesson() {
    return lesson;
  }

  public void setLesson(LessonEntity lesson) {
    this.lesson = lesson;
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
