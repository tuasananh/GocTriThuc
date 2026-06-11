package com.goctrithuc.backend.entities;

import jakarta.persistence.*;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.hibernate.annotations.Generated;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "courses")
public class Course {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private String title;

  @Column private String description;

  @Column(name = "thumbnail_url")
  private String thumbnailUrl;

  @Column(name = "is_published", nullable = false)
  private boolean isPublished;

  @Column(nullable = false, columnDefinition = "course_visibility")
  @Convert(converter = CourseVisibilityJpaConverter.class)
  private CourseVisibility visibility;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "author_id", nullable = false)
  private User author;

  @JdbcTypeCode(SqlTypes.JSON)
  private Map<String, Object> settings;

  @Column(name = "created_at", nullable = false, updatable = false, insertable = false)
  @Generated
  private ZonedDateTime createdAt;

  @Column(name = "updated_at", nullable = false, insertable = false)
  @Generated
  private ZonedDateTime updatedAt;

  @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true)
  @OrderBy("order ASC")
  private List<ModuleEntity> modules = new ArrayList<>();

  protected Course() {}

  public Course(
      String title,
      String description,
      String thumbnailUrl,
      boolean isPublished,
      CourseVisibility visibility,
      User author,
      Map<String, Object> settings) {
    this.title = title;
    this.description = description;
    this.thumbnailUrl = thumbnailUrl;
    this.isPublished = isPublished;
    this.visibility = visibility;
    this.author = author;
    this.settings = settings;
  }

  public Long getId() {
    return id;
  }

  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public String getThumbnailUrl() {
    return thumbnailUrl;
  }

  public void setThumbnailUrl(String thumbnailUrl) {
    this.thumbnailUrl = thumbnailUrl;
  }

  public boolean isPublished() {
    return isPublished;
  }

  public void setPublished(boolean published) {
    isPublished = published;
  }

  public CourseVisibility getVisibility() {
    return visibility;
  }

  public void setVisibility(CourseVisibility visibility) {
    this.visibility = visibility;
  }

  public User getAuthor() {
    return author;
  }

  public void setAuthor(User author) {
    this.author = author;
  }

  public Map<String, Object> getSettings() {
    return settings;
  }

  public void setSettings(Map<String, Object> settings) {
    this.settings = settings;
  }

  public ZonedDateTime getCreatedAt() {
    return createdAt;
  }

  public ZonedDateTime getUpdatedAt() {
    return updatedAt;
  }

  public List<ModuleEntity> getModules() {
    return modules;
  }

  public void setModules(List<ModuleEntity> modules) {
    this.modules = modules;
  }
}
