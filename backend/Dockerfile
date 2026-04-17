# Stage 1: Build the application (Optional, but good for CI/CD)
# If you build the .jar locally, you can skip to Stage 2.

# Stage 2: Run the application
# Use the JRE (Java Runtime Environment) instead of JDK to keep the image small and secure
FROM eclipse-temurin:21-jre-alpine

# Create a non-root user for security (Prevents container breakout attacks)
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Set the working directory
WORKDIR /app

# Copy the compiled jar from your target folder into the container
COPY target/*.jar app.jar

# Expose the standard web port
EXPOSE 8080

# Run the app, explicitly telling it to use the 'prod' profile
ENTRYPOINT ["java", "-Dspring.profiles.active=prod", "-jar", "app.jar"]