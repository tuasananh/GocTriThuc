package com.goctrithuc.backend.dtos;

import com.goctrithuc.backend.entities.File;

public record FileResponse(Long id, String provider, String providerValue) {
  public static FileResponse from(File entity) {
    return new FileResponse(entity.getId(), entity.getProvider(), entity.getProviderValue());
  }
}
