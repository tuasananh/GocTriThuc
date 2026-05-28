package com.goctrithuc.backend.errors;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

/**
 * Lightweight global exception handler. Catches exceptions at the DispatcherServlet level so that
 * Spring Boot never forwards to /error (which Spring Security blocks for anonymous users, turning
 * every error into a misleading 401).
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

  private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

  /** Catches all ResponseStatusException thrown from services/controllers. */
  @ExceptionHandler(ResponseStatusException.class)
  public ResponseEntity<Map<String, Object>> handleResponseStatus(
      ResponseStatusException ex, HttpServletRequest request) {
    return ResponseEntity.status(ex.getStatusCode())
        .body(
            Map.of(
                "status", ex.getStatusCode().value(),
                "error", ex.getReason() != null ? ex.getReason() : "Unknown error",
                "path", request.getRequestURI()));
  }

  /** Catches AccessDeniedException from @PreAuthorize failures. */
  @ExceptionHandler(AccessDeniedException.class)
  public ResponseEntity<Map<String, Object>> handleAccessDenied(
      AccessDeniedException ex, HttpServletRequest request) {
    return ResponseEntity.status(403)
        .body(Map.of("status", 403, "error", "Access denied", "path", request.getRequestURI()));
  }

  /** Safety net — catches anything unexpected without leaking stack traces. */
  @ExceptionHandler(Exception.class)
  public ResponseEntity<Map<String, Object>> handleGeneric(
      Exception ex, HttpServletRequest request) {
    log.error("Unhandled exception at {}: {}", request.getRequestURI(), ex.getMessage(), ex);
    return ResponseEntity.status(500)
        .body(
            Map.of(
                "status", 500, "error", "Internal server error", "path", request.getRequestURI()));
  }
}
