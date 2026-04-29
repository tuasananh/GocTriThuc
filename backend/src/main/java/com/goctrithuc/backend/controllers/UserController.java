package com.goctrithuc.backend.controllers;

import com.goctrithuc.backend.dtos.CurrentUserResponse;
import com.goctrithuc.backend.entities.UserRole;
import com.goctrithuc.backend.repositories.UserRepository;
import com.goctrithuc.backend.repositories.UserRoleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {
  private static final Logger logger = LoggerFactory.getLogger(UserController.class);
  private final UserRepository userRepository;
  private final UserRoleRepository userRoleRepository;

  public UserController(UserRepository userRepository, UserRoleRepository userRoleRepository) {
    this.userRepository = userRepository;
    this.userRoleRepository = userRoleRepository;
  }

  @GetMapping("/me")
  public ResponseEntity<CurrentUserResponse> getCurrentUser(
      @AuthenticationPrincipal OAuth2User principal) {
    if (principal == null) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
          .body(CurrentUserResponse.unauthenticated());
    }

    Object emailObj = principal.getAttribute("email");

    if (emailObj == null) {
      logger.warn("Email attribute is missing for the authenticated user.");
      return ResponseEntity.status(HttpStatus.BAD_REQUEST)
          .body(CurrentUserResponse.error("Email attribute is missing"));
    }

    String email = emailObj.toString();

    var user = userRepository.findByEmail(email);

    if (user.isEmpty()) {
      logger.warn("No user found in the database for email: {}", email);
      return ResponseEntity.status(HttpStatus.NOT_FOUND)
          .body(CurrentUserResponse.error("User not found in database"));
    }

    Long userId = user.get().getId();
    var userRoles = userRoleRepository.findAllByUserIdWithRole(userId);

    var roleNames = userRoles.stream().map(UserRole::getRole).map(role -> role.getName()).toList();
    Long permissions =
        userRoles.stream()
            .map(UserRole::getRole)
            .map(role -> role.getPermissions() == null ? 0L : role.getPermissions())
            .reduce(
                0L, (currentPermissions, rolePermissions) -> currentPermissions | rolePermissions);

    return ResponseEntity.ok(CurrentUserResponse.authenticated(user.get(), roleNames, permissions));
  }
}
