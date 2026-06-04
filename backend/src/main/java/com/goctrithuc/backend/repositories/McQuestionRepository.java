package com.goctrithuc.backend.repositories;

import com.goctrithuc.backend.entities.McQuestionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface McQuestionRepository extends JpaRepository<McQuestionEntity, Long> {}
