
package com.ranajeet.cloudops.controller;

import com.ranajeet.cloudops.dto.ServerRequest;
import com.ranajeet.cloudops.entity.Server;
import com.ranajeet.cloudops.service.ServerService;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/servers")
public class ServerController {

    private final ServerService serverService;

    public ServerController(ServerService serverService) {
        this.serverService = serverService;
    }

    @GetMapping
    public List<Server> getAllServers() {
        return serverService.findAll();
    }

    @GetMapping("/{id}")
    public Server getServerById(@PathVariable Long id) {
        return serverService.findById(id);
    }

    @PostMapping
    public Server createServer(@Valid @RequestBody ServerRequest request) {
        return serverService.create(request);
    }

    @PutMapping("/{id}/metrics")
    public Server updateMetrics(
            @PathVariable Long id,
            @RequestParam Double cpu,
            @RequestParam Double memory,
            @RequestParam String status) {

        return serverService.updateMetrics(id, cpu, memory, status);
    }
}
