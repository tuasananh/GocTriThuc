package com.goctrithuc.backend.services;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

import com.goctrithuc.backend.entities.*;
import com.goctrithuc.backend.repositories.TestSessionRepository;
import java.time.ZonedDateTime;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

public class SessionLifecycleServiceTest {

  private TestSessionRepository testSessionRepo;
  private SessionLifecycleService service;

  @BeforeEach
  void setUp() {
    testSessionRepo = mock(TestSessionRepository.class);
    service = new SessionLifecycleService(testSessionRepo);
  }

  @Test
  void lazyAutoSubmitIfExpired_setsIsDoneAndSubmittedAt() {
    LessonTestEntity test = mock(LessonTestEntity.class);
    when(test.getTimeLimit()).thenReturn(60);

    ZonedDateTime startedAt = ZonedDateTime.now().minusSeconds(61);
    TestSessionEntity session = spy(new TestSessionEntity(null, test, startedAt));

    service.lazyAutoSubmitIfExpired(session);

    assertThat(session.isDone()).isTrue();
    assertThat(session.getSubmittedAt()).isEqualTo(startedAt.plusSeconds(60));
    verify(testSessionRepo).save(session);
  }

  @Test
  void lazyAutoSubmitIfExpired_doesNothingIfNotExpired() {
    LessonTestEntity test = mock(LessonTestEntity.class);
    when(test.getTimeLimit()).thenReturn(60);

    ZonedDateTime startedAt = ZonedDateTime.now().minusSeconds(30);
    TestSessionEntity session = spy(new TestSessionEntity(null, test, startedAt));

    service.lazyAutoSubmitIfExpired(session);

    assertThat(session.isDone()).isFalse();
    assertThat(session.getSubmittedAt()).isNull();
    verify(testSessionRepo, never()).save(any());
  }

  @Test
  void lazyAutoSubmitIfExpired_doesNothingIfAlreadyDone() {
    LessonTestEntity test = mock(LessonTestEntity.class);
    when(test.getTimeLimit()).thenReturn(60);

    ZonedDateTime startedAt = ZonedDateTime.now().minusSeconds(61);
    TestSessionEntity session = spy(new TestSessionEntity(null, test, startedAt));
    session.setDone(true);

    service.lazyAutoSubmitIfExpired(session);

    verify(testSessionRepo, never()).save(any());
  }

  @Test
  void lazyAutoSubmitIfExpired_doesNothingIfNoTimeLimit() {
    LessonTestEntity test = mock(LessonTestEntity.class);
    when(test.getTimeLimit()).thenReturn(null);

    ZonedDateTime startedAt = ZonedDateTime.now().minusSeconds(9999);
    TestSessionEntity session = spy(new TestSessionEntity(null, test, startedAt));

    service.lazyAutoSubmitIfExpired(session);

    assertThat(session.isDone()).isFalse();
    verify(testSessionRepo, never()).save(any());
  }

  @Test
  void remainingTime_calculation_is_correct() {
    LessonTestEntity test = mock(LessonTestEntity.class);
    ZonedDateTime startedAt = ZonedDateTime.now().minusSeconds(20);
    TestSessionEntity session = new TestSessionEntity(null, test, startedAt);

    long remaining = service.calculateRemainingTime(session, 60);
    assertThat(remaining).isBetween(35L, 45L);
  }

  @Test
  void remainingTime_clamps_to_zero_when_negative() {
    LessonTestEntity test = mock(LessonTestEntity.class);
    ZonedDateTime startedAt = ZonedDateTime.now().minusSeconds(100);
    TestSessionEntity session = new TestSessionEntity(null, test, startedAt);

    long remaining = service.calculateRemainingTime(session, 60);
    assertThat(remaining).isEqualTo(0);
  }

  @Test
  void remainingTime_returns_zero_for_null_timeLimit() {
    LessonTestEntity test = mock(LessonTestEntity.class);
    TestSessionEntity session = new TestSessionEntity(null, test, ZonedDateTime.now());

    long remaining = service.calculateRemainingTime(session, null);
    assertThat(remaining).isEqualTo(0);
  }

  @Test
  void remainingTime_returns_zero_for_zero_timeLimit() {
    // timeLimit <= 0 should also be treated as unlimited / no-limit
    LessonTestEntity test = mock(LessonTestEntity.class);
    TestSessionEntity session = new TestSessionEntity(null, test, ZonedDateTime.now());

    long remaining = service.calculateRemainingTime(session, 0);
    assertThat(remaining).isEqualTo(0);
  }

  @Test
  void lazyAutoSubmitIfExpired_doesNothingIfTimeLimitIsZero() {
    LessonTestEntity test = mock(LessonTestEntity.class);
    when(test.getTimeLimit()).thenReturn(0);

    ZonedDateTime startedAt = ZonedDateTime.now().minusSeconds(9999);
    TestSessionEntity session = spy(new TestSessionEntity(null, test, startedAt));

    service.lazyAutoSubmitIfExpired(session);

    assertThat(session.isDone()).isFalse();
    verify(testSessionRepo, never()).save(any());
  }
}
