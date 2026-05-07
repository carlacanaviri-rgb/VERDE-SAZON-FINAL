package com.verdesazon.api.productos;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class ProductoCategoriaCatalogTest {

    @Test
    void normalizaAliasesAlValorCanonico() {
        assertEquals("Ensalada", ProductoCategoriaCatalog.normalizeRequired(" ensaladas "));
        assertEquals("Version Vegetariana", ProductoCategoriaCatalog.normalizeRequired("vegetariano"));
        assertEquals("Smoothies", ProductoCategoriaCatalog.normalizeRequired("smoothie"));
    }

    @Test
    void rechazaCategoriasFueraDelCatalogo() {
        InvalidProductoCategoriaException exception = assertThrows(
                InvalidProductoCategoriaException.class,
                () -> ProductoCategoriaCatalog.normalizeRequired("texto libre"));

        assertTrue(exception.getMessage().contains("catalogo"));
    }
}
