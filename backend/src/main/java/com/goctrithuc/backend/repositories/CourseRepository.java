package com.goctrithuc.backend.repositories;

import com.goctrithuc.backend.entities.Course;
import com.goctrithuc.backend.entities.CourseVisibility;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {

  @EntityGraph(attributePaths = {"author"})
  Optional<Course> findWithAuthorById(Long id);

  @Override
  @EntityGraph(attributePaths = {"author"})
  Page<Course> findAll(Pageable pageable);

  @EntityGraph(attributePaths = {"author"})
  Page<Course> findByTitleContainingIgnoreCase(String title, Pageable pageable);

  @EntityGraph(attributePaths = {"author"})
  Page<Course> findByVisibilityIn(List<CourseVisibility> visibilities, Pageable pageable);

  @EntityGraph(attributePaths = {"author"})
  Page<Course> findByTitleContainingIgnoreCaseAndVisibilityIn(
      String title, List<CourseVisibility> visibilities, Pageable pageable);

  @EntityGraph(attributePaths = {"author"})
  Page<Course> findByAuthorId(Long authorId, Pageable pageable);

  @EntityGraph(attributePaths = {"author"})
  Page<Course> findByTitleContainingIgnoreCaseAndAuthorId(
      String title, Long authorId, Pageable pageable);

  @EntityGraph(attributePaths = {"author"})
  Page<Course> findByVisibility(CourseVisibility visibility, Pageable pageable);

  @EntityGraph(attributePaths = {"author"})
  Page<Course> findByVisibilityAndAuthorId(
      CourseVisibility visibility, Long authorId, Pageable pageable);

  @EntityGraph(attributePaths = {"author"})
  Page<Course> findByTitleContainingIgnoreCaseAndVisibility(
      String title, CourseVisibility visibility, Pageable pageable);

  @EntityGraph(attributePaths = {"author"})
  Page<Course> findByTitleContainingIgnoreCaseAndVisibilityAndAuthorId(
      String title, CourseVisibility visibility, Long authorId, Pageable pageable);
}
