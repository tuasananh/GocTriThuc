package com.goctrithuc.backend.repositories;

import com.goctrithuc.backend.entities.LessonVideoEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LessonVideoRepository extends JpaRepository<LessonVideoEntity, Long> {}
