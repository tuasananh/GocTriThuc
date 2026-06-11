package com.goctrithuc.backend.entities;

import jakarta.persistence.*;
import java.time.ZonedDateTime;
import java.util.Set;
import org.hibernate.annotations.Generated;

@Entity
@Table(name = "users")
public class User {
  @Id
  // For Hibernate to not include ID when inserting, we use IDENTITY strategy
  // which relies on
  // the database to auto-generate the ID with a custom Snowflake ID generator.
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true)
  private String email;

  @Column(name = "display_name", nullable = false, unique = true)
  private String displayName;

  @Column(nullable = false, unique = true)
  private String username;

  @Column(name = "avatar_url")
  private String avatarUrl;

  @Column(name = "created_at", nullable = false, updatable = false, insertable = false)
  @Generated
  private ZonedDateTime createdAt;

  @Column(name = "updated_at", nullable = false, insertable = false)
  @Generated
  private ZonedDateTime updatedAt;

  @OneToMany(mappedBy = "user")
  private Set<UserRole> userRoles;

  protected User() {}

  public User(String email, String displayName, String username, String avatarUrl) {
    this.email = email;
    this.displayName = displayName;
    this.username = username;
    this.avatarUrl = avatarUrl;
  }

  public Long getId() {
    return id;
  }

  public String getEmail() {
    return email;
  }

  public String getDisplayName() {
    return displayName;
  }

  public String getUsername() {
    return username;
  }

  public String getAvatarUrl() {
    return avatarUrl;
  }

  public void setDisplayName(String displayName) {
    this.displayName = displayName;
  }

  public void setUsername(String username) {
    this.username = username;
  }

  public void setAvatarUrl(String avatarUrl) {
    this.avatarUrl = avatarUrl;
  }

  public Set<UserRole> getUserRoles() {
    return userRoles;
  }

  public void setUserRoles(Set<UserRole> userRoles) {
    this.userRoles = userRoles;
  }
}
