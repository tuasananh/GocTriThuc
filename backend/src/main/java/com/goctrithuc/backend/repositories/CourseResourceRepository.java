package com.goctrithuc.backend.repositories;

import com.goctrithuc.backend.entities.CourseResourceEntity;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CourseResourceRepository extends JpaRepository<CourseResourceEntity, Long> {
  @EntityGraph(attributePaths = {"file"})
  List<CourseResourceEntity> findByCourseId(Long courseId);

  boolean existsByCourseIdAndFileId(Long courseId, Long fileId);
}
