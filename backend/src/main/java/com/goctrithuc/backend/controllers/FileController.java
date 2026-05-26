package com.goctrithuc.backend.controllers;

import com.goctrithuc.backend.dtos.FileResponse;
import com.goctrithuc.backend.entities.File;
import com.goctrithuc.backend.entities.User;
import com.goctrithuc.backend.repositories.UserRepository;
import com.goctrithuc.backend.services.FileService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
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
}
