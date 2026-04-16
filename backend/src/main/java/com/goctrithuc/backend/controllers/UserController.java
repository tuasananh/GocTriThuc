package com.goctrithuc.backend.controllers;

import java.util.Map;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {

  // Temporary endpoint to return the current user's info to the React frontend
  @GetMapping("/me")
  public Map<String, Object> getCurrentUser(@AuthenticationPrincipal OAuth2User principal) {
    if (principal == null) {
      return Map.of("authenticated", false);
    }

    // 1. Extract the attributes safely into variables
    Object nameObj = principal.getAttribute("name");
    Object emailObj = principal.getAttribute("email");
    Object avatarObj =
        principal.getAttribute("picture"); // Note: GitHub uses "avatar_url" instead of "picture"

    // 2. Convert to Strings with safe fallbacks (using the ternary operator)
    // Format: condition ? valueIfTrue : valueIfFalse
    String name = nameObj != null ? nameObj.toString() : "Anonymous User";
    String email = emailObj != null ? emailObj.toString() : "";
    String avatar = avatarObj != null ? avatarObj.toString() : "";

    return Map.of(
        "authenticated", true,
        "name", name,
        "email", email,
        "avatar", avatar);
  }
}
