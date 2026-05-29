package com.goctrithuc.backend.entities;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class CourseVisibilityJpaConverter implements AttributeConverter<CourseVisibility, String> {

  @Override
  public String convertToDatabaseColumn(CourseVisibility attribute) {
    if (attribute == null) {
      return null;
    }
    return attribute.name().toLowerCase();
  }

  @Override
  public CourseVisibility convertToEntityAttribute(String dbData) {
    if (dbData == null) {
      return null;
    }
    return CourseVisibility.valueOf(dbData.toUpperCase());
  }
}
