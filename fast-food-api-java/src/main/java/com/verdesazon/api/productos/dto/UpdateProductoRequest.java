package com.verdesazon.api.productos.dto;

import java.util.Map;

public class UpdateProductoRequest {
    private UpdateProductoDto dto;
    private Map<String, Object> original;

    public UpdateProductoDto getDto() {
        return dto;
    }

    public void setDto(UpdateProductoDto dto) {
        this.dto = dto;
    }

    public Map<String, Object> getOriginal() {
        return original;
    }

    public void setOriginal(Map<String, Object> original) {
        this.original = original;
    }
}

