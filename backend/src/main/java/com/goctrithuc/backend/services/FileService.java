package com.goctrithuc.backend.services;

import com.goctrithuc.backend.entities.File;
import com.goctrithuc.backend.repositories.FileRepository;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class FileService {

  private final FileRepository fileRepository;
  private final Path uploadLocation;

  public FileService(FileRepository fileRepository, @Value("${app.upload-dir}") String uploadDir) {
    this.fileRepository = fileRepository;
    this.uploadLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
    try {
      Files.createDirectories(this.uploadLocation);
    } catch (IOException e) {
      throw new RuntimeException("Could not initialize storage directory", e);
    }
  }

  @Transactional
  public File saveToLocalDisk(Long userId, MultipartFile file) {
    if (file.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File is empty");
    }

    String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
    if (originalFilename.contains("..")) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid file path sequence");
    }

    String secureFilename = userId + "_" + UUID.randomUUID() + "_" + originalFilename;

    try {
      Path targetPath = this.uploadLocation.resolve(secureFilename).normalize().toAbsolutePath();
      if (!targetPath.startsWith(this.uploadLocation)) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid file path");
      }
      Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
    } catch (IOException e) {
      throw new ResponseStatusException(
          HttpStatus.INTERNAL_SERVER_ERROR, "Failed to save file locally", e);
    }

    File entity = new File(userId, "local", secureFilename);
    return fileRepository.save(entity);
  }

  public File findById(Long id) {
    return fileRepository
        .findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found"));
  }

  public Path resolveFilePath(String providerValue) {
    Path filePath = this.uploadLocation.resolve(providerValue).normalize().toAbsolutePath();
    if (!filePath.startsWith(this.uploadLocation)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid file path");
    }
    if (!Files.exists(filePath)) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found on disk");
    }
    return filePath;
  }
}
