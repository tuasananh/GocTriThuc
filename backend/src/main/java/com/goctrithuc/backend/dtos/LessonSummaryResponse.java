package com.goctrithuc.backend.dtos;

import com.goctrithuc.backend.entities.LessonType;

public record LessonSummaryResponse(Long id, String title, LessonType type, Integer order) {}
