package com.goctrithuc.backend.repositories;

import com.goctrithuc.backend.entities.EnrollmentEntity;
import com.goctrithuc.backend.entities.EnrollmentId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EnrollmentRepository extends JpaRepository<EnrollmentEntity, EnrollmentId> {
  boolean existsById(EnrollmentId id);

  void deleteById(EnrollmentId id);
}
