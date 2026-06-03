package com.goctrithuc.backend.repositories;

import com.goctrithuc.backend.entities.QuestionEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface QuestionRepository extends JpaRepository<QuestionEntity, Long> {
  Page<QuestionEntity> findByAuthorId(Long authorId, Pageable pageable);

  @Query(
      "SELECT q FROM QuestionEntity q WHERE q.authorId = :authorId "
          + "AND LOWER(q.statement) LIKE LOWER(CONCAT('%', :search, '%'))")
  Page<QuestionEntity> findByAuthorIdAndSearch(
      @Param("authorId") Long authorId, @Param("search") String search, Pageable pageable);

  @Query(
      "SELECT q FROM QuestionEntity q WHERE LOWER(q.statement) LIKE LOWER(CONCAT('%', :search, '%'))")
  Page<QuestionEntity> findBySearch(@Param("search") String search, Pageable pageable);
}
