package com.goctrithuc.backend.entities;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "lesson_comments")
public class LessonCommentEntity extends BaseCommentEntity {

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "lesson_id", nullable = false)
  private LessonEntity lesson;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "parent_id")
  private LessonCommentEntity parent;

  @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL, orphanRemoval = true)
  @OrderBy("createdAt ASC")
  private List<LessonCommentEntity> replies = new ArrayList<>();

  protected LessonCommentEntity() {
    super();
  }

  public LessonCommentEntity(
      User author, String content, LessonEntity lesson, LessonCommentEntity parent) {
    super(author, content);
    this.lesson = lesson;
    this.parent = parent;
  }

  public LessonEntity getLesson() {
    return lesson;
  }

  public void setLesson(LessonEntity lesson) {
    this.lesson = lesson;
  }

  public LessonCommentEntity getParent() {
    return parent;
  }

  public void setParent(LessonCommentEntity parent) {
    this.parent = parent;
  }

  public List<LessonCommentEntity> getReplies() {
    return replies;
  }

  public void setReplies(List<LessonCommentEntity> replies) {
    this.replies = replies;
  }
}
