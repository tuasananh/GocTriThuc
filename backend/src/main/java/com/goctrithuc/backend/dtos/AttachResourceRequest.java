package com.goctrithuc.backend.dtos;

import jakarta.validation.constraints.NotNull;

public record AttachResourceRequest(@NotNull Long fileId) {}
