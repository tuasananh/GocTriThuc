package com.goctrithuc.backend.repositories;

import com.goctrithuc.backend.entities.TestSessionAnswerEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TestSessionAnswerRepository extends JpaRepository<TestSessionAnswerEntity, Long> {
  Optional<TestSessionAnswerEntity> findBySessionIdAndQuestionId(Long sessionId, Long questionId);

  List<TestSessionAnswerEntity> findBySessionId(Long sessionId);
}
