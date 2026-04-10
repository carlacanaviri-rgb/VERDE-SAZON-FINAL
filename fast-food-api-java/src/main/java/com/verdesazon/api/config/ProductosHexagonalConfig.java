package com.verdesazon.api.config;

import com.verdesazon.api.application.port.in.ProductosUseCase;
import com.verdesazon.api.application.port.out.AppLoggerPort;
import com.verdesazon.api.application.port.out.ProductoAuditPort;
import com.verdesazon.api.application.port.out.ProductoRepositoryPort;
import com.verdesazon.api.application.service.ProductosApplicationService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ProductosHexagonalConfig {

    @Bean
    public ProductosUseCase productosUseCase(
            ProductoRepositoryPort repository,
            ProductoAuditPort audit,
            AppLoggerPort logger) {
        return new ProductosApplicationService(repository, audit, logger);
    }
}

