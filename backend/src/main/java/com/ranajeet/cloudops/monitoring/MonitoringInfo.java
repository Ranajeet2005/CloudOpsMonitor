package com.ranajeet.cloudops.monitoring;

import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/monitoring")
public class MonitoringInfo {

    @GetMapping("/summary")
    public Map<String, Object> summary() {

        return Map.of(
                "application", "CloudOpsMonitor",
                "apiStatus", "UP",
                "checkedAt", Instant.now().toString()
        );
    }
}