package com.goctrithuc.backend.repositories;

import com.goctrithuc.backend.entities.TestQuestionEntity;
import com.goctrithuc.backend.entities.TestQuestionId;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface TestQuestionRepository extends JpaRepository<TestQuestionEntity, TestQuestionId> {
  List<TestQuestionEntity> findByTestIdOrderByOrderAsc(Long testId);

  @Query("SELECT MAX(tq.order) FROM TestQuestionEntity tq WHERE tq.id.testId = :testId")
  Optional<Integer> findMaxOrderByTestId(@Param("testId") Long testId);

  @Modifying
  @Query(
      "DELETE FROM TestQuestionEntity tq"
          + " WHERE tq.id.testId = :testId AND tq.id.questionId = :questionId")
  void deleteByTestIdAndQuestionId(
      @Param("testId") Long testId, @Param("questionId") Long questionId);

  boolean existsByTestIdAndQuestionId(Long testId, Long questionId);

  @Query(
      "SELECT tq, q, mc FROM TestQuestionEntity tq "
          + "JOIN QuestionEntity q ON tq.id.questionId = q.id "
          + "JOIN McQuestionEntity mc ON mc.id = q.id "
          + "WHERE tq.id.testId = :testId ORDER BY tq.order ASC")
  List<Object[]> findWithDetailsByTestId(@Param("testId") Long testId);
}
