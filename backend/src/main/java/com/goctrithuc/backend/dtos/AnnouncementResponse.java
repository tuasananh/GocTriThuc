package com.goctrithuc.backend.dtos;

import com.goctrithuc.backend.entities.Announcement;
import com.goctrithuc.backend.entities.User;
import java.time.ZonedDateTime;

public record AnnouncementResponse(
    Long id,
    Long courseId,
    PublicUserResponse author,
    String title,
    String content,
    ZonedDateTime createdAt,
    ZonedDateTime updatedAt) {
  public static AnnouncementResponse from(Announcement announcement, User author) {
    return new AnnouncementResponse(
        announcement.getId(),
        announcement.getCourse().getId(),
        author != null ? PublicUserResponse.from(author) : null,
        announcement.getTitle(),
        announcement.getContent(),
        announcement.getCreatedAt(),
        announcement.getUpdatedAt());
  }
}
