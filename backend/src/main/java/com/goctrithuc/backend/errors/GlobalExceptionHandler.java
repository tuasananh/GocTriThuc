package com.goctrithuc.backend.errors;

import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.jspecify.annotations.NonNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

  private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

  @ExceptionHandler(ResponseStatusException.class)
  public ResponseEntity<Object> handleResponseStatus(
          ResponseStatusException ex, HttpServletRequest request) {
    return ResponseEntity.status(ex.getStatusCode())
            .body(body(ex.getStatusCode().value(),
                    ex.getReason() != null ? ex.getReason() : "Unknown error",
                    request.getRequestURI()));
  }

  @ExceptionHandler(AccessDeniedException.class)
  public ResponseEntity<Object> handleAccessDenied(
          HttpServletRequest request) {
    return ResponseEntity.status(403)
            .body(body(403, "Access denied", request.getRequestURI()));
  }

  // Last-resort: Specifically, NOT Exception.class — leave framework
  // exceptions to ResponseEntityExceptionHandler's mappings.
  @ExceptionHandler(RuntimeException.class)
  public ResponseEntity<Object> handleUnexpected(
          RuntimeException ex, HttpServletRequest request) {
    log.error("Unhandled exception at {}: {}", request.getRequestURI(), ex.getMessage(), ex);
    return ResponseEntity.status(500)
            .body(body(500, "Internal server error", request.getRequestURI()));
  }

  // Override the parent's hook so framework-mapped responses use our body shape.
  @Override
  protected ResponseEntity<Object> handleExceptionInternal(
          Exception ex, Object providedBody, @NonNull HttpHeaders headers,
          HttpStatusCode status, @NonNull WebRequest request) {
    String path = (request instanceof ServletWebRequest swr)
            ? swr.getRequest().getRequestURI() : "";
    Map<String, Object> b = body(status.value(),
            ex.getMessage() != null ? ex.getMessage() : "Request error", path);

    // Attach field errors for @Valid failures.
    if (ex instanceof MethodArgumentNotValidException manve) {
      List<Map<String, String>> fieldErrors = manve.getBindingResult()
              .getFieldErrors().stream()
              .map(fe -> Map.of(
                      "field", fe.getField(),
                      "message", fe.getDefaultMessage() != null ? fe.getDefaultMessage() : "invalid"))
              .toList();
      b.put("fieldErrors", fieldErrors);
    }
    return ResponseEntity.status(status).headers(headers).body(b);
  }

  private static Map<String, Object> body(int status, String error, String path) {
    Map<String, Object> b = new HashMap<>();
    b.put("status", status);
    b.put("error", error);
    b.put("path", path);
    return b;
  }
}