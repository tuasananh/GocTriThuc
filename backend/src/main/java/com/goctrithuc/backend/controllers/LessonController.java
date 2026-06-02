package com.goctrithuc.backend.controllers;

import com.goctrithuc.backend.common.AuthUtils;
import com.goctrithuc.backend.dtos.*;
import com.goctrithuc.backend.repositories.UserRepository;
import com.goctrithuc.backend.services.LessonCompletionService;
import com.goctrithuc.backend.services.LessonService;
import com.goctrithuc.backend.services.PermissionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/lessons")
public class LessonController {

  private final LessonCompletionService lessonCompletionService;
  private final UserRepository userRepository;
  private final LessonService lessonService;
  private final PermissionService permissionService;

  public LessonController(
      LessonCompletionService lessonCompletionService,
      UserRepository userRepository,
      LessonService lessonService,
      PermissionService permissionService) {
    this.lessonCompletionService = lessonCompletionService;
    this.userRepository = userRepository;
    this.lessonService = lessonService;
    this.permissionService = permissionService;
  }

  // POST /api/lessons/{id}/complete
  @PostMapping("/{id}/complete")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<Void> toggleComplete(
      @PathVariable Long id, @AuthenticationPrincipal OAuth2User principal) {
    Long userId = AuthUtils.getCurrentUserId(principal, userRepository);
    lessonCompletionService.toggleCompletion(userId, id);
    return ResponseEntity.noContent().build();
  }

  // GET /api/lessons/{id} — Retrieve complete lesson detail with subtype content
  @GetMapping("/{id}")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<LessonDetailResponse> getLesson(
      @PathVariable Long id, @AuthenticationPrincipal OAuth2User principal) {
    Long userId = AuthUtils.getCurrentUserId(principal, userRepository);
    boolean isAdmin = permissionService.isAdmin(principal);
    LessonDetailResponse res = lessonService.getLessonDetail(id, userId, isAdmin);
    return ResponseEntity.ok(res);
  }

  // PUT /api/lessons/{id} — Edit lesson title
  @PutMapping("/{id}")
  @PreAuthorize(
      "@permissionService.hasPermission(#principal, T(com.goctrithuc.backend.common.PermissionConstants).MANAGE_OWN_COURSES)")
  public ResponseEntity<LessonSummaryResponse> updateLesson(
      @PathVariable Long id,
      @Valid @RequestBody UpdateLessonRequest req,
      @AuthenticationPrincipal OAuth2User principal) {
    Long userId = AuthUtils.getCurrentUserId(principal, userRepository);
    LessonSummaryResponse res = lessonService.updateLesson(id, req, userId);
    return ResponseEntity.ok(res);
  }

  // DELETE /api/lessons/{id} — Hard delete lesson
  @DeleteMapping("/{id}")
  @PreAuthorize(
      "@permissionService.hasPermission(#principal, T(com.goctrithuc.backend.common.PermissionConstants).MANAGE_OWN_COURSES)")
  public ResponseEntity<Void> deleteLesson(
      @PathVariable Long id, @AuthenticationPrincipal OAuth2User principal) {
    Long userId = AuthUtils.getCurrentUserId(principal, userRepository);
    lessonService.deleteLesson(id, userId);
    return ResponseEntity.noContent().build();
  }

  // PATCH /api/lessons/{id}/order — Reorder lesson up/down
  @PatchMapping("/{id}/order")
  @PreAuthorize(
      "@permissionService.hasPermission(#principal, T(com.goctrithuc.backend.common.PermissionConstants).MANAGE_OWN_COURSES)")
  public ResponseEntity<Void> reorderLesson(
      @PathVariable Long id,
      @Valid @RequestBody ReorderRequest req,
      @AuthenticationPrincipal OAuth2User principal) {
    Long userId = AuthUtils.getCurrentUserId(principal, userRepository);
    lessonService.reorderLesson(id, req.direction(), userId);
    return ResponseEntity.noContent().build();
  }

  // --- ENDPOINTS CẬP NHẬT CHI TIẾT SUBTYPE BÀI HỌC ---

  // PUT /api/lessons/{id}/video — Cập nhật link video YouTube/Vimeo
  @PutMapping("/{id}/video")
  @PreAuthorize(
      "@permissionService.hasPermission(#principal, T(com.goctrithuc.backend.common.PermissionConstants).MANAGE_OWN_COURSES)")
  public ResponseEntity<Void> updateVideoContent(
      @PathVariable Long id,
      @Valid @RequestBody UpdateLessonVideoRequest req,
      @AuthenticationPrincipal OAuth2User principal) {
    Long userId = AuthUtils.getCurrentUserId(principal, userRepository);
    lessonService.updateLessonVideo(id, req, userId);
    return ResponseEntity.noContent().build();
  }

  // PUT /api/lessons/{id}/blog — Cập nhật nội dung HTML của Blog (Được lọc bảo mật Jsoup)
  @PutMapping("/{id}/blog")
  @PreAuthorize(
      "@permissionService.hasPermission(#principal, T(com.goctrithuc.backend.common.PermissionConstants).MANAGE_OWN_COURSES)")
  public ResponseEntity<Void> updateBlogContent(
      @PathVariable Long id,
      @Valid @RequestBody UpdateLessonBlogRequest req,
      @AuthenticationPrincipal OAuth2User principal) {
    Long userId = AuthUtils.getCurrentUserId(principal, userRepository);
    lessonService.updateLessonBlog(id, req, userId);
    return ResponseEntity.noContent().build();
  }

  // PUT /api/lessons/{id}/test — Cập nhật cài đặt bài thi
  @PutMapping("/{id}/test")
  @PreAuthorize(
      "@permissionService.hasPermission(#principal, T(com.goctrithuc.backend.common.PermissionConstants).MANAGE_OWN_COURSES)")
  public ResponseEntity<Void> updateTestContent(
      @PathVariable Long id,
      @Valid @RequestBody UpdateLessonTestRequest req,
      @AuthenticationPrincipal OAuth2User principal) {
    Long userId = AuthUtils.getCurrentUserId(principal, userRepository);
    lessonService.updateLessonTest(id, req, userId);
    return ResponseEntity.noContent().build();
  }

  // POST /api/lessons/{id}/resources - Attach resource to lesson
  @PostMapping("/{id}/resources")
  @PreAuthorize(
      "@permissionService.hasPermission(#principal, T(com.goctrithuc.backend.common.PermissionConstants).MANAGE_OWN_COURSES)")
  public ResponseEntity<Void> attachResource(
      @PathVariable Long id,
      @Valid @RequestBody AttachResourceRequest req,
      @AuthenticationPrincipal OAuth2User principal) {
    Long userId = AuthUtils.getCurrentUserId(principal, userRepository);
    lessonService.attachResource(id, req.fileId(), userId);
    return ResponseEntity.status(HttpStatus.CREATED).build();
  }
}
