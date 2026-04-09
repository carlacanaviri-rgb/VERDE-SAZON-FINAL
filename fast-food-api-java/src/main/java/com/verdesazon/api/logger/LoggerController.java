package com.verdesazon.api.logger;

import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/logs-local")
public class LoggerController {

    private final LocalLoggerService logger;

    public LoggerController(LocalLoggerService logger) {
        this.logger = logger;
    }

    @GetMapping
    public List<LogEntry> getLogs(@RequestParam(defaultValue = "50") int limite) {
        return logger.getLogs(limite);
    }

    @GetMapping("/antes-de-error")
    public List<LogEntry> getAntesDeError() {
        return logger.getUltimosAntesDeError();
    }
}

