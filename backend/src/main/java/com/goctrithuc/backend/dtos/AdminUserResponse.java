package com.goctrithuc.backend.dtos;

import com.goctrithuc.backend.entities.User;
import java.util.List;

public record AdminUserResponse(
    Long id,
    String email,
    String displayName,
    String username,
    String avatarUrl,
    List<String> roles) {
  public static AdminUserResponse from(User user) {
    List<String> roles =
        user.getUserRoles() != null
            ? user.getUserRoles().stream().map(ur -> ur.getRole().getName()).toList()
            : List.of();

    return new AdminUserResponse(
        user.getId(),
        user.getEmail(),
        user.getDisplayName(),
        user.getUsername(),
        user.getAvatarUrl(),
        roles);
  }
}
