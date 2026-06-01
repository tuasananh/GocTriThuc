package com.goctrithuc.backend.repositories;

import com.goctrithuc.backend.entities.LessonBlogEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LessonBlogRepository extends JpaRepository<LessonBlogEntity, Long> {}
