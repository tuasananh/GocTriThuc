package com.goctrithuc.backend.services;

import com.goctrithuc.backend.entities.File;
import com.goctrithuc.backend.repositories.FileRepository;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;
import org.apache.tika.Tika;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class FileService {

  private final FileRepository fileRepository;
  private final Path uploadLocation;
  private final Tika tika = new Tika();
  // The allowlist accepts every image/* subtype, which includes image/svg+xml. Uploaded SVGs can
  // contain script/active content and are served back with their content type by serveFile, so a
  // user can upload an executable SVG and expose it from the app origin. Restrict the image
  // allowlist to safe raster types (for example PNG/JPEG/WebP/GIF) or serve SVGs only as downloads
  // with a safe content disposition.
  //
  // This issue may be resolved in v2, it is out of scope for now.
  private final List<String> mimeAllowlist =
      List.of("image/", "video/", "application/pdf", "text/plain", "application/zip");

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

    String rawFilename = file.getOriginalFilename();
    if (rawFilename == null || rawFilename.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Filename is required");
    }

    String originalFilename = StringUtils.cleanPath(rawFilename);
    if (originalFilename.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid filename");
    }

    if (originalFilename.contains("..")) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid file path sequence");
    }

    String secureFilename = userId + "_" + UUID.randomUUID() + "_" + originalFilename;
    Path targetPath = this.uploadLocation.resolve(secureFilename).normalize().toAbsolutePath();
    if (!targetPath.startsWith(this.uploadLocation)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid file path");
    }

    String detectedMimeType;
    try (InputStream is = file.getInputStream()) {
      detectedMimeType = tika.detect(is);
    } catch (IOException e) {
      throw new ResponseStatusException(
          HttpStatus.INTERNAL_SERVER_ERROR, "Failed to read file signature", e);
    }

    if (detectedMimeType == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Could not determine file type");
    }

    boolean isAllowed = false;
    for (String allowedMime : mimeAllowlist) {
      if (allowedMime.endsWith("/")) {
        if (detectedMimeType.startsWith(allowedMime)) {
          isAllowed = true;
          break;
        }
      } else {
        if (detectedMimeType.equals(allowedMime)) {
          isAllowed = true;
          break;
        }
      }
    }

    if (!isAllowed) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "File type not allowed: " + detectedMimeType);
    }

    if (TransactionSynchronizationManager.isActualTransactionActive()) {
      TransactionSynchronizationManager.registerSynchronization(
          new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
              if (status == STATUS_ROLLED_BACK) {
                try {
                  Files.deleteIfExists(targetPath);
                } catch (IOException ignored) {
                }
              }
            }
          });
    }

    // 1. Ghi file xuống đĩa cứng bằng phương thức tối ưu transferTo
    try {
      file.transferTo(targetPath.toFile());
    } catch (IOException e) {
      throw new ResponseStatusException(
          HttpStatus.INTERNAL_SERVER_ERROR, "Failed to save file locally", e);
    }

    File entity =
        new File(
            userId, "local", secureFilename, detectedMimeType, originalFilename, file.getSize());
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
