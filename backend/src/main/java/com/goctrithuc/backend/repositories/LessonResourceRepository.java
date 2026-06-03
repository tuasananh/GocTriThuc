package com.goctrithuc.backend.repositories;

import com.goctrithuc.backend.entities.LessonResourceEntity;
import com.goctrithuc.backend.entities.LessonResourceId;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LessonResourceRepository
    extends JpaRepository<LessonResourceEntity, LessonResourceId> {
  @EntityGraph(attributePaths = {"file"})
  List<LessonResourceEntity> findByLessonId(Long lessonId);

  boolean existsByLessonIdAndFileId(Long lessonId, Long fileId);
}
