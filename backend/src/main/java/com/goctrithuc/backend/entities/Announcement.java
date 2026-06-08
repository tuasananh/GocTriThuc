package com.goctrithuc.backend.entities;

import jakarta.persistence.*;
import java.time.ZonedDateTime;
import org.hibernate.annotations.Generated;

@Entity
@Table(name = "announcements")
public class Announcement {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "course_id", nullable = false)
  private Course course;

  @Column(name = "author_id", nullable = false)
  private Long authorId;

  @Column(nullable = false)
  private String title;

  @Column(nullable = false)
  private String content;

  @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
  @Generated
  private ZonedDateTime createdAt;

  @Column(name = "updated_at", nullable = false, insertable = false)
  @Generated
  private ZonedDateTime updatedAt;

  protected Announcement() {}

  public Announcement(Course course, Long authorId, String title, String content) {
    this.course = course;
    this.authorId = authorId;
    this.title = title;
    this.content = content;
  }

  public Long getId() {
    return id;
  }

  public Course getCourse() {
    return course;
  }

  public void setCourse(Course course) {
    this.course = course;
  }

  public Long getAuthorId() {
    return authorId;
  }

  public void setAuthorId(Long authorId) {
    this.authorId = authorId;
  }

  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
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
