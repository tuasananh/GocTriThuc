package com.goctrithuc.backend.repositories;

import com.goctrithuc.backend.entities.CourseResourceEntity;
import com.goctrithuc.backend.entities.CourseResourceId;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CourseResourceRepository
    extends JpaRepository<CourseResourceEntity, CourseResourceId> {
  @EntityGraph(attributePaths = {"file"})
  List<CourseResourceEntity> findByCourseId(Long courseId);

  boolean existsByCourseIdAndFileId(Long courseId, Long fileId);
}
