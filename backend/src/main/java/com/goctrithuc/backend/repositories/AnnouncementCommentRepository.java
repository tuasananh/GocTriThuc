package com.goctrithuc.backend.repositories;

import com.goctrithuc.backend.entities.AnnouncementCommentEntity;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface AnnouncementCommentRepository
    extends JpaRepository<AnnouncementCommentEntity, Long> {

  Page<AnnouncementCommentEntity> findByAnnouncementIdAndParentIsNullOrderByCreatedAtDesc(
      Long announcementId, Pageable pageable);

  @Query(
      value =
          "WITH RECURSIVE comment_tree AS ("
              + "  SELECT id, parent_id, 1 as depth FROM announcement_comments WHERE id IN (:rootIds) "
              + "  UNION ALL "
              + "  SELECT child.id, child.parent_id, parent.depth + 1 "
              + "  FROM announcement_comments child "
              + "  JOIN comment_tree parent ON child.parent_id = parent.id "
              + "  WHERE parent.depth < 5 "
              + ") SELECT id FROM comment_tree",
      nativeQuery = true)
  List<Long> findDescendantIds(@Param("rootIds") List<Long> rootIds);

  @Query(
      value =
          "WITH RECURSIVE comment_tree AS ("
              + "  SELECT id, parent_id, 1 as depth FROM announcement_comments WHERE id = :rootId "
              + "  UNION ALL "
              + "  SELECT child.id, child.parent_id, parent.depth + 1 "
              + "  FROM announcement_comments child "
              + "  JOIN comment_tree parent ON child.parent_id = parent.id "
              + "  WHERE parent.depth < 5 "
              + ") SELECT id FROM comment_tree",
      nativeQuery = true)
  List<Long> findSubtreeIdsFromRoot(@Param("rootId") Long rootId);

  @Query(
      "SELECT DISTINCT c FROM AnnouncementCommentEntity c JOIN FETCH c.author LEFT JOIN FETCH c.parent WHERE c.id IN :ids")
  List<AnnouncementCommentEntity> findAllByIdsWithAuthor(@Param("ids") List<Long> ids);
}
