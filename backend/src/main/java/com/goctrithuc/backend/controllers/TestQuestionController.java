package com.goctrithuc.backend.controllers;

import com.goctrithuc.backend.common.AuthUtils;
import com.goctrithuc.backend.dtos.AddQuestionToTestRequest;
import com.goctrithuc.backend.dtos.ReorderRequest;
import com.goctrithuc.backend.dtos.TestQuestionResponse;
import com.goctrithuc.backend.dtos.UpdateTestQuestionRequest;
import com.goctrithuc.backend.repositories.UserRepository;
import com.goctrithuc.backend.services.QuestionService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tests")
public class TestQuestionController {

  private final QuestionService questionService;
  private final UserRepository userRepository;

  public TestQuestionController(QuestionService questionService, UserRepository userRepository) {
    this.questionService = questionService;
    this.userRepository = userRepository;
  }

  @GetMapping("/{testId}/questions")
  @PreAuthorize(
      "@permissionService.hasPermission(#principal, T(com.goctrithuc.backend.common.PermissionConstants).ACCESS_TESTS)")
  public ResponseEntity<List<TestQuestionResponse>> getTestQuestions(
      @PathVariable Long testId, @AuthenticationPrincipal OAuth2User principal) {
    Long userId = AuthUtils.getCurrentUserId(principal, userRepository);
    List<TestQuestionResponse> res = questionService.getTestQuestions(testId, userId);
    return ResponseEntity.ok(res);
  }

  @PostMapping("/{testId}/questions")
  @PreAuthorize(
      "@permissionService.hasPermission(#principal, T(com.goctrithuc.backend.common.PermissionConstants).MANAGE_OWN_TESTS)")
  public ResponseEntity<TestQuestionResponse> addQuestionToTest(
      @PathVariable Long testId,
      @Valid @RequestBody AddQuestionToTestRequest req,
      @AuthenticationPrincipal OAuth2User principal) {
    Long userId = AuthUtils.getCurrentUserId(principal, userRepository);
    TestQuestionResponse res = questionService.addQuestionToTest(testId, req, userId);
    return ResponseEntity.status(HttpStatus.CREATED).body(res);
  }

  @DeleteMapping("/{testId}/questions/{questionId}")
  @PreAuthorize(
      "@permissionService.hasPermission(#principal, T(com.goctrithuc.backend.common.PermissionConstants).MANAGE_OWN_TESTS)")
  public ResponseEntity<Void> removeQuestionFromTest(
      @PathVariable Long testId,
      @PathVariable Long questionId,
      @AuthenticationPrincipal OAuth2User principal) {
    Long userId = AuthUtils.getCurrentUserId(principal, userRepository);
    questionService.removeQuestionFromTest(testId, questionId, userId);
    return ResponseEntity.noContent().build();
  }

  @PatchMapping("/{testId}/questions/{questionId}")
  @PreAuthorize(
      "@permissionService.hasPermission(#principal, T(com.goctrithuc.backend.common.PermissionConstants).MANAGE_OWN_TESTS)")
  public ResponseEntity<TestQuestionResponse> updateTestQuestion(
      @PathVariable Long testId,
      @PathVariable Long questionId,
      @Valid @RequestBody UpdateTestQuestionRequest req,
      @AuthenticationPrincipal OAuth2User principal) {
    Long userId = AuthUtils.getCurrentUserId(principal, userRepository);
    TestQuestionResponse res = questionService.updateTestQuestion(testId, questionId, req, userId);
    return ResponseEntity.ok(res);
  }

  @PatchMapping("/{testId}/questions/{questionId}/order")
  @PreAuthorize(
      "@permissionService.hasPermission(#principal, T(com.goctrithuc.backend.common.PermissionConstants).MANAGE_OWN_TESTS)")
  public ResponseEntity<Void> reorderTestQuestion(
      @PathVariable Long testId,
      @PathVariable Long questionId,
      @Valid @RequestBody ReorderRequest req,
      @AuthenticationPrincipal OAuth2User principal) {
    Long userId = AuthUtils.getCurrentUserId(principal, userRepository);
    questionService.reorderTestQuestion(testId, questionId, req.direction(), userId);
    return ResponseEntity.noContent().build();
  }
}
