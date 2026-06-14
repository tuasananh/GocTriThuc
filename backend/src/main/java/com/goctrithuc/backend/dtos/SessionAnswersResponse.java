package com.goctrithuc.backend.dtos;

import java.util.List;
import java.util.Map;

public record SessionAnswersResponse(Map<Long, List<Integer>> answers) {}
