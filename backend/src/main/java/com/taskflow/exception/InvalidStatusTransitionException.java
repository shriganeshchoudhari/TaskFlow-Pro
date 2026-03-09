package com.taskflow.exception;

public class InvalidStatusTransitionException extends RuntimeException {
    public InvalidStatusTransitionException(String from, String to) {
        super("Invalid status transition: " + from + " \u2192 " + to);
    }
}
