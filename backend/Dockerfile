# Stage 1: Build the application (Optional, but good for CI/CD)
# If you build the .jar locally, you can skip to Stage 2.

# Stage 2: Run the application
# Use the JRE (Java Runtime Environment) instead of JDK to keep the image small and secure
FROM eclipse-temurin:21-jre-alpine

# Create a non-root user for security (Prevents container breakout attacks)
RUN addgroup -S spring && adduser -S spring -G spring

# Set the working directory
WORKDIR /app

# Create the uploads directory and configure permissions before switching user
RUN mkdir -p /app/uploads && chown -R spring:spring /app

USER spring:spring

# Copy the compiled jar with correct ownership
COPY --chown=spring:spring target/*.jar app.jar

# Expose the standard web port
ARG APP_PORT=8080
EXPOSE ${APP_PORT}

# Run the app, explicitly telling it to use the 'prod' profile
ENTRYPOINT ["java", "-Dspring.profiles.active=prod", "-jar", "app.jar"]