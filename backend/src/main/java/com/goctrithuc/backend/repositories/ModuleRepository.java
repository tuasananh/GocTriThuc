package com.goctrithuc.backend.repositories;

import com.goctrithuc.backend.entities.ModuleEntity;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ModuleRepository extends JpaRepository<ModuleEntity, Long> {
  @EntityGraph(attributePaths = {"lessons"})
  List<ModuleEntity> findByCourseIdOrderByOrderAsc(Long courseId);

  boolean existsByIdAndCourseId(Long id, Long courseId);
}
