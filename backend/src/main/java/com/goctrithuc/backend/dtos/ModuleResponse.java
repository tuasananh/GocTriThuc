package com.goctrithuc.backend.dtos;

import java.util.List;

public record ModuleResponse(
    Long id, String title, Integer order, List<LessonSummaryResponse> lessons) {}
