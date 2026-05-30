package com.goctrithuc.backend.dtos;

import com.goctrithuc.backend.entities.File;

public record FileResponse(Long id, String filename, String url) {
  public static FileResponse from(File entity) {
    return new FileResponse(
        entity.getId(), entity.getProviderValue(), "/api/files/serve/" + entity.getId());
  }
}
