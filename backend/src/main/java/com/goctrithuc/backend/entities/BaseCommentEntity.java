package com.goctrithuc.backend.entities;

import jakarta.persistence.*;
import java.time.ZonedDateTime;
import org.hibernate.annotations.Generated;

@MappedSuperclass
public abstract class BaseCommentEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "author_id", nullable = false)
  private User author;

  @Column(nullable = false)
  private String content;

  @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
  @Generated
  private ZonedDateTime createdAt;

  @Column(name = "updated_at", nullable = false, insertable = false)
  @Generated
  private ZonedDateTime updatedAt;

  @Column(name = "edited_at")
  private ZonedDateTime editedAt;

  protected BaseCommentEntity() {}

  public BaseCommentEntity(User author, String content) {
    this.author = author;
    this.content = content;
  }

  public Long getId() {
    return id;
  }

  public User getAuthor() {
    return author;
  }

  public void setAuthor(User author) {
    this.author = author;
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

  public ZonedDateTime getEditedAt() {
    return editedAt;
  }

  public void setEditedAt(ZonedDateTime editedAt) {
    this.editedAt = editedAt;
  }
}
