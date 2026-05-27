package com.goctrithuc.backend.controllers;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oauth2Login;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.goctrithuc.backend.BaseIntegrationTest;
import com.goctrithuc.backend.entities.File;
import com.goctrithuc.backend.entities.User;
import com.goctrithuc.backend.repositories.FileRepository;
import com.goctrithuc.backend.repositories.UserRepository;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

@AutoConfigureMockMvc
public class FileControllerIntegrationTest extends BaseIntegrationTest {

  private final MockMvc mockMvc;
  private final UserRepository userRepository;
  private final FileRepository fileRepository;
  private final String uploadDir;

  @Autowired
  public FileControllerIntegrationTest(
      MockMvc mockMvc,
      UserRepository userRepository,
      FileRepository fileRepository,
      @Value("${app.upload-dir}") String uploadDir) {
    this.mockMvc = mockMvc;
    this.userRepository = userRepository;
    this.fileRepository = fileRepository;
    this.uploadDir = uploadDir;
  }

  @AfterEach
  void cleanUpFiles() {
    fileRepository
        .findAll()
        .forEach(
            file -> {
              Path path = Paths.get(uploadDir).resolve(file.getProviderValue());
              try {
                Files.deleteIfExists(path);
              } catch (IOException ignored) {
              }
            });
    fileRepository.deleteAll();
    userRepository.deleteAll();
  }

  @Test
  void shouldUploadFileWhenUserIsAuthenticated() throws Exception {
    String email = "uploader@hust.edu.vn";
    User user = userRepository.save(new User(email, "Uploader", "uploader", null));

    MockMultipartFile mockFile =
        new MockMultipartFile("file", "avatar.png", "image/png", "dummy-image-bytes".getBytes());

    mockMvc
        .perform(
            MockMvcRequestBuilders.multipart("/api/files/upload")
                .file(mockFile)
                .with(oauth2Login().attributes(attrs -> attrs.put("email", email)))
                .with(csrf()))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.id").exists())
        .andExpect(jsonPath("$.provider").value("local"))
        .andExpect(jsonPath("$.providerValue").exists())
        .andDo(print());

    // Verify metadata saved in database
    var files = fileRepository.findAll();
    assert files.size() == 1;
    File fileEntity = files.get(0);
    assert fileEntity.getAuthorId().equals(user.getId());
    assert fileEntity.getProvider().equals("local");

    // Verify physical file exists on disk
    Path filePath = Paths.get(uploadDir).resolve(fileEntity.getProviderValue());
    assert Files.exists(filePath);
  }

  @Test
  void shouldRejectUploadWhenUserIsUnauthenticated() throws Exception {
    MockMultipartFile mockFile =
        new MockMultipartFile("file", "avatar.png", "image/png", "dummy-image-bytes".getBytes());

    mockMvc
        .perform(MockMvcRequestBuilders.multipart("/api/files/upload").file(mockFile).with(csrf()))
        .andExpect(status().isUnauthorized())
        .andDo(print());
  }
}
