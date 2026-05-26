package com.goctrithuc.backend.controllers;

import com.goctrithuc.backend.dtos.CurrentUserResponse;
import com.goctrithuc.backend.dtos.PublicUserResponse;
import com.goctrithuc.backend.dtos.UpdateUserRequest;
import com.goctrithuc.backend.entities.User;
import com.goctrithuc.backend.repositories.UserRepository;
import com.goctrithuc.backend.repositories.UserRoleRepository;
import com.goctrithuc.backend.services.UserPersistenceService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/users")
public class UserController {
  private static final Logger logger = LoggerFactory.getLogger(UserController.class);
  private final UserRepository userRepository;
  private final UserRoleRepository userRoleRepository;

  public UserController(
      UserRepository userRepository,
      UserRoleRepository userRoleRepository,
      UserPersistenceService userPersistenceService) {
    this.userRepository = userRepository;
    this.userRoleRepository = userRoleRepository;
    this.userPersistenceService = userPersistenceService;
  }

  private final UserPersistenceService userPersistenceService;

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

    var user = userRepository.findByEmailWithRoles(email);

    if (user.isEmpty()) {
      logger.warn("No user found in the database for email: {}", email);
      return ResponseEntity.status(HttpStatus.NOT_FOUND)
          .body(CurrentUserResponse.error("User not found in database"));
    }
    return ResponseEntity.ok(CurrentUserResponse.authenticated(user.get()));
  }

  @GetMapping("/{id}")
  public ResponseEntity<PublicUserResponse> getUser(@PathVariable Long id) {
    return userRepository
        .findById(id)
        .map(PublicUserResponse::from)
        .map(ResponseEntity::ok)
        .orElse(ResponseEntity.notFound().build());
  }

  @PatchMapping("/me")
  public ResponseEntity<PublicUserResponse> updateCurrentUser(
      @Valid @RequestBody UpdateUserRequest req, @AuthenticationPrincipal OAuth2User principal) {
    if (principal == null) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    Object emailObj = principal.getAttribute("email");
    if (emailObj == null) {
      return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
    }

    String email = emailObj.toString();
    User updated = userPersistenceService.updateCurrentUserProfile(email, req);
    return ResponseEntity.ok(PublicUserResponse.from(updated));
  }

  @PatchMapping("/{id}")
  public ResponseEntity<PublicUserResponse> updateUser(
      @PathVariable Long id,
      @Valid @RequestBody UpdateUserRequest req,
      @AuthenticationPrincipal OAuth2User principal) {
    if (principal == null) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    Object emailObj = principal.getAttribute("email");
    if (emailObj == null) {
      return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
    }

    String email = emailObj.toString();
    User currentUser =
        userRepository
            .findByEmail(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

    if (!currentUser.getId().equals(id)) {
      return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }

    User updated = userPersistenceService.updateProfile(id, req);
    return ResponseEntity.ok(PublicUserResponse.from(updated));
  }
}
