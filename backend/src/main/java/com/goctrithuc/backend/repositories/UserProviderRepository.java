package com.goctrithuc.backend.repositories;

import com.goctrithuc.backend.entities.UserProvider;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserProviderRepository extends JpaRepository<UserProvider, Long> {
  Optional<UserProvider> findByProviderNameAndProviderUserId(
      String providerName, String providerUserId);
}
