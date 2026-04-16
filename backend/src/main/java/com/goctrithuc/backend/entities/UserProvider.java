package com.goctrithuc.backend.entities;

import jakarta.persistence.*;
import java.time.ZonedDateTime;

@Entity
@Table(
    name = "user_providers",
    uniqueConstraints = {@UniqueConstraint(columnNames = {"provider_name", "provider_user_id"})})
public class UserProvider {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @Column(name = "provider_name", nullable = false)
  private String providerName;

  @Column(name = "provider_user_id", nullable = false)
  private String providerUserId;

  @Column(name = "created_at", nullable = false, updatable = false, insertable = false)
  private ZonedDateTime createdAt;

  @Column(name = "updated_at", nullable = false, insertable = false)
  private ZonedDateTime updatedAt;

  protected UserProvider() {}

  public UserProvider(User user, String providerName, String providerUserId) {
    this.user = user;
    this.providerName = providerName;
    this.providerUserId = providerUserId;
  }
}
