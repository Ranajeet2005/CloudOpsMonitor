
package com.ranajeet.cloudops.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ServerRequest(

        @NotBlank(message = "Hostname is required")
        String hostname,

        @NotBlank(message = "Environment is required")
        String environment,

        @NotBlank(message = "IP address is required")
        String ipAddress,

        @NotNull(message = "Status is required")
        String status

) {
}
