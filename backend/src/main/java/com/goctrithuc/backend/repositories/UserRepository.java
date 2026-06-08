package com.goctrithuc.backend.repositories;

import com.goctrithuc.backend.entities.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
  Optional<User> findByEmail(String email);

  @Query(
      "SELECT u FROM User u LEFT JOIN FETCH u.userRoles ur LEFT JOIN FETCH ur.role WHERE u.email = :email")
  Optional<User> findByEmailWithRoles(@Param("email") String email);

  boolean existsByUsername(String username);

  @Query("SELECT u.id FROM User u")
  Page<Long> findUserIds(org.springframework.data.domain.Pageable pageable);

  @Query(
      "SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.userRoles ur LEFT JOIN FETCH ur.role WHERE u.id IN :ids")
  List<User> findAllByIdsWithRoles(@Param("ids") List<Long> ids);
}
