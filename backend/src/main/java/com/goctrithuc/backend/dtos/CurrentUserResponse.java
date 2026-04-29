package com.goctrithuc.backend.dtos;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.goctrithuc.backend.entities.User;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record CurrentUserResponse(
    boolean authenticated,
    String displayName,
    String email,
    String avatarUrl,
    String username,
    List<String> roles,
    @JsonFormat(shape = JsonFormat.Shape.STRING) Long permissions,
    String error) {
  public static CurrentUserResponse unauthenticated() {
    return new CurrentUserResponse(false, null, null, null, null, null, null, null);
  }

  public static CurrentUserResponse error(String error) {
    return new CurrentUserResponse(false, null, null, null, null, null, null, error);
  }

  public static CurrentUserResponse authenticated(User user, List<String> roles, Long permissions) {
    return new CurrentUserResponse(
        true,
        user.getDisplayName(),
        user.getEmail(),
        user.getAvatarUrl(),
        user.getUsername(),
        roles,
        permissions,
        null);
  }
}
