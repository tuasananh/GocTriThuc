package com.goctrithuc.backend.dtos;

import java.time.ZonedDateTime;

public record AccessRequestResponse(
    Long userId, Long courseId, String userDisplayName, ZonedDateTime requestedAt) {}
