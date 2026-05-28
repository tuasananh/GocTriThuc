package com.goctrithuc.backend.dtos;

import static org.junit.jupiter.api.Assertions.*;

import com.goctrithuc.backend.entities.Role;
import com.goctrithuc.backend.entities.User;
import com.goctrithuc.backend.entities.UserRole;
import java.util.Set;
import org.junit.jupiter.api.Test;

class CurrentUserResponseTest {

  @Test
  void shouldReturnUnauthenticatedResponse() {
    CurrentUserResponse response = CurrentUserResponse.unauthenticated();

    assertNotNull(response);
    assertFalse(response.authenticated());
    assertNull(response.id());
    assertNull(response.displayName());
    assertNull(response.email());
    assertNull(response.avatarUrl());
    assertNull(response.username());
    assertNull(response.roles());
    assertNull(response.permissions());
    assertNull(response.error());
  }

  @Test
  void shouldReturnErrorResponse() {
    String errorMessage = "Some error occurred";
    CurrentUserResponse response = CurrentUserResponse.error(errorMessage);

    assertNotNull(response);
    assertFalse(response.authenticated());
    assertNull(response.id());
    assertEquals(errorMessage, response.error());
    assertNull(response.displayName());
  }

  @Test
  void shouldReturnAuthenticatedResponseWithCorrectRolesAndPermissions() {
    User user = new User("user@gmail.com", "User Name", "username", "http://avatar.jpg");

    Role role1 = new Role("student", 1L, "Student Role");
    Role role2 = new Role("editor", 2L, "Editor Role");

    UserRole userRole1 = new UserRole(user, role1);
    UserRole userRole2 = new UserRole(user, role2);

    user.setUserRoles(Set.of(userRole1, userRole2));

    CurrentUserResponse response = CurrentUserResponse.authenticated(user);

    assertNotNull(response);
    assertTrue(response.authenticated());
    assertEquals(user.getId(), response.id());
    assertEquals(user.getDisplayName(), response.displayName());
    assertEquals(user.getEmail(), response.email());
    assertEquals(user.getAvatarUrl(), response.avatarUrl());
    assertEquals(user.getUsername(), response.username());
    assertNull(response.error());

    assertNotNull(response.roles());
    assertEquals(2, response.roles().size());
    assertTrue(response.roles().contains("student"));
    assertTrue(response.roles().contains("editor"));

    // Permissions: 1L | 2L = 3L
    assertEquals(3L, response.permissions());
  }
}
