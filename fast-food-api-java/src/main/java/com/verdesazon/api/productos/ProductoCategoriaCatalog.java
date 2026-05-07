package com.verdesazon.api.productos;

import java.text.Normalizer;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public final class ProductoCategoriaCatalog {

    private static final List<String> CATEGORIAS = List.of(
            "Ensalada",
            "Plato Fuerte",
            "Version Vegetariana",
            "Sopas",
            "Smoothies",
            "Bebidas",
            "Postres",
            "Bowls",
            "Wraps",
            "Snacks",
            "Hamburguesas",
            "Pizza");

    private static final Map<String, String> CATEGORIAS_POR_ALIAS = buildAliases();

    private ProductoCategoriaCatalog() {
    }

    public static List<String> allowedValues() {
        return CATEGORIAS;
    }

    public static String normalizeRequired(String categoria) {
        if (categoria == null || categoria.isBlank()) {
            throw new InvalidProductoCategoriaException("La categoria es obligatoria");
        }
        return normalizeOptional(categoria);
    }

    public static String normalizeOptional(String categoria) {
        if (categoria == null) {
            return null;
        }

        String trimmed = categoria.trim();
        if (trimmed.isBlank()) {
            throw new InvalidProductoCategoriaException("La categoria es obligatoria");
        }

        String canonical = CATEGORIAS_POR_ALIAS.get(normalizeKey(trimmed));
        if (canonical == null) {
            throw new InvalidProductoCategoriaException("La categoria debe ser una opcion valida del catalogo");
        }
        return canonical;
    }

    private static Map<String, String> buildAliases() {
        Map<String, String> aliases = new LinkedHashMap<>();
        register(aliases, "Ensalada", "ensalada", "ensaladas");
        register(aliases, "Plato Fuerte", "plato fuerte", "platos fuertes");
        register(aliases, "Version Vegetariana", "version vegetariana", "vegetariano", "vegetariana");
        register(aliases, "Sopas", "sopa", "sopas");
        register(aliases, "Smoothies", "smoothie", "smoothies");
        register(aliases, "Bebidas", "bebida", "bebidas");
        register(aliases, "Postres", "postre", "postres");
        register(aliases, "Bowls", "bowl", "bowls");
        register(aliases, "Wraps", "wrap", "wraps");
        register(aliases, "Snacks", "snack", "snacks");
        register(aliases, "Hamburguesas", "hamburguesa", "hamburguesas");
        register(aliases, "Pizza", "pizza");
        return aliases;
    }

    private static void register(Map<String, String> aliases, String canonical, String... values) {
        aliases.put(normalizeKey(canonical), canonical);
        for (String value : values) {
            aliases.put(normalizeKey(value), canonical);
        }
    }

    private static String normalizeKey(String value) {
        return Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replaceAll("\\s+", " ")
                .trim()
                .toLowerCase();
    }
}
