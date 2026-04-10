package com.verdesazon.api.application.port.out;

public interface AppLoggerPort {
    void info(String accion, String endpoint, Object datos);

    void error(String accion, String endpoint, Object datos);
}

