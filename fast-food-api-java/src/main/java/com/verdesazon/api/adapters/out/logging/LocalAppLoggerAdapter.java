package com.verdesazon.api.adapters.out.logging;

import com.verdesazon.api.application.port.out.AppLoggerPort;
import com.verdesazon.api.logger.LocalLoggerService;
import org.springframework.stereotype.Component;

@Component
public class LocalAppLoggerAdapter implements AppLoggerPort {

    private final LocalLoggerService loggerService;

    public LocalAppLoggerAdapter(LocalLoggerService loggerService) {
        this.loggerService = loggerService;
    }

    @Override
    public void info(String accion, String endpoint, Object datos) {
        loggerService.log(accion, endpoint, datos);
    }

    @Override
    public void error(String accion, String endpoint, Object datos) {
        loggerService.log(accion, endpoint, datos, "ERROR");
    }
}

