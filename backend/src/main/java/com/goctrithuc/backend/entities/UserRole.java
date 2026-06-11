package com.goctrithuc.backend.entities;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;
import java.time.ZonedDateTime;
import org.hibernate.annotations.Generated;

@Entity
@Table(name = "user_role")
public class UserRole {

  @EmbeddedId private UserRoleId id;

  @ManyToOne(fetch = FetchType.LAZY)
  @MapsId("userId")
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @ManyToOne(fetch = FetchType.LAZY)
  @MapsId("roleName")
  @JoinColumn(name = "role_name", nullable = false)
  private Role role;

  @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
  @Generated
  private ZonedDateTime createdAt;

  @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
  @Generated
  private ZonedDateTime updatedAt;

  protected UserRole() {}

  public UserRole(User user, Role role) {
    this.user = user;
    this.role = role;
    this.id = new UserRoleId(user.getId(), role.getName());
  }

  public UserRoleId getId() {
    return id;
  }

  public User getUser() {
    return user;
  }

  public Role getRole() {
    return role;
  }
}
