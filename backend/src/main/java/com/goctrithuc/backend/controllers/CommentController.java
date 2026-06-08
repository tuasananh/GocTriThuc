package com.goctrithuc.backend.controllers;

import com.goctrithuc.backend.common.AuthUtils;
import com.goctrithuc.backend.dtos.CommentRequest;
import com.goctrithuc.backend.dtos.CommentResponse;
import com.goctrithuc.backend.repositories.UserRepository;
import com.goctrithuc.backend.services.CommentService;
import com.goctrithuc.backend.services.PermissionService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class CommentController {

  private final CommentService commentService;
  private final UserRepository userRepository;
  private final PermissionService permissionService;

  public CommentController(
      CommentService commentService,
      UserRepository userRepository,
      PermissionService permissionService) {
    this.commentService = commentService;
    this.userRepository = userRepository;
    this.permissionService = permissionService;
  }

  // === LESSON COMMENTS ===

  @GetMapping("/lessons/{id}/comments")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<Page<CommentResponse>> listLessonComments(
      @PathVariable("id") Long lessonId,
      @AuthenticationPrincipal OAuth2User principal,
      @PageableDefault(size = 20) Pageable pageable) {
    Long userId = AuthUtils.getCurrentUserId(principal, userRepository);
    boolean isAdmin = permissionService.isAdmin(principal);
    Page<CommentResponse> responses =
        commentService.getLessonComments(lessonId, userId, isAdmin, pageable);
    return ResponseEntity.ok(responses);
  }

  @PostMapping("/lessons/{id}/comments")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<CommentResponse> createLessonComment(
      @PathVariable("id") Long lessonId,
      @Valid @RequestBody CommentRequest request,
      @AuthenticationPrincipal OAuth2User principal) {
    Long userId = AuthUtils.getCurrentUserId(principal, userRepository);
    boolean isAdmin = permissionService.isAdmin(principal);
    CommentResponse response =
        commentService.createLessonComment(lessonId, request, userId, isAdmin);
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  @GetMapping("/lessons/comments/{commentId}/thread")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<CommentResponse> getLessonCommentThread(
      @PathVariable("commentId") Long commentId, @AuthenticationPrincipal OAuth2User principal) {
    Long userId = AuthUtils.getCurrentUserId(principal, userRepository);
    boolean isAdmin = permissionService.isAdmin(principal);
    CommentResponse response = commentService.getLessonCommentThread(commentId, userId, isAdmin);
    return ResponseEntity.ok(response);
  }

  @PatchMapping("/lessons/comments/{commentId}")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<CommentResponse> updateLessonComment(
      @PathVariable("commentId") Long commentId,
      @Valid @RequestBody CommentRequest request,
      @AuthenticationPrincipal OAuth2User principal) {
    Long userId = AuthUtils.getCurrentUserId(principal, userRepository);
    CommentResponse response = commentService.updateLessonComment(commentId, request, userId);
    return ResponseEntity.ok(response);
  }

  @DeleteMapping("/lessons/comments/{commentId}")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<Void> deleteLessonComment(
      @PathVariable("commentId") Long commentId, @AuthenticationPrincipal OAuth2User principal) {
    Long userId = AuthUtils.getCurrentUserId(principal, userRepository);
    boolean isAdmin = permissionService.isAdmin(principal);
    commentService.deleteLessonComment(commentId, userId, isAdmin);
    return ResponseEntity.noContent().build();
  }

  // === ANNOUNCEMENT COMMENTS ===

  @GetMapping("/announcements/{id}/comments")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<Page<CommentResponse>> listAnnouncementComments(
      @PathVariable("id") Long announcementId,
      @AuthenticationPrincipal OAuth2User principal,
      @PageableDefault(size = 20) Pageable pageable) {
    Long userId = AuthUtils.getCurrentUserId(principal, userRepository);
    boolean isAdmin = permissionService.isAdmin(principal);
    Page<CommentResponse> responses =
        commentService.getAnnouncementComments(announcementId, userId, isAdmin, pageable);
    return ResponseEntity.ok(responses);
  }

  @PostMapping("/announcements/{id}/comments")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<CommentResponse> createAnnouncementComment(
      @PathVariable("id") Long announcementId,
      @Valid @RequestBody CommentRequest request,
      @AuthenticationPrincipal OAuth2User principal) {
    Long userId = AuthUtils.getCurrentUserId(principal, userRepository);
    boolean isAdmin = permissionService.isAdmin(principal);
    CommentResponse response =
        commentService.createAnnouncementComment(announcementId, request, userId, isAdmin);
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  @GetMapping("/announcements/comments/{commentId}/thread")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<CommentResponse> getAnnouncementCommentThread(
      @PathVariable("commentId") Long commentId, @AuthenticationPrincipal OAuth2User principal) {
    Long userId = AuthUtils.getCurrentUserId(principal, userRepository);
    boolean isAdmin = permissionService.isAdmin(principal);
    CommentResponse response =
        commentService.getAnnouncementCommentThread(commentId, userId, isAdmin);
    return ResponseEntity.ok(response);
  }

  @PatchMapping("/announcements/comments/{commentId}")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<CommentResponse> updateAnnouncementComment(
      @PathVariable("commentId") Long commentId,
      @Valid @RequestBody CommentRequest request,
      @AuthenticationPrincipal OAuth2User principal) {
    Long userId = AuthUtils.getCurrentUserId(principal, userRepository);
    CommentResponse response = commentService.updateAnnouncementComment(commentId, request, userId);
    return ResponseEntity.ok(response);
  }

  @DeleteMapping("/announcements/comments/{commentId}")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<Void> deleteAnnouncementComment(
      @PathVariable("commentId") Long commentId, @AuthenticationPrincipal OAuth2User principal) {
    Long userId = AuthUtils.getCurrentUserId(principal, userRepository);
    boolean isAdmin = permissionService.isAdmin(principal);
    commentService.deleteAnnouncementComment(commentId, userId, isAdmin);
    return ResponseEntity.noContent().build();
  }
}
