package com.goctrithuc.backend.dtos;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.goctrithuc.backend.entities.Role;
import com.goctrithuc.backend.entities.User;
import com.goctrithuc.backend.entities.UserRole;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record CurrentUserResponse(
    boolean authenticated,
    Long id,
    String displayName,
    String email,
    String avatarUrl,
    String username,
    List<String> roles,
    @JsonFormat(shape = JsonFormat.Shape.STRING) Long permissions,
    String error) {
  public static CurrentUserResponse unauthenticated() {
    return new CurrentUserResponse(false, null, null, null, null, null, null, null, null);
  }

  public static CurrentUserResponse error(String error) {
    return new CurrentUserResponse(false, null, null, null, null, null, null, null, error);
  }

  public static CurrentUserResponse authenticated(User user) {
    var roles = user.getUserRoles().stream().map(UserRole::getRole).toList();

    Long permissions =
        roles.stream()
            .map(role -> role.getPermissions() == null ? 0L : role.getPermissions())
            .reduce(
                0L, (currentPermissions, rolePermissions) -> currentPermissions | rolePermissions);

    return new CurrentUserResponse(
        true,
        user.getId(),
        user.getDisplayName(),
        user.getEmail(),
        user.getAvatarUrl(),
        user.getUsername(),
        roles.stream().map(Role::getName).toList(),
        permissions,
        null);
  }
}
