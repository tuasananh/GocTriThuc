package com.goctrithuc.backend.controllers;

import com.goctrithuc.backend.common.AuthUtils;
import com.goctrithuc.backend.dtos.*;
import com.goctrithuc.backend.repositories.UserRepository;
import com.goctrithuc.backend.services.TestSessionService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class TestSessionController {

  private final TestSessionService testSessionService;
  private final UserRepository userRepository;

  public TestSessionController(
      TestSessionService testSessionService, UserRepository userRepository) {
    this.testSessionService = testSessionService;
    this.userRepository = userRepository;
  }

  @PostMapping("/tests/{testId}/sessions")
  @PreAuthorize(
      "@permissionService.hasPermission(#principal, T(com.goctrithuc.backend.common.PermissionConstants).ACCESS_TESTS)")
  public ResponseEntity<TestSessionResponse> startSession(
      @PathVariable Long testId, @AuthenticationPrincipal OAuth2User principal) {
    Long userId = AuthUtils.getCurrentUserId(principal, userRepository);
    TestSessionResponse res = testSessionService.startSession(testId, userId);
    if (res.isNew()) {
      return ResponseEntity.status(HttpStatus.CREATED).body(res);
    } else {
      return ResponseEntity.ok(res);
    }
  }

  @GetMapping("/tests/{testId}/sessions/active")
  @PreAuthorize(
      "@permissionService.hasPermission(#principal, T(com.goctrithuc.backend.common.PermissionConstants).ACCESS_TESTS)")
  public ResponseEntity<TestSessionResponse> getActiveSession(
      @PathVariable Long testId, @AuthenticationPrincipal OAuth2User principal) {
    Long userId = AuthUtils.getCurrentUserId(principal, userRepository);
    TestSessionResponse res = testSessionService.getActiveSession(testId, userId);
    return ResponseEntity.ok(res);
  }

  @GetMapping("/tests/{testId}/sessions")
  @PreAuthorize(
      "@permissionService.hasPermission(#principal, T(com.goctrithuc.backend.common.PermissionConstants).MANAGE_OWN_TESTS)")
  public ResponseEntity<List<TestSessionSummaryResponse>> listTestSessions(
      @PathVariable Long testId, @AuthenticationPrincipal OAuth2User principal) {
    Long userId = AuthUtils.getCurrentUserId(principal, userRepository);
    List<TestSessionSummaryResponse> res = testSessionService.listTestSessions(testId, userId);
    return ResponseEntity.ok(res);
  }

  @PutMapping("/sessions/{sessionId}/answers")
  @PreAuthorize(
      "@permissionService.hasPermission(#principal, T(com.goctrithuc.backend.common.PermissionConstants).ACCESS_TESTS)")
  public ResponseEntity<Void> saveAnswer(
      @PathVariable Long sessionId,
      @Valid @RequestBody SaveAnswerRequest req,
      @AuthenticationPrincipal OAuth2User principal) {
    Long userId = AuthUtils.getCurrentUserId(principal, userRepository);
    testSessionService.saveAnswer(sessionId, req, userId);
    return ResponseEntity.ok().build();
  }

  @PostMapping("/sessions/{sessionId}/submit")
  @PreAuthorize(
      "@permissionService.hasPermission(#principal, T(com.goctrithuc.backend.common.PermissionConstants).ACCESS_TESTS)")
  public ResponseEntity<TestResultResponse> submitSession(
      @PathVariable Long sessionId, @AuthenticationPrincipal OAuth2User principal) {
    Long userId = AuthUtils.getCurrentUserId(principal, userRepository);
    TestResultResponse res = testSessionService.submitSession(sessionId, userId);
    return ResponseEntity.ok(res);
  }

  @GetMapping("/sessions/{sessionId}/result")
  @PreAuthorize(
      "@permissionService.hasPermission(#principal, T(com.goctrithuc.backend.common.PermissionConstants).ACCESS_TESTS)")
  public ResponseEntity<TestResultResponse> getResult(
      @PathVariable Long sessionId, @AuthenticationPrincipal OAuth2User principal) {
    Long userId = AuthUtils.getCurrentUserId(principal, userRepository);
    TestResultResponse res = testSessionService.getResult(sessionId, userId);
    return ResponseEntity.ok(res);
  }

  @GetMapping("/tests/sessions/my")
  @PreAuthorize(
      "@permissionService.hasPermission(#principal, T(com.goctrithuc.backend.common.PermissionConstants).ACCESS_TESTS)")
  public ResponseEntity<Page<MyTestSessionResponse>> getMyTestSessions(
      @AuthenticationPrincipal OAuth2User principal,
      @PageableDefault(size = 20, sort = "submittedAt", direction = Sort.Direction.DESC)
          Pageable pageable) {
    Long userId = AuthUtils.getCurrentUserId(principal, userRepository);
    Page<MyTestSessionResponse> res = testSessionService.getMyTestSessions(userId, pageable);
    return ResponseEntity.ok(res);
  }
}
