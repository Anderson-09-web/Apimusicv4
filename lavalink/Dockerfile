FROM eclipse-temurin:21-jre-jammy

WORKDIR /opt/lavalink

COPY Lavalink.jar ./Lavalink.jar
COPY application.yml ./application.yml
COPY plugins ./plugins

EXPOSE 2333

CMD ["java", "-jar", "Lavalink.jar"]
