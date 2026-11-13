
package com.ranajeet.cloudops.service;

public class ServerNotFoundException extends RuntimeException {

    public ServerNotFoundException(String message) {
        super(message);
    }
}
