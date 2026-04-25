package com.goctrithuc.backend.repositories;

import com.goctrithuc.backend.entities.UserRole;
import com.goctrithuc.backend.entities.UserRoleId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRoleRepository extends JpaRepository<UserRole, UserRoleId> {
  boolean existsByIdUserIdAndIdRoleName(Long userId, String roleName);
}
