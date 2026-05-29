package com.goctrithuc.backend.common;

import com.goctrithuc.backend.repositories.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.server.ResponseStatusException;

public class AuthUtils {

  private AuthUtils() {}

  public static Long getCurrentUserId(OAuth2User principal, UserRepository userRepository) {
    if (principal == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
    }
    Object emailObj = principal.getAttribute("email");
    if (emailObj == null) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "Email missing in OAuth2 user attributes");
    }
    String email = emailObj.toString();
    return userRepository
        .findByEmail(email)
        .orElseThrow(
            () ->
                new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Authenticated user not found in database"))
        .getId();
  }
}
