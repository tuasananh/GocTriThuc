package com.goctrithuc.backend.controllers;

import com.goctrithuc.backend.repositories.UserRepository;
import java.util.Map;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {
  UserRepository userRepository;

  public UserController(UserRepository userRepository) {
    this.userRepository = userRepository;
  }

  // Temporary endpoint to return the current user's info to the React frontend
  @GetMapping("/me")
  public Map<String, Object> getCurrentUser(@AuthenticationPrincipal OAuth2User principal) {
    if (principal == null) {
      return Map.of("authenticated", false);
    }

    Object emailObj = principal.getAttribute("email");

    if (emailObj == null) {
      System.out.println("Warning: Email attribute is missing for the authenticated user.");
      return Map.of("authenticated", false, "error", "Email attribute is missing");
    }

    String email = emailObj.toString();

    var user = userRepository.findByEmail(email);

    if (user.isEmpty()) {
      System.out.println("Warning: No user found in the database for email: " + email);
      return Map.of("authenticated", false, "error", "User not found in database");
    }

    return Map.of(
        "authenticated",
        true,
        "displayName",
        user.get().getDisplayName(),
        "email",
        user.get().getEmail(),
        "avatarUrl",
        user.get().getAvatarUrl(),
        "username",
        user.get().getUsername());
  }
}
