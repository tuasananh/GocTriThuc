package com.goctrithuc.backend.dtos;

import java.time.ZonedDateTime;

public record EnrollmentResponse(Long userId, Long courseId, ZonedDateTime enrolledAt) {}
