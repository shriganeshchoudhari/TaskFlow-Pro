package com.taskflow.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LogTimeRequest {

    @NotNull(message = "Hours to log is required")
    @Min(value = 0, message = "Logged hours must be positive")
    private Double hours;
}
