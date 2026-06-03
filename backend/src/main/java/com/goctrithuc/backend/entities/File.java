package com.goctrithuc.backend.entities;

import jakarta.persistence.*;
import java.time.ZonedDateTime;

@Entity
@Table(name = "files")
public class File {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "author_id", nullable = false)
  private Long authorId;

  @Column(nullable = false)
  private String provider; // 'local'

  @Column(name = "provider_value", nullable = false)
  private String providerValue; // relative path

  @Column(name = "mime_type")
  private String mimeType;

  @Column(name = "original_name")
  private String originalName;

  @Column(name = "size_bytes")
  private Long sizeBytes;

  @Column(name = "created_at", nullable = false, updatable = false, insertable = false)
  private ZonedDateTime createdAt;

  @Column(name = "updated_at", nullable = false, insertable = false)
  private ZonedDateTime updatedAt;

  protected File() {}

  public File(Long authorId, String provider, String providerValue) {
    this.authorId = authorId;
    this.provider = provider;
    this.providerValue = providerValue;
  }

  public File(
      Long authorId,
      String provider,
      String providerValue,
      String mimeType,
      String originalName,
      Long sizeBytes) {
    this.authorId = authorId;
    this.provider = provider;
    this.providerValue = providerValue;
    this.mimeType = mimeType;
    this.originalName = originalName;
    this.sizeBytes = sizeBytes;
  }

  public Long getId() {
    return id;
  }

  public Long getAuthorId() {
    return authorId;
  }

  public String getProvider() {
    return provider;
  }

  public String getProviderValue() {
    return providerValue;
  }

  public String getMimeType() {
    return mimeType;
  }

  public void setMimeType(String mimeType) {
    this.mimeType = mimeType;
  }

  public String getOriginalName() {
    return originalName;
  }

  public void setOriginalName(String originalName) {
    this.originalName = originalName;
  }

  public Long getSizeBytes() {
    return sizeBytes;
  }

  public void setSizeBytes(Long sizeBytes) {
    this.sizeBytes = sizeBytes;
  }

  public ZonedDateTime getCreatedAt() {
    return createdAt;
  }

  public ZonedDateTime getUpdatedAt() {
    return updatedAt;
  }
}
