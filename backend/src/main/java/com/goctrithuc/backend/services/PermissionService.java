package com.goctrithuc.backend.services;

import com.goctrithuc.backend.common.PermissionConstants;
import com.goctrithuc.backend.entities.User;
import com.goctrithuc.backend.entities.UserRole;
import com.goctrithuc.backend.repositories.UserRepository;
import java.util.Optional;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PermissionService {

  private final UserRepository userRepository;

  public PermissionService(UserRepository userRepository) {
    this.userRepository = userRepository;
  }

  @Transactional(readOnly = true)
  public boolean hasPermission(OAuth2User principal, long requiredBit) {
    Optional<Long> permissionsOpt = resolvePermissions(principal);
    if (permissionsOpt.isEmpty()) {
      return false;
    }
    long permissions = permissionsOpt.get();

    // Admin bypass check (0x01L is ADMIN)
    if ((permissions & PermissionConstants.ADMIN) != 0) {
      return true;
    }

    return (permissions & requiredBit) != 0;
  }

  @Transactional(readOnly = true)
  public boolean isAdmin(OAuth2User principal) {
    Optional<Long> permissionsOpt = resolvePermissions(principal);
    if (permissionsOpt.isEmpty()) {
      return false;
    }
    long permissions = permissionsOpt.get();

    return (permissions & PermissionConstants.ADMIN) != 0;
  }

  private Optional<Long> resolvePermissions(OAuth2User principal) {
    if (principal == null) {
      return Optional.empty();
    }

    Object emailObj = principal.getAttribute("email");
    if (emailObj == null) {
      return Optional.empty();
    }

    String email = emailObj.toString();
    Optional<User> userOpt = userRepository.findByEmailWithRoles(email);
    if (userOpt.isEmpty()) {
      return Optional.empty();
    }

    User user = userOpt.get();
    long permissions = resolvePermissions(user);
    return Optional.of(permissions);
  }

  public long resolvePermissions(User user) {
    if (user.getUserRoles() == null) {
      return 0L;
    }
    return user.getUserRoles().stream()
        .map(UserRole::getRole)
        .map(role -> role.getPermissions() == null ? 0L : role.getPermissions())
        .reduce(0L, (current, rolePerm) -> current | rolePerm);
  }

  public boolean isAdminFromUser(User user) {
    long permissions = resolvePermissions(user);
    return (permissions & PermissionConstants.ADMIN) != 0;
  }
}
