package com.goctrithuc.backend.repositories;

import com.goctrithuc.backend.entities.CourseAccessRequestEntity;
import com.goctrithuc.backend.entities.CourseAccessRequestId;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CourseAccessRequestRepository
    extends JpaRepository<CourseAccessRequestEntity, CourseAccessRequestId> {
  boolean existsByUserIdAndCourseId(Long userId, Long courseId);

  List<CourseAccessRequestEntity> findByCourseId(Long courseId);

  Optional<CourseAccessRequestEntity> findByUserIdAndCourseId(Long userId, Long courseId);

  void deleteByUserIdAndCourseId(Long userId, Long courseId);
}
