package com.goctrithuc.backend.entities;

import jakarta.persistence.*;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "modules")
public class ModuleEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "course_id", nullable = false)
  private Course course;

  @Column(nullable = false)
  private String title;

  @Column(name = "\"order\"", nullable = false)
  private Integer order;

  @OneToMany(mappedBy = "module", cascade = CascadeType.ALL, orphanRemoval = true)
  @OrderBy("\"order\" ASC")
  private List<LessonEntity> lessons = new ArrayList<>();

  @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
  private ZonedDateTime createdAt;

  @Column(name = "updated_at", nullable = false, insertable = false)
  private ZonedDateTime updatedAt;

  protected ModuleEntity() {}

  public ModuleEntity(Course course, String title, Integer order) {
    this.course = course;
    this.title = title;
    this.order = order;
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

  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public Integer getOrder() {
    return order;
  }

  public void setOrder(Integer order) {
    this.order = order;
  }

  public List<LessonEntity> getLessons() {
    return lessons;
  }

  public void setLessons(List<LessonEntity> lessons) {
    this.lessons = lessons;
  }

  public ZonedDateTime getCreatedAt() {
    return createdAt;
  }

  public ZonedDateTime getUpdatedAt() {
    return updatedAt;
  }
}
