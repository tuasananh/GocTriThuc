package com.goctrithuc.backend.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;

@Configuration
public class JacksonConfig {

  @Bean
  @Primary
  public ObjectMapper objectMapper() {
    Jackson2ObjectMapperBuilder builder = Jackson2ObjectMapperBuilder.json();
    // Register JavaTimeModule to handle Java 8 date/time types (ZonedDateTime)
    builder.modules(new JavaTimeModule());
    // Disable writing dates as timestamps to keep ISO-8601 formats
    builder.featuresToDisable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    // Configure Long to String serialization
    builder.serializerByType(Long.class, ToStringSerializer.instance);
    builder.serializerByType(Long.TYPE, ToStringSerializer.instance);
    return builder.build();
  }

  @Bean
  public MappingJackson2HttpMessageConverter mappingJackson2HttpMessageConverter(
      ObjectMapper objectMapper) {
    return new MappingJackson2HttpMessageConverter(objectMapper);
  }
}
