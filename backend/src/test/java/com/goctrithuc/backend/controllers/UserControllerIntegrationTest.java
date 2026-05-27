package com.goctrithuc.backend.controllers;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oauth2Login;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.goctrithuc.backend.BaseIntegrationTest;
import com.goctrithuc.backend.dtos.UpdateUserRequest;
import com.goctrithuc.backend.entities.User;
import com.goctrithuc.backend.entities.UserRole;
import com.goctrithuc.backend.repositories.RoleRepository;
import com.goctrithuc.backend.repositories.UserRepository;
import com.goctrithuc.backend.repositories.UserRoleRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

@AutoConfigureMockMvc
public class UserControllerIntegrationTest extends BaseIntegrationTest {

  private final MockMvc mockMvc;

  private final UserRepository userRepository;

  private final UserRoleRepository userRoleRepository;

  private final RoleRepository roleRepository;

  @Autowired
  public UserControllerIntegrationTest(
      MockMvc mockMvc,
      UserRepository userRepository,
      UserRoleRepository userRoleRepository,
      RoleRepository roleRepository) {
    this.mockMvc = mockMvc;
    this.userRepository = userRepository;
    this.userRoleRepository = userRoleRepository;
    this.roleRepository = roleRepository;
  }

  @AfterEach
  void cleanUp() {
    userRoleRepository.deleteAll();
    userRepository.deleteAll();
  }

  @Test
  void shouldReturnUserInfoWhenUserExistsInDatabase() throws Exception {
    String email = "talent@hust.edu.vn";
    User user = new User(email, "John Doe", "johndoe", "http://example.com/avatar.jpg");

    User savedUser = userRepository.save(user);
    var studentRole = roleRepository.findByName("student");
    assert studentRole.isPresent();
    UserRole userRole = new UserRole(savedUser, studentRole.get());
    userRoleRepository.save(userRole);

    mockMvc
        .perform(
            get("/api/users/me").with(oauth2Login().attributes(attrs -> attrs.put("email", email))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.authenticated").value(true))
        .andExpect(jsonPath("$.username").value("johndoe"))
        .andExpect(jsonPath("$.email").value(email))
        .andExpect(jsonPath("$.roles[0]").value("student"))
        .andExpect(jsonPath("$.avatarUrl").value("http://example.com/avatar.jpg"))
        .andExpect(jsonPath("$.permissions").value(studentRole.get().getPermissions()))
        .andDo(print());
  }

  @Test
  void shouldReturnPublicProfileWhenUserExists() throws Exception {
    User user =
        new User(
            "public@hust.edu.vn", "Public User", "publicuser", "http://example.com/avatar.jpg");
    User saved = userRepository.save(user);

    mockMvc
        .perform(get("/api/users/" + saved.getId()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(saved.getId()))
        .andExpect(jsonPath("$.displayName").value("Public User"))
        .andExpect(jsonPath("$.username").value("publicuser"))
        .andExpect(jsonPath("$.avatarUrl").value("http://example.com/avatar.jpg"))
        .andDo(print());
  }

  @Test
  void shouldUpdateProfileWhenUserIsAuthorized() throws Exception {
    String email = "update@hust.edu.vn";
    User user = new User(email, "Old Name", "oldusername", "http://example.com/old.jpg");
    User saved = userRepository.save(user);

    UpdateUserRequest request =
        new UpdateUserRequest("New Name", "newusername", "http://example.com/new.jpg");
    String requestBody =
        new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(request);

    mockMvc
        .perform(
            org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch(
                    "/api/users/me")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", email)))
                .with(csrf())
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .content(requestBody))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(saved.getId()))
        .andExpect(jsonPath("$.displayName").value("New Name"))
        .andExpect(jsonPath("$.username").value("newusername"))
        .andExpect(jsonPath("$.avatarUrl").value("http://example.com/new.jpg"))
        .andDo(print());
  }

  @Test
  void shouldRejectProfileUpdateWhenUserIsUnauthorized() throws Exception {
    User user1 = userRepository.save(new User("user1@hust.edu.vn", "User One", "userone", null));
    User user2 = userRepository.save(new User("user2@hust.edu.vn", "User Two", "usertwo", null));

    UpdateUserRequest request = new UpdateUserRequest("Hacked Name", "hacked", null);
    String requestBody =
        new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(request);

    mockMvc
        .perform(
            org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch(
                    "/api/users/" + user1.getId())
                .with(oauth2Login().attributes(attrs -> attrs.put("email", user2.getEmail())))
                .with(csrf())
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .content(requestBody))
        .andExpect(status().isForbidden())
        .andDo(print());
  }

  @Test
  void shouldRejectProfileUpdateWhenUsernameIsTaken() throws Exception {
    String email = "user3@hust.edu.vn";
    User user3 = userRepository.save(new User(email, "User Three", "userthree", null));
    userRepository.save(new User("taken@hust.edu.vn", "Taken User", "takenusername", null));

    UpdateUserRequest request = new UpdateUserRequest("User Three", "takenusername", null);
    String requestBody =
        new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(request);

    mockMvc
        .perform(
            org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch(
                    "/api/users/me")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", email)))
                .with(csrf())
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .content(requestBody))
        .andExpect(status().isConflict())
        .andDo(print());
  }

  @Test
  void shouldUpdateProfileWhenUserIsSelf() throws Exception {
    String email = "student@hust.edu.vn";
    User student = userRepository.save(new User(email, "Student Name", "studentusername", null));

    UpdateUserRequest request = new UpdateUserRequest("Self Name", "selfusername", null);
    String requestBody =
        new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(request);

    mockMvc
        .perform(
            org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch(
                    "/api/users/" + student.getId())
                .with(oauth2Login().attributes(attrs -> attrs.put("email", email)))
                .with(csrf())
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .content(requestBody))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(student.getId()))
        .andExpect(jsonPath("$.displayName").value("Self Name"))
        .andExpect(jsonPath("$.username").value("selfusername"))
        .andDo(print());
  }

  @Test
  void shouldRejectProfileUpdateWhenAdminTriesToUpdateOtherUser() throws Exception {
    User student =
        userRepository.save(
            new User("student@hust.edu.vn", "Student Name", "studentusername", null));

    String adminEmail = "admin@goctrithuc.com";
    User admin = userRepository.save(new User(adminEmail, "Admin User", "adminuser", null));

    UpdateUserRequest request = new UpdateUserRequest("Moderated Name", "moderateduser", null);
    String requestBody =
        new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(request);

    mockMvc
        .perform(
            org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch(
                    "/api/users/" + student.getId())
                .with(oauth2Login().attributes(attrs -> attrs.put("email", adminEmail)))
                .with(csrf())
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .content(requestBody))
        .andExpect(status().isForbidden())
        .andDo(print());
  }

  @Test
  void shouldUpdateCurrentUser() throws Exception {
    String email = "me@hust.edu.vn";
    User user =
        userRepository.save(
            new User(email, "Me Original", "meusername", "http://example.com/me.jpg"));

    UpdateUserRequest request =
        new UpdateUserRequest("Me New Name", "menewusername", "http://example.com/menew.jpg");
    String requestBody =
        new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(request);

    mockMvc
        .perform(
            org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch(
                    "/api/users/me")
                .with(oauth2Login().attributes(attrs -> attrs.put("email", email)))
                .with(csrf())
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .content(requestBody))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(user.getId()))
        .andExpect(jsonPath("$.displayName").value("Me New Name"))
        .andExpect(jsonPath("$.username").value("menewusername"))
        .andExpect(jsonPath("$.avatarUrl").value("http://example.com/menew.jpg"))
        .andDo(print());
  }
}
