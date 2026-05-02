package com.goctrithuc.backend.controllers;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oauth2Login;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.goctrithuc.backend.BaseIntegrationTest;
import com.goctrithuc.backend.entities.User;
import com.goctrithuc.backend.entities.UserRole;
import com.goctrithuc.backend.repositories.RoleRepository;
import com.goctrithuc.backend.repositories.UserRepository;
import com.goctrithuc.backend.repositories.UserRoleRepository;
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
}
