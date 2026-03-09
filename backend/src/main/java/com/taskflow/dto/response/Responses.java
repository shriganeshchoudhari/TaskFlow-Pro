package com.taskflow.dto.response;

import lombok.*;

import java.time.OffsetDateTime;
import java.util.List;

// Internal error structure — used only by GlobalExceptionHandler (package-private)
@Data @Builder @NoArgsConstructor @AllArgsConstructor
class ErrorResponse {
    private int status;
    private String error;
    private String message;
    private List<FieldError> details;
    private String path;
    private OffsetDateTime timestamp;
    private String traceId;

    @Data @AllArgsConstructor
    static class FieldError {
        private String field;
        private String message;
    }
}
