# ── Stage 1: Build ──────────────────────────────────────
FROM eclipse-temurin:17-jdk-jammy AS build
WORKDIR /app

# Copiar wrapper de Maven e instalar dependencias primero (mejor caché)
COPY pom.xml .
COPY src ./src

# Usar Maven instalado en la imagen en lugar de mvnw
RUN apt-get update && apt-get install -y maven && \
    mvn clean package -DskipTests

# ── Stage 2: Runtime ────────────────────────────────────
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

COPY --from=build /app/target/fast-food-api-java-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
