package com.goctrithuc.backend.config;

import com.goctrithuc.backend.entities.CourseVisibility;
import org.springframework.core.convert.converter.Converter;
import org.springframework.stereotype.Component;

@Component
public class CourseVisibilityConverter implements Converter<String, CourseVisibility> {

  @Override
  public CourseVisibility convert(String source) {
    return CourseVisibility.valueOf(source.toUpperCase());
  }
}
