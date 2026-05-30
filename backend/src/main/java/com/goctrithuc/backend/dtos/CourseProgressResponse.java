package com.goctrithuc.backend.dtos;

public record CourseProgressResponse(long completedLessons, long totalLessons, int percent) {}
