package com.verdesazon.api.logger;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.BufferedWriter;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class LocalLoggerService {
    private static final String STATUS_OK = "OK";
    private static final String STATUS_ERROR = "ERROR";

    private final ObjectMapper mapper;
    private final Path logPath;

    public LocalLoggerService(ObjectMapper mapper) throws IOException {
        this.mapper = mapper;
        Path dir = Path.of("logs");
        Files.createDirectories(dir);
        this.logPath = dir.resolve("api.log");
    }

    public void log(String accion, String endpoint, Object datos) {
        log(accion, endpoint, datos, STATUS_OK);
    }

    public void log(String accion, String endpoint, Object datos, String status) {
        LogEntry entry = new LogEntry();
        entry.setFecha(Instant.now().toString());
        entry.setAccion(accion);
        entry.setEndpoint(endpoint);
        entry.setStatus(status == null ? STATUS_OK : status);
        entry.setDatos(datos);

        try (BufferedWriter writer = Files.newBufferedWriter(
                logPath,
                StandardCharsets.UTF_8,
                StandardOpenOption.CREATE,
                StandardOpenOption.APPEND)) {
            writer.write(mapper.writeValueAsString(entry));
            writer.newLine();
        } catch (IOException e) {
            System.err.println("Error escribiendo log local: " + e.getMessage());
        }
    }

    public List<LogEntry> getLogs(int limite) {
        if (limite <= 0) {
            return Collections.emptyList();
        }

        try {
            if (!Files.exists(logPath)) {
                return Collections.emptyList();
            }

            List<String> lines = Files.readAllLines(logPath, StandardCharsets.UTF_8);
            List<String> clean = lines.stream().filter(line -> !line.isBlank()).toList();
            int fromIndex = Math.max(0, clean.size() - limite);

            List<LogEntry> entries = new ArrayList<>();
            for (int i = clean.size() - 1; i >= fromIndex; i--) {
                entries.add(mapper.readValue(clean.get(i), LogEntry.class));
            }
            return entries;
        } catch (IOException e) {
            return Collections.emptyList();
        }
    }

    public List<LogEntry> getUltimosAntesDeError() {
        List<LogEntry> todos = getLogs(100);
        if (todos.isEmpty()) {
            return todos;
        }

        int indexError = -1;
        for (int i = 0; i < todos.size(); i++) {
            if (STATUS_ERROR.equals(todos.get(i).getStatus())) {
                indexError = i;
                break;
            }
        }

        if (indexError == -1) {
            return todos.stream().limit(10).toList();
        }

        return todos.subList(0, indexError + 1);
    }

    public Path getLogPath() {
        return logPath;
    }

    public LogEntry readEntry(String jsonLine) throws JsonProcessingException {
        return mapper.readValue(jsonLine, LogEntry.class);
    }
}

