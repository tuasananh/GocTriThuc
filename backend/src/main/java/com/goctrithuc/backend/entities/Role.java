package com.goctrithuc.backend.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.ZonedDateTime;

@Entity
@Table(name = "roles")
public class Role {

  @Id
  @Column(nullable = false)
  private String name;

  @Column(nullable = false)
  private Long permissions;

  @Column private String description;

  @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
  private ZonedDateTime createdAt;

  @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
  private ZonedDateTime updatedAt;

  protected Role() {}

  public Role(String name, Long permissions, String description) {
    this.name = name;
    this.permissions = permissions;
    this.description = description;
  }

  public String getName() {
    return name;
  }

  public Long getPermissions() {
    return permissions;
  }

  public String getDescription() {
    return description;
  }
}
