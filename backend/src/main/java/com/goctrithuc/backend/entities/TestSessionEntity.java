package com.goctrithuc.backend.entities;

import jakarta.persistence.*;
import java.time.ZonedDateTime;

@Entity
@Table(name = "test_sessions")
public class TestSessionEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "test_id", nullable = false)
  private LessonTestEntity test;

  @Column(name = "started_at", nullable = false)
  private ZonedDateTime startedAt;

  @Column(name = "submitted_at")
  private ZonedDateTime submittedAt;

  @Column(name = "is_done", nullable = false)
  private boolean isDone;

  @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
  private ZonedDateTime createdAt;

  @Column(name = "updated_at", nullable = false, insertable = false)
  private ZonedDateTime updatedAt;

  protected TestSessionEntity() {}

  public TestSessionEntity(User user, LessonTestEntity test, ZonedDateTime startedAt) {
    this.user = user;
    this.test = test;
    this.startedAt = startedAt;
    this.isDone = false;
  }

  public Long getId() {
    return id;
  }

  public User getUser() {
    return user;
  }

  public void setUser(User user) {
    this.user = user;
  }

  public LessonTestEntity getTest() {
    return test;
  }

  public void setTest(LessonTestEntity test) {
    this.test = test;
  }

  public ZonedDateTime getStartedAt() {
    return startedAt;
  }

  public void setStartedAt(ZonedDateTime startedAt) {
    this.startedAt = startedAt;
  }

  public ZonedDateTime getSubmittedAt() {
    return submittedAt;
  }

  public void setSubmittedAt(ZonedDateTime submittedAt) {
    this.submittedAt = submittedAt;
  }

  public boolean isDone() {
    return isDone;
  }

  public void setDone(boolean done) {
    isDone = done;
  }

  public ZonedDateTime getCreatedAt() {
    return createdAt;
  }

  public ZonedDateTime getUpdatedAt() {
    return updatedAt;
  }
}
