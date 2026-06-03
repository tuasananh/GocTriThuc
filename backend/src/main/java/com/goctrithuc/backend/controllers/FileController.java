package com.goctrithuc.backend.controllers;

import com.goctrithuc.backend.dtos.FileResponse;
import com.goctrithuc.backend.entities.File;
import com.goctrithuc.backend.entities.User;
import com.goctrithuc.backend.repositories.UserRepository;
import com.goctrithuc.backend.services.FileService;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/files")
public class FileController {

  private final FileService fileService;
  private final UserRepository userRepository;

  public FileController(FileService fileService, UserRepository userRepository) {
    this.fileService = fileService;
    this.userRepository = userRepository;
  }

  @PostMapping("/upload")
  public ResponseEntity<FileResponse> uploadFile(
      @RequestParam("file") MultipartFile file, @AuthenticationPrincipal OAuth2User principal) {
    if (principal == null) {
      throw new ResponseStatusException(
          HttpStatus.UNAUTHORIZED, "User must be logged in to upload files");
    }

    Object emailObj = principal.getAttribute("email");
    if (emailObj == null) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "Authenticated principal does not have an email");
    }

    String email = emailObj.toString();
    User user =
        userRepository
            .findByEmail(email)
            .orElseThrow(
                () ->
                    new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found in database"));

    File entity = fileService.saveToLocalDisk(user.getId(), file);
    return ResponseEntity.status(HttpStatus.CREATED).body(FileResponse.from(entity));
  }

  @GetMapping("/serve/{id}")
  public ResponseEntity<Resource> serveFile(@PathVariable Long id) {
    File fileEntity = fileService.findById(id);

    Path filePath = fileService.resolveFilePath(fileEntity.getProviderValue());

    String contentType = fileEntity.getMimeType();
    if (contentType == null || contentType.isBlank()) {
      try {
        contentType = Files.probeContentType(filePath);
      } catch (IOException ignored) {
      }
    }
    if (contentType == null || contentType.isBlank()) {
      contentType = "application/octet-stream";
    }

    Resource resource;
    try {
      resource = new UrlResource(filePath.toUri());
    } catch (java.net.MalformedURLException e) {
      throw new ResponseStatusException(
          HttpStatus.INTERNAL_SERVER_ERROR, "File path URL is malformed", e);
    }

    String originalName =
        fileEntity.getOriginalName() != null
            ? fileEntity.getOriginalName()
            : fileEntity.getProviderValue();
    String filenameEncoded =
        org.springframework.web.util.UriUtils.encode(
            originalName, java.nio.charset.StandardCharsets.UTF_8);

    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_TYPE, contentType)
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + filenameEncoded)
        .header(HttpHeaders.CACHE_CONTROL, "public, max-age=31536000")
        .body(resource);
  }
}
