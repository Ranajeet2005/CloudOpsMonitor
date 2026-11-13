INSERT INTO servers
(hostname, environment, ip_address, status,
 cpu_usage, memory_usage)
VALUES
('web-server-01', 'Development', '192.168.1.10',
 'UP', 25.5, 60.2),
('db-server-01', 'Production', '192.168.1.20',
 'UP', 40.5, 72.3);