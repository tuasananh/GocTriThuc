package com.goctrithuc.backend.entities;

import jakarta.persistence.*;
import java.time.ZonedDateTime;
import org.hibernate.annotations.Generated;

@Entity
@Table(name = "lesson_videos")
public class LessonVideoEntity {

  @Id private Long id;

  @OneToOne(fetch = FetchType.LAZY)
  @MapsId
  @JoinColumn(name = "id")
  private LessonEntity lesson;

  @Column(nullable = false)
  private VideoProvider provider; // VideoProviderJpaConverter autoApply is true

  @Column(name = "provider_value", nullable = false)
  private String providerValue;

  @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
  @Generated
  private ZonedDateTime createdAt;

  @Column(name = "updated_at", nullable = false, insertable = false)
  @Generated
  private ZonedDateTime updatedAt;

  protected LessonVideoEntity() {}

  public LessonVideoEntity(LessonEntity lesson, VideoProvider provider, String providerValue) {
    this.lesson = lesson;
    this.provider = provider;
    this.providerValue = providerValue;
  }

  public Long getId() {
    return id;
  }

  public LessonEntity getLesson() {
    return lesson;
  }

  public void setLesson(LessonEntity lesson) {
    this.lesson = lesson;
  }

  public VideoProvider getProvider() {
    return provider;
  }

  public void setProvider(VideoProvider provider) {
    this.provider = provider;
  }

  public String getProviderValue() {
    return providerValue;
  }

  public void setProviderValue(String providerValue) {
    this.providerValue = providerValue;
  }

  public ZonedDateTime getCreatedAt() {
    return createdAt;
  }

  public ZonedDateTime getUpdatedAt() {
    return updatedAt;
  }
}
