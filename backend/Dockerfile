# Build stage: compile and package the Spring Boot application.
FROM docker.io/library/maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

COPY pom.xml .
RUN mvn -B -q -DskipTests dependency:go-offline

COPY src ./src
RUN mvn -B -q -DskipTests package

# Runtime stage: only the JRE and the executable jar.
FROM docker.io/library/eclipse-temurin:17-jre-alpine
WORKDIR /app

RUN addgroup -S app && adduser -S app -G app

COPY --from=build /app/target/payment-*.jar app.jar
RUN chown app:app app.jar

USER app
EXPOSE 8080

# Let the JVM respect the container memory limit.
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
