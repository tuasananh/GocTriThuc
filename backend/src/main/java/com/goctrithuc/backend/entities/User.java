package com.goctrithuc.backend.entities;

import jakarta.persistence.*;
import java.time.ZonedDateTime;

@Entity
@Table(name = "users")
public class User {
  @Id
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
  private ZonedDateTime createdAt;

  @Column(name = "updated_at", nullable = false, insertable = false)
  private ZonedDateTime updatedAt;

  protected User() {}

  public User(String email, String displayName, String username, String avatarUrl) {
    this.email = email;
    this.displayName = displayName;
    this.username = username;
    this.avatarUrl = avatarUrl;
  }
}
