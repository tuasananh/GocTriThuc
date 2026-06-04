package com.goctrithuc.backend.controllers;

import com.goctrithuc.backend.common.AuthUtils;
import com.goctrithuc.backend.dtos.CreateQuestionRequest;
import com.goctrithuc.backend.dtos.QuestionResponse;
import com.goctrithuc.backend.dtos.UpdateQuestionRequest;
import com.goctrithuc.backend.repositories.UserRepository;
import com.goctrithuc.backend.services.QuestionService;
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
@RequestMapping("/api/questions")
public class QuestionController {

  private final QuestionService questionService;
  private final UserRepository userRepository;

  public QuestionController(QuestionService questionService, UserRepository userRepository) {
    this.questionService = questionService;
    this.userRepository = userRepository;
  }

  @PostMapping
  @PreAuthorize(
      "@permissionService.hasPermission(#principal, T(com.goctrithuc.backend.common.PermissionConstants).MANAGE_OWN_QUESTIONS)")
  public ResponseEntity<QuestionResponse> createQuestion(
      @Valid @RequestBody CreateQuestionRequest req,
      @AuthenticationPrincipal OAuth2User principal) {
    Long userId = AuthUtils.getCurrentUserId(principal, userRepository);
    QuestionResponse res = questionService.createQuestion(req, userId);
    return ResponseEntity.status(HttpStatus.CREATED).body(res);
  }

  @GetMapping
  @PreAuthorize(
      "@permissionService.hasPermission(#principal, T(com.goctrithuc.backend.common.PermissionConstants).MANAGE_OWN_QUESTIONS)")
  public ResponseEntity<Page<QuestionResponse>> listQuestions(
      @RequestParam(value = "search", required = false) String search,
      @PageableDefault Pageable pageable,
      @AuthenticationPrincipal OAuth2User principal) {
    Long userId = AuthUtils.getCurrentUserId(principal, userRepository);
    Page<QuestionResponse> res = questionService.listQuestions(search, pageable, userId);
    return ResponseEntity.ok(res);
  }

  @GetMapping("/{id}")
  @PreAuthorize(
      "@permissionService.hasPermission(#principal, T(com.goctrithuc.backend.common.PermissionConstants).MANAGE_OWN_QUESTIONS)")
  public ResponseEntity<QuestionResponse> getQuestion(
      @PathVariable Long id, @AuthenticationPrincipal OAuth2User principal) {
    Long userId = AuthUtils.getCurrentUserId(principal, userRepository);
    QuestionResponse res = questionService.getQuestion(id, userId);
    return ResponseEntity.ok(res);
  }

  @PutMapping("/{id}")
  @PreAuthorize(
      "@permissionService.hasPermission(#principal, T(com.goctrithuc.backend.common.PermissionConstants).MANAGE_OWN_QUESTIONS)")
  public ResponseEntity<QuestionResponse> updateQuestion(
      @PathVariable Long id,
      @Valid @RequestBody UpdateQuestionRequest req,
      @AuthenticationPrincipal OAuth2User principal) {
    Long userId = AuthUtils.getCurrentUserId(principal, userRepository);
    QuestionResponse res = questionService.updateQuestion(id, req, userId);
    return ResponseEntity.ok(res);
  }

  @DeleteMapping("/{id}")
  @PreAuthorize(
      "@permissionService.hasPermission(#principal, T(com.goctrithuc.backend.common.PermissionConstants).MANAGE_OWN_QUESTIONS)")
  public ResponseEntity<Void> deleteQuestion(
      @PathVariable Long id, @AuthenticationPrincipal OAuth2User principal) {
    Long userId = AuthUtils.getCurrentUserId(principal, userRepository);
    questionService.deleteQuestion(id, userId);
    return ResponseEntity.noContent().build();
  }
}
