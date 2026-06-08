package com.goctrithuc.backend.repositories;

import com.goctrithuc.backend.entities.TestSessionEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface TestSessionRepository extends JpaRepository<TestSessionEntity, Long> {
  Optional<TestSessionEntity> findByUserIdAndTestIdAndIsDoneFalse(Long userId, Long testId);

  boolean existsByUserIdAndTestIdAndIsDoneTrue(Long userId, Long testId);

  @Query(
      "SELECT ts FROM TestSessionEntity ts "
          + "JOIN FETCH ts.user "
          + "WHERE ts.test.id = :testId ORDER BY ts.createdAt DESC")
  List<TestSessionEntity> findWithUserByTestId(@Param("testId") Long testId);

  @Query(
      "SELECT ts FROM TestSessionEntity ts "
          + "JOIN FETCH ts.test t "
          + "JOIN FETCH t.lesson "
          + "WHERE ts.id = :sessionId")
  Optional<TestSessionEntity> findByIdWithTest(@Param("sessionId") Long sessionId);

  @Query(
      "SELECT ts FROM TestSessionEntity ts "
          + "JOIN FETCH ts.test t "
          + "JOIN FETCH t.lesson l "
          + "JOIN FETCH l.module m "
          + "JOIN FETCH m.course c "
          + "WHERE ts.user.id = :userId AND ts.isDone = true ORDER BY ts.submittedAt DESC")
  List<TestSessionEntity> findWithTestAndCourseByUserId(@Param("userId") Long userId);
}
