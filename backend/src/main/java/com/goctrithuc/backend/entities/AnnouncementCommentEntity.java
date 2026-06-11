package com.goctrithuc.backend.entities;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "announcement_comments")
public class AnnouncementCommentEntity extends BaseCommentEntity {

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "announcement_id", nullable = false)
  private Announcement announcement;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "parent_id")
  private AnnouncementCommentEntity parent;

  @OneToMany(mappedBy = "parent")
  @OrderBy("createdAt ASC")
  private List<AnnouncementCommentEntity> replies = new ArrayList<>();

  protected AnnouncementCommentEntity() {
    super();
  }

  public AnnouncementCommentEntity(
      User author, String content, Announcement announcement, AnnouncementCommentEntity parent) {
    super(author, content);
    this.announcement = announcement;
    this.parent = parent;
    if (parent != null) {
      parent.getReplies().add(this);
    }
  }

  public Announcement getAnnouncement() {
    return announcement;
  }

  public void setAnnouncement(Announcement announcement) {
    this.announcement = announcement;
  }

  public AnnouncementCommentEntity getParent() {
    return parent;
  }

  public void setParent(AnnouncementCommentEntity parent) {
    this.parent = parent;
  }

  public List<AnnouncementCommentEntity> getReplies() {
    return replies;
  }

  public void setReplies(List<AnnouncementCommentEntity> replies) {
    this.replies = replies;
  }
}
