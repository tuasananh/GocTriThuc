package com.goctrithuc.backend.dtos;

import com.goctrithuc.backend.entities.AnnouncementCommentEntity;
import com.goctrithuc.backend.entities.LessonCommentEntity;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;

public record CommentResponse(
    Long id,
    String content,
    ZonedDateTime createdAt,
    ZonedDateTime updatedAt,
    ZonedDateTime editedAt,
    Long parentId,
    PublicUserResponse author,
    List<CommentResponse> replies) {
  public static CommentResponse from(LessonCommentEntity comment, List<CommentResponse> replies) {
    return new CommentResponse(
        comment.getId(),
        comment.getContent(),
        comment.getCreatedAt(),
        comment.getUpdatedAt(),
        comment.getEditedAt(),
        comment.getParent() != null ? comment.getParent().getId() : null,
        comment.getAuthor() != null ? PublicUserResponse.from(comment.getAuthor()) : null,
        replies != null ? replies : new ArrayList<>());
  }

  public static CommentResponse from(
      AnnouncementCommentEntity comment, List<CommentResponse> replies) {
    return new CommentResponse(
        comment.getId(),
        comment.getContent(),
        comment.getCreatedAt(),
        comment.getUpdatedAt(),
        comment.getEditedAt(),
        comment.getParent() != null ? comment.getParent().getId() : null,
        comment.getAuthor() != null ? PublicUserResponse.from(comment.getAuthor()) : null,
        replies != null ? replies : new ArrayList<>());
  }
}
