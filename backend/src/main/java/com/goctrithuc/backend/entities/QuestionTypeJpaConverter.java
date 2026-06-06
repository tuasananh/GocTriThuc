package com.goctrithuc.backend.entities;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class QuestionTypeJpaConverter implements AttributeConverter<QuestionType, String> {

  @Override
  public String convertToDatabaseColumn(QuestionType attribute) {
    if (attribute == null) {
      return null;
    }
    return attribute.name().toLowerCase();
  }

  @Override
  public QuestionType convertToEntityAttribute(String dbData) {
    if (dbData == null) {
      return null;
    }
    return QuestionType.valueOf(dbData.toUpperCase());
  }
}
