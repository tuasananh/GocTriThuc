package com.goctrithuc.backend.services;

import com.goctrithuc.backend.dtos.AdminUserResponse;
import com.goctrithuc.backend.entities.Role;
import com.goctrithuc.backend.entities.User;
import com.goctrithuc.backend.entities.UserRole;
import com.goctrithuc.backend.repositories.RoleRepository;
import com.goctrithuc.backend.repositories.UserRepository;
import com.goctrithuc.backend.repositories.UserRoleRepository;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AdminUserService {

  private final UserRepository userRepository;
  private final RoleRepository roleRepository;
  private final UserRoleRepository userRoleRepository;

  public AdminUserService(
      UserRepository userRepository,
      RoleRepository roleRepository,
      UserRoleRepository userRoleRepository) {
    this.userRepository = userRepository;
    this.roleRepository = roleRepository;
    this.userRoleRepository = userRoleRepository;
  }

  @Transactional(readOnly = true)
  public Page<AdminUserResponse> listUsers(Pageable pageable) {
    Page<Long> userIdsPage = userRepository.findUserIds(pageable);
    if (userIdsPage.isEmpty()) {
      return Page.empty();
    }

    List<Long> ids = userIdsPage.getContent();
    List<User> users = userRepository.findAllByIdsWithRoles(ids);

    // Sort to match the paginated order of userIdsPage
    List<AdminUserResponse> responses =
        ids.stream()
            .map(id -> users.stream().filter(u -> u.getId().equals(id)).findFirst().orElse(null))
            .filter(u -> u != null)
            .map(AdminUserResponse::from)
            .toList();

    return new PageImpl<>(responses, pageable, userIdsPage.getTotalElements());
  }

  @Transactional
  public void updateUserRole(Long targetUserId, String roleName) {
    User user =
        userRepository
            .findById(targetUserId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

    Role role =
        roleRepository
            .findByName(roleName)
            .orElseThrow(
                () ->
                    new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Role not found: " + roleName));

    List<UserRole> existingRoles = userRoleRepository.findAllByUserIdWithRole(targetUserId);
    userRoleRepository.deleteAll(existingRoles);

    UserRole newRole = new UserRole(user, role);
    userRoleRepository.save(newRole);
  }
}
