package com.goctrithuc.backend.repositories;

import com.goctrithuc.backend.entities.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
  // Spring automatically writes the SQL: SELECT * FROM users WHERE email = ?
  Optional<User> findByEmail(String email);
}
