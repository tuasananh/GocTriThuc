package com.goctrithuc.backend.controllers;

import com.goctrithuc.backend.common.AuthUtils;
import com.goctrithuc.backend.dtos.*;
import com.goctrithuc.backend.repositories.UserRepository;
import com.goctrithuc.backend.services.LessonService;
import com.goctrithuc.backend.services.ModuleService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/modules")
public class ModuleController {

  private final ModuleService moduleService;
  private final LessonService lessonService;
  private final UserRepository userRepository;

  public ModuleController(
      ModuleService moduleService, LessonService lessonService, UserRepository userRepository) {
    this.moduleService = moduleService;
    this.lessonService = lessonService;
    this.userRepository = userRepository;
  }

  // PUT /api/modules/{id}
  @PutMapping("/{id}")
  @PreAuthorize(
      "@permissionService.hasPermission(#principal, T(com.goctrithuc.backend.common.PermissionConstants).MANAGE_OWN_COURSES)")
  public ResponseEntity<ModuleResponse> updateModule(
      @PathVariable Long id,
      @Valid @RequestBody UpdateModuleRequest req,
      @AuthenticationPrincipal OAuth2User principal) {
    Long userId = AuthUtils.getCurrentUserId(principal, userRepository);
    ModuleResponse res = moduleService.updateModule(id, req, userId);
    return ResponseEntity.ok(res);
  }

  // DELETE /api/modules/{id}
  @DeleteMapping("/{id}")
  @PreAuthorize(
      "@permissionService.hasPermission(#principal, T(com.goctrithuc.backend.common.PermissionConstants).MANAGE_OWN_COURSES)")
  public ResponseEntity<Void> deleteModule(
      @PathVariable Long id, @AuthenticationPrincipal OAuth2User principal) {
    Long userId = AuthUtils.getCurrentUserId(principal, userRepository);
    moduleService.deleteModule(id, userId);
    return ResponseEntity.noContent().build();
  }

  // PATCH /api/modules/{id}/order
  @PatchMapping("/{id}/order")
  @PreAuthorize(
      "@permissionService.hasPermission(#principal, T(com.goctrithuc.backend.common.PermissionConstants).MANAGE_OWN_COURSES)")
  public ResponseEntity<Void> reorderModule(
      @PathVariable Long id,
      @Valid @RequestBody ReorderRequest req,
      @AuthenticationPrincipal OAuth2User principal) {
    Long userId = AuthUtils.getCurrentUserId(principal, userRepository);
    moduleService.reorderModule(id, req.direction(), userId);
    return ResponseEntity.noContent().build();
  }

  // POST /api/modules/{moduleId}/lessons — Create new lesson inside module (SRS line 758)
  @PostMapping("/{moduleId}/lessons")
  @PreAuthorize(
      "@permissionService.hasPermission(#principal, T(com.goctrithuc.backend.common.PermissionConstants).MANAGE_OWN_COURSES)")
  public ResponseEntity<LessonSummaryResponse> createLesson(
      @PathVariable Long moduleId,
      @Valid @RequestBody CreateLessonRequest req,
      @AuthenticationPrincipal OAuth2User principal) {
    Long userId = AuthUtils.getCurrentUserId(principal, userRepository);
    LessonSummaryResponse res = lessonService.createLesson(moduleId, req, userId);
    return ResponseEntity.status(HttpStatus.CREATED).body(res);
  }
}
