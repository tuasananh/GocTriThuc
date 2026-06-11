package com.goctrithuc.backend.controllers;

import com.goctrithuc.backend.dtos.AdminUserResponse;
import com.goctrithuc.backend.services.AdminUserService;
import java.util.Map;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("@permissionService.isAdmin(#principal)")
public class AdminUserController {

  private final AdminUserService adminUserService;

  public AdminUserController(AdminUserService adminUserService) {
    this.adminUserService = adminUserService;
  }

  @GetMapping
  public ResponseEntity<Page<AdminUserResponse>> listUsers(
      @AuthenticationPrincipal OAuth2User principal,
      @PageableDefault(size = 20) Pageable pageable) {
    Page<AdminUserResponse> users = adminUserService.listUsers(pageable);
    return ResponseEntity.ok(users);
  }

  @PutMapping("/{id}/role")
  public ResponseEntity<Void> updateUserRole(
      @PathVariable("id") Long id,
      @RequestBody Map<String, String> body,
      @AuthenticationPrincipal OAuth2User principal) {
    String roleName = body.get("role");
    adminUserService.updateUserRole(id, roleName);
    return ResponseEntity.noContent().build();
  }
}
