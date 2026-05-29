package com.goctrithuc.backend.repositories;

import com.goctrithuc.backend.entities.LessonCompletionEntity;
import com.goctrithuc.backend.entities.LessonCompletionId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface LessonCompletionRepository
    extends JpaRepository<LessonCompletionEntity, LessonCompletionId> {
  boolean existsById(LessonCompletionId id);

  void deleteById(LessonCompletionId id);

  long countByLessonId(Long lessonId);

  @Query(
      "SELECT COUNT(lc) FROM LessonCompletionEntity lc "
          + "WHERE lc.id.userId = :userId "
          + "AND lc.id.lessonId IN "
          + "(SELECT l.id FROM LessonEntity l WHERE l.module.course.id = :courseId)")
  long countByUserIdAndCourseId(@Param("userId") Long userId, @Param("courseId") Long courseId);
}
