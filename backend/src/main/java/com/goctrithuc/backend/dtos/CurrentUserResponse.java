package com.goctrithuc.backend.dtos;

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
    String error) {
  public static CurrentUserResponse unauthenticated() {
    return new CurrentUserResponse(false, null, null, null, null, null, null, null);
  }

  public static CurrentUserResponse error(String error) {
    return new CurrentUserResponse(false, null, null, null, null, null, null, error);
  }

  public static CurrentUserResponse authenticated(User user) {
    var roles = user.getUserRoles().stream().map(UserRole::getRole).toList();

    return new CurrentUserResponse(
        true,
        user.getId(),
        user.getDisplayName(),
        user.getEmail(),
        user.getAvatarUrl(),
        user.getUsername(),
        roles.stream().map(Role::getName).toList(),
        null);
  }
}
