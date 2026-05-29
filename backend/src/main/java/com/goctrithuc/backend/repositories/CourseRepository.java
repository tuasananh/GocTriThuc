package com.goctrithuc.backend.repositories;

import com.goctrithuc.backend.entities.Course;
import java.util.Optional;
import org.jspecify.annotations.NonNull;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface CourseRepository
    extends JpaRepository<Course, Long>, JpaSpecificationExecutor<Course> {

  @EntityGraph(attributePaths = {"author"})
  Optional<Course> findWithAuthorById(Long id);

  @Override
  @EntityGraph(attributePaths = {"author"})
  @NonNull Page<Course> findAll(@NonNull Specification<Course> spec, @NonNull Pageable pageable);
}
