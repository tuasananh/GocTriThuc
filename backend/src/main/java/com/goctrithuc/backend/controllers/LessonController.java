package com.goctrithuc.backend.controllers;

import com.goctrithuc.backend.repositories.UserRepository;
import com.goctrithuc.backend.services.LessonCompletionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/lessons")
public class LessonController {

  private final LessonCompletionService lessonCompletionService;
  private final UserRepository userRepository;

  public LessonController(
      LessonCompletionService lessonCompletionService, UserRepository userRepository) {
    this.lessonCompletionService = lessonCompletionService;
    this.userRepository = userRepository;
  }

  @PostMapping("/{id}/complete")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<Void> toggleComplete(
      @PathVariable Long id, @AuthenticationPrincipal OAuth2User principal) {
    Long userId = getCurrentUserId(principal);
    lessonCompletionService.toggleCompletion(userId, id);
    return ResponseEntity.noContent().build();
  }

  private Long getCurrentUserId(OAuth2User principal) {
    if (principal == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
    }
    Object emailObj = principal.getAttribute("email");
    if (emailObj == null) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "Email missing in OAuth2 user attributes");
    }
    String email = emailObj.toString();
    return userRepository
        .findByEmail(email)
        .orElseThrow(
            () ->
                new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Authenticated user not found in database"))
        .getId();
  }
}
