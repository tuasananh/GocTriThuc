package com.goctrithuc.backend.entities;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class VideoProviderJpaConverter implements AttributeConverter<VideoProvider, String> {

  @Override
  public String convertToDatabaseColumn(VideoProvider attribute) {
    if (attribute == null) {
      return null;
    }
    return attribute.name().toLowerCase();
  }

  @Override
  public VideoProvider convertToEntityAttribute(String dbData) {
    if (dbData == null) {
      return null;
    }
    return VideoProvider.valueOf(dbData.toUpperCase());
  }
}
