package com.goctrithuc.backend.controllers;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
  @GetMapping("/is_authenticated")
  public boolean isAuthenticated(@AuthenticationPrincipal Object principal) {
    return principal != null;
  }
}
