package com.goctrithuc.backend;

import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;

public interface TestContainers {
  @Container @ServiceConnection
  PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:18-alpine");
}
