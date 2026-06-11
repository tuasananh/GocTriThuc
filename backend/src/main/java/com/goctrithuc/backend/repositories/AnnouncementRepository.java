package com.goctrithuc.backend.repositories;

import com.goctrithuc.backend.entities.Announcement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {
  Page<Announcement> findByCourseIdOrderByCreatedAtDesc(Long courseId, Pageable pageable);
}
