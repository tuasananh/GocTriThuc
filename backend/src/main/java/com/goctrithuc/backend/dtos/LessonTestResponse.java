package com.goctrithuc.backend.dtos;

import java.util.Map;

public record LessonTestResponse(
    String statement, Integer timeLimit, Map<String, Object> settings) {}
