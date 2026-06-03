package com.goctrithuc.backend.entities;

import jakarta.persistence.*;
import java.time.ZonedDateTime;

@Entity
@Table(name = "lessons")
public class LessonEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "module_id", nullable = false)
  private ModuleEntity module;

  @Column(nullable = false)
  private String title;

  @Column(name = "lesson_type", nullable = false)
  @Convert(converter = LessonTypeJpaConverter.class)
  private LessonType type;

  @Column(name = "\"order\"", nullable = false)
  private Integer order;

  @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
  private ZonedDateTime createdAt;

  @Column(name = "updated_at", nullable = false, insertable = false)
  private ZonedDateTime updatedAt;

  protected LessonEntity() {}

  public LessonEntity(ModuleEntity module, String title, LessonType type, Integer order) {
    this.module = module;
    this.title = title;
    this.type = type;
    this.order = order;
  }

  public Long getId() {
    return id;
  }

  public ModuleEntity getModule() {
    return module;
  }

  public void setModule(ModuleEntity module) {
    this.module = module;
  }

  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public LessonType getType() {
    return type;
  }

  public void setType(LessonType type) {
    this.type = type;
  }

  public Integer getOrder() {
    return order;
  }

  public void setOrder(Integer order) {
    this.order = order;
  }

  @OneToOne(
      mappedBy = "lesson",
      cascade = CascadeType.ALL,
      orphanRemoval = true,
      fetch = FetchType.LAZY)
  private LessonVideoEntity video;

  @OneToOne(
      mappedBy = "lesson",
      cascade = CascadeType.ALL,
      orphanRemoval = true,
      fetch = FetchType.LAZY)
  private LessonBlogEntity blog;

  @OneToOne(
      mappedBy = "lesson",
      cascade = CascadeType.ALL,
      orphanRemoval = true,
      fetch = FetchType.LAZY)
  private LessonTestEntity test;

  public ZonedDateTime getCreatedAt() {
    return createdAt;
  }

  public ZonedDateTime getUpdatedAt() {
    return updatedAt;
  }

  public LessonVideoEntity getVideo() {
    return video;
  }

  public void setVideo(LessonVideoEntity video) {
    this.video = video;
  }

  public LessonBlogEntity getBlog() {
    return blog;
  }

  public void setBlog(LessonBlogEntity blog) {
    this.blog = blog;
  }

  public LessonTestEntity getTest() {
    return test;
  }

  public void setTest(LessonTestEntity test) {
    this.test = test;
  }
}
