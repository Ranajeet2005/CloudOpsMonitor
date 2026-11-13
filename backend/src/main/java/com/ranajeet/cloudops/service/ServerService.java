
package com.ranajeet.cloudops.service;

import com.ranajeet.cloudops.dto.ServerRequest;
import com.ranajeet.cloudops.entity.Server;
import com.ranajeet.cloudops.repository.ServerRepository;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ServerService {

    private final ServerRepository serverRepository;

    public ServerService(ServerRepository serverRepository) {
        this.serverRepository = serverRepository;
    }

    public List<Server> findAll() {
        return serverRepository.findAll();
    }

    public Server findById(Long id) {
        return serverRepository.findById(id)
                .orElseThrow(() ->
                        new ServerNotFoundException("Server not found: " + id));
    }

    public Server create(ServerRequest request) {

        if (serverRepository.existsByHostnameIgnoreCase(request.hostname())) {
            throw new IllegalArgumentException("Hostname already exists");
        }

        Server server = new Server();

        server.setHostname(request.hostname());
        server.setEnvironment(request.environment());
        server.setIpAddress(request.ipAddress());
        server.setStatus(request.status());
        server.setCpuUsage(0.0);
        server.setMemoryUsage(0.0);

        return serverRepository.save(server);
    }

    public Server updateMetrics(
            Long id,
            Double cpu,
            Double memory,
            String status) {

        if (cpu == null || cpu < 0 || cpu > 100) {
            throw new IllegalArgumentException("CPU must be between 0 and 100");
        }

        if (memory == null || memory < 0 || memory > 100) {
            throw new IllegalArgumentException("Memory must be between 0 and 100");
        }

        Server server = findById(id);

        server.setCpuUsage(cpu);
        server.setMemoryUsage(memory);
        server.setStatus(status);

        return serverRepository.save(server);
    }
}
