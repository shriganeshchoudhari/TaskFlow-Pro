package com.taskflow.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class CreateCommentRequest {
    @NotBlank @Size(min = 1, max = 10000)
    private String content;
}
