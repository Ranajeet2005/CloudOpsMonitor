CREATE TABLE IF NOT EXISTS servers (
    id BIGSERIAL PRIMARY KEY,
    hostname VARCHAR(120) NOT NULL UNIQUE,
    environment VARCHAR(40) NOT NULL,
    ip_address VARCHAR(64) NOT NULL,
    status VARCHAR(30) NOT NULL,
    cpu_usage DOUBLE PRECISION,
    memory_usage DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
);