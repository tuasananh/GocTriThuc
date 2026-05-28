package com.goctrithuc.backend.dtos;

import com.goctrithuc.backend.entities.User;

public record PublicUserResponse(Long id, String displayName, String username, String avatarUrl) {
  public static PublicUserResponse from(User user) {
    return new PublicUserResponse(
        user.getId(), user.getDisplayName(), user.getUsername(), user.getAvatarUrl());
  }
}
