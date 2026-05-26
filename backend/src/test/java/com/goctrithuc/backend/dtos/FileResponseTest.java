package com.goctrithuc.backend.dtos;

import static org.junit.jupiter.api.Assertions.*;

import com.goctrithuc.backend.entities.File;
import org.junit.jupiter.api.Test;

class FileResponseTest {

  @Test
  void shouldMapFileToFileResponse() {
    File file = new File(12345L, "local", "avatar_unique.png");

    FileResponse response = FileResponse.from(file);

    assertNotNull(response);
    assertEquals(file.getId(), response.id());
    assertEquals(file.getProvider(), response.provider());
    assertEquals(file.getProviderValue(), response.providerValue());
  }
}
