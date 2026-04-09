package com.verdesazon.api.logger;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class LocalLoggerServiceTest {

    @AfterEach
    void cleanUp() throws Exception {
        Path logPath = Path.of("logs", "api.log");
        Files.deleteIfExists(logPath);
    }

    @Test
    void shouldWriteAndReadLogsInReverseOrder() throws Exception {
        LocalLoggerService logger = new LocalLoggerService(new ObjectMapper());

        logger.log("TEST_1", "/productos", "uno");
        logger.log("TEST_2", "/productos", "dos");

        List<LogEntry> logs = logger.getLogs(10);

        Assertions.assertEquals(2, logs.size());
        Assertions.assertEquals("TEST_2", logs.get(0).getAccion());
        Assertions.assertEquals("TEST_1", logs.get(1).getAccion());
        Assertions.assertEquals("OK", logs.get(0).getStatus());
    }

    @Test
    void shouldReturnLogsUntilLastError() throws Exception {
        LocalLoggerService logger = new LocalLoggerService(new ObjectMapper());

        logger.log("TEST_OK", "/a", "ok", "OK");
        logger.log("TEST_ERROR", "/b", "error", "ERROR");
        logger.log("TEST_OLD", "/c", "old", "OK");

        List<LogEntry> beforeError = logger.getUltimosAntesDeError();

        Assertions.assertFalse(beforeError.isEmpty());
        Assertions.assertEquals("TEST_ERROR", beforeError.get(0).getAccion());
    }

    @Test
    void shouldCreateJsonLinesFile() throws Exception {
        LocalLoggerService logger = new LocalLoggerService(new ObjectMapper());
        logger.log("CREATE", "/productos", "payload");

        Path logPath = logger.getLogPath();
        Assertions.assertTrue(Files.exists(logPath));

        String content = Files.readString(logPath, StandardCharsets.UTF_8);
        Assertions.assertTrue(content.contains("\"accion\":\"CREATE\""));
    }
}

