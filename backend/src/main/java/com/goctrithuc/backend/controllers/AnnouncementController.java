package com.goctrithuc.backend.controllers;

import com.goctrithuc.backend.common.AuthUtils;
import com.goctrithuc.backend.dtos.AnnouncementRequest;
import com.goctrithuc.backend.dtos.AnnouncementResponse;
import com.goctrithuc.backend.repositories.UserRepository;
import com.goctrithuc.backend.services.AnnouncementService;
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
@RequestMapping("/api/courses/{id}/announcements")
public class AnnouncementController {

  private final AnnouncementService announcementService;
  private final UserRepository userRepository;
  private final PermissionService permissionService;

  public AnnouncementController(
      AnnouncementService announcementService,
      UserRepository userRepository,
      PermissionService permissionService) {
    this.announcementService = announcementService;
    this.userRepository = userRepository;
    this.permissionService = permissionService;
  }

  @GetMapping
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<Page<AnnouncementResponse>> listAnnouncements(
      @PathVariable("id") Long courseId,
      @AuthenticationPrincipal OAuth2User principal,
      @PageableDefault(size = 20) Pageable pageable) {
    Long userId = AuthUtils.getCurrentUserId(principal, userRepository);
    boolean isAdmin = permissionService.isAdmin(principal);

    Page<AnnouncementResponse> responses =
        announcementService.getAnnouncements(courseId, userId, isAdmin, pageable);
    return ResponseEntity.ok(responses);
  }

  @PostMapping
  @PreAuthorize(
      "@permissionService.hasPermission(#principal, T(com.goctrithuc.backend.common.PermissionConstants).MANAGE_OWN_COURSES)")
  public ResponseEntity<AnnouncementResponse> createAnnouncement(
      @PathVariable("id") Long courseId,
      @Valid @RequestBody AnnouncementRequest request,
      @AuthenticationPrincipal OAuth2User principal) {
    Long authorId = AuthUtils.getCurrentUserId(principal, userRepository);
    boolean isAdmin = permissionService.isAdmin(principal);

    AnnouncementResponse response =
        announcementService.createAnnouncement(courseId, request, authorId, isAdmin);
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  @PutMapping("/{announcementId}")
  @PreAuthorize(
      "@permissionService.hasPermission(#principal, T(com.goctrithuc.backend.common.PermissionConstants).MANAGE_OWN_COURSES)")
  public ResponseEntity<AnnouncementResponse> updateAnnouncement(
      @PathVariable("id") Long courseId,
      @PathVariable("announcementId") Long announcementId,
      @Valid @RequestBody AnnouncementRequest request,
      @AuthenticationPrincipal OAuth2User principal) {
    Long userId = AuthUtils.getCurrentUserId(principal, userRepository);
    boolean isAdmin = permissionService.isAdmin(principal);

    AnnouncementResponse response =
        announcementService.updateAnnouncement(announcementId, request, userId, isAdmin);
    return ResponseEntity.ok(response);
  }

  @DeleteMapping("/{announcementId}")
  @PreAuthorize(
      "@permissionService.hasPermission(#principal, T(com.goctrithuc.backend.common.PermissionConstants).MANAGE_OWN_COURSES)")
  public ResponseEntity<Void> deleteAnnouncement(
      @PathVariable("id") Long courseId,
      @PathVariable("announcementId") Long announcementId,
      @AuthenticationPrincipal OAuth2User principal) {
    Long userId = AuthUtils.getCurrentUserId(principal, userRepository);
    boolean isAdmin = permissionService.isAdmin(principal);

    announcementService.deleteAnnouncement(announcementId, userId, isAdmin);
    return ResponseEntity.noContent().build();
  }
}
