package com.goctrithuc.backend.dtos;

import static org.junit.jupiter.api.Assertions.*;

import com.goctrithuc.backend.entities.User;
import org.junit.jupiter.api.Test;

class PublicUserResponseTest {

  @Test
  void shouldMapUserToPublicUserResponse() {
    User user = new User("test@gmail.com", "Test User", "testuser", "http://avatar.url");

    PublicUserResponse response = PublicUserResponse.from(user);

    assertNotNull(response);
    assertEquals(user.getId(), response.id());
    assertEquals(user.getDisplayName(), response.displayName());
    assertEquals(user.getUsername(), response.username());
    assertEquals(user.getAvatarUrl(), response.avatarUrl());
  }
}
