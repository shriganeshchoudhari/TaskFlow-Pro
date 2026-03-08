FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /workspace

COPY pom.xml .
RUN mvn -B -q -DskipTests dependency:go-offline

COPY src ./src
RUN mvn -B -DskipTests package

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -g 1001 -S taskflow && adduser -u 1001 -S taskflow -G taskflow
COPY --from=build /workspace/target/*.jar ./app.jar

USER taskflow
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]

