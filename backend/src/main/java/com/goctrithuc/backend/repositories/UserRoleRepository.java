package com.goctrithuc.backend.repositories;

import com.goctrithuc.backend.entities.UserRole;
import com.goctrithuc.backend.entities.UserRoleId;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRoleRepository extends JpaRepository<UserRole, UserRoleId> {
  boolean existsByIdUserIdAndIdRoleName(Long userId, String roleName);

  @Query("select ur from UserRole ur join fetch ur.role where ur.user.id = :userId")
  List<UserRole> findAllByUserIdWithRole(@Param("userId") Long userId);
}
