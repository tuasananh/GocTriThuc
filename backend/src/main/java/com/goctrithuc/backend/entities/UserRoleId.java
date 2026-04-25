package com.goctrithuc.backend.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class UserRoleId implements Serializable {

  @Column(name = "user_id", nullable = false)
  private Long userId;

  @Column(name = "role_name", nullable = false)
  private String roleName;

  protected UserRoleId() {}

  public UserRoleId(Long userId, String roleName) {
    this.userId = userId;
    this.roleName = roleName;
  }

  public Long getUserId() {
    return userId;
  }

  public String getRoleName() {
    return roleName;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (!(o instanceof UserRoleId that)) {
      return false;
    }
    return Objects.equals(userId, that.userId) && Objects.equals(roleName, that.roleName);
  }

  @Override
  public int hashCode() {
    return Objects.hash(userId, roleName);
  }
}
