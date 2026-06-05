package com.goctrithuc.backend.services;

import com.goctrithuc.backend.entities.LessonTestEntity;
import com.goctrithuc.backend.entities.TestSessionEntity;
import com.goctrithuc.backend.repositories.TestSessionRepository;
import java.time.ZonedDateTime;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SessionLifecycleService {

  private final TestSessionRepository testSessionRepo;

  public SessionLifecycleService(TestSessionRepository testSessionRepo) {
    this.testSessionRepo = testSessionRepo;
  }

  /**
   * If the session's time limit has elapsed, marks it as done with submittedAt set to the exact
   * deadline (not now), then persists. No-op if session is already done or has no time limit.
   */
  @Transactional
  public void lazyAutoSubmitIfExpired(TestSessionEntity session) {
    if (session.isDone()) {
      return;
    }
    LessonTestEntity test = session.getTest();
    if (test.getTimeLimit() == null || test.getTimeLimit() <= 0) {
      return;
    }
    ZonedDateTime deadline = session.getStartedAt().plusSeconds(test.getTimeLimit());
    if (ZonedDateTime.now().isAfter(deadline)) {
      session.setDone(true);
      session.setSubmittedAt(deadline);
      testSessionRepo.save(session);
    }
  }

  /**
   * Returns the number of seconds remaining for the session, clamped to 0. Returns 0 if the session
   * is already done, or if there is no time limit.
   */
  public long calculateRemainingTime(TestSessionEntity session, Integer timeLimit) {
    if (session.isDone() || timeLimit == null || timeLimit <= 0) {
      return 0;
    }
    ZonedDateTime deadline = session.getStartedAt().plusSeconds(timeLimit);
    long remaining = deadline.toEpochSecond() - ZonedDateTime.now().toEpochSecond();
    return Math.max(0, remaining);
  }
}
