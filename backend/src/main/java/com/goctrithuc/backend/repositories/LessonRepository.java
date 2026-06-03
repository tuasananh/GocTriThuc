package com.goctrithuc.backend.repositories;

import com.goctrithuc.backend.entities.LessonEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface LessonRepository extends JpaRepository<LessonEntity, Long> {
  List<LessonEntity> findByModuleIdOrderByOrderAsc(Long moduleId);

  boolean existsByIdAndModuleId(Long id, Long moduleId);

  long countByModuleCourseId(Long courseId);

  int countByModuleId(Long moduleId);

  @Query("SELECT COALESCE(MAX(l.order), -1) + 1 FROM LessonEntity l WHERE l.module.id = :moduleId")
  int findNextOrderByModuleId(@Param("moduleId") Long moduleId);
}
