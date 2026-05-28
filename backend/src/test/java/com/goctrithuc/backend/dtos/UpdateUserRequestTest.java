package com.goctrithuc.backend.dtos;

import static org.junit.jupiter.api.Assertions.*;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class UpdateUserRequestTest {

  private Validator validator;

  @BeforeEach
  void setUp() {
    ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
    this.validator = factory.getValidator();
  }

  @Test
  void shouldPassValidationWhenRequestIsValid() {
    UpdateUserRequest request =
        new UpdateUserRequest("Valid Name", "valid_user123", "http://avatar.url");

    Set<ConstraintViolation<UpdateUserRequest>> violations = validator.validate(request);

    assertTrue(violations.isEmpty());
  }

  @Test
  void shouldFailValidationWhenDisplayNameIsTooShort() {
    UpdateUserRequest request = new UpdateUserRequest("A", "valid_user", null);

    Set<ConstraintViolation<UpdateUserRequest>> violations = validator.validate(request);

    assertFalse(violations.isEmpty());
    assertEquals(1, violations.size());
    assertTrue(
        violations.iterator().next().getMessage().contains("size must be between 2 and 100"));
  }

  @Test
  void shouldFailValidationWhenUsernameHasInvalidCharacters() {
    UpdateUserRequest request = new UpdateUserRequest("Valid Name", "invalid@user name", null);

    Set<ConstraintViolation<UpdateUserRequest>> violations = validator.validate(request);

    assertFalse(violations.isEmpty());
    boolean hasPatternViolation =
        violations.stream()
            .anyMatch(
                v ->
                    v.getMessage()
                        .equals("Username may only contain letters, numbers, and underscores"));

    assertTrue(hasPatternViolation);
  }
}
