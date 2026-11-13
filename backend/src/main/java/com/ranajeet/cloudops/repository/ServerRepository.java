
package com.ranajeet.cloudops.repository;

import com.ranajeet.cloudops.entity.Server;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ServerRepository extends JpaRepository<Server, Long> {

    boolean existsByHostnameIgnoreCase(String hostname);
}
