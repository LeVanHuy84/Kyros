# ==========================================
# Stage 1: Build the application using Gradle & JDK 25
# ==========================================
FROM eclipse-temurin:25-jdk-alpine AS build

# Install bash and curl which may be needed by the Gradle wrapper
RUN apk add --no-cache bash curl

WORKDIR /app

# Copy all project files
COPY . .

# Run the local Gradle wrapper to compile and build the jar
RUN ./gradlew :modules:bootstrap:bootJar --no-daemon -x test

# ==========================================
# Stage 2: Minimal runtime image for JRE 25
# ==========================================
FROM eclipse-temurin:25-jre-alpine

WORKDIR /app

# Copy the build artifact from Stage 1
COPY --from=build /app/modules/bootstrap/build/libs/*.jar app.jar

# Expose the backend port
EXPOSE 8080

# Execute the application under JRE 25 runtime with tuned memory for container platforms
ENV JAVA_OPTS="-Xmx350m -Xss256k -XX:+UseContainerSupport"
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
