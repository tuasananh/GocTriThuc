package com.goctrithuc.backend.repositories;

import com.goctrithuc.backend.entities.LessonTestEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LessonTestRepository extends JpaRepository<LessonTestEntity, Long> {}
