package com.verdesazon.api.productos;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.BAD_REQUEST)
public class InvalidProductoCategoriaException extends RuntimeException {

    public InvalidProductoCategoriaException(String message) {
        super(message);
    }
}
